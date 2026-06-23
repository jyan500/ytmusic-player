"""
Full backend: YouTube Music metadata + live audio streaming proxy.

Endpoints
  GET /playlists                          -> your library playlists
  GET /playlists/<playlist_id>            -> tracks in a playlist
  GET /recommend?video_id=&playlist_id=   -> radio continuation (after a list ends)
  GET /stream/<video_id>                  -> progressive audio for <audio src="...">

One-time setup
  pip install flask flask-cors yt-dlp requests ytmusicapi
  ytmusicapi browser        # paste headers from one logged-in YT Music request;
                            # writes browser.json (the playlist auth, below)
  # For streaming private/age-restricted tracks, also export a cookies.txt.

Run
  python app.py             # dev server on http://localhost:5000
"""

import time
import json
import hashlib
import requests
import yt_dlp
from flask import Flask, request, jsonify, Response, stream_with_context, abort
from werkzeug.exceptions import HTTPException
from flask_cors import CORS
from ytmusicapi import YTMusic, OAuthCredentials
import os
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app)  # fine for local dev; restrict origins if you ever expose this
CLIENT_ID = os.getenv("YT_TV_CLIENT_ID")
CLIENT_SECRET_ID = os.getenv("YT_TV_CLIENT_SECRET_ID") 

# One authenticated client, reused across requests (single-user app).
BRAND_ID = "110733306637126997013"
BROWSER_JSON = "browser.json"
# Where to pull fresh cookies from. Firefox stores cookies unencrypted (no
# app-bound encryption), so extraction works even while it's open. "chrome"
# is blocked on Chrome 127+ by app-bound encryption (DPAPI decrypt fails).
COOKIE_BROWSER = "firefox"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
)


def refresh_browser_json(path=BROWSER_JSON):
    """Rewrite browser.json from the cookies currently in your logged-in browser.

    Why this works: ytmusicapi recomputes the `Authorization: SAPISIDHASH`
    header on every request from the cookie's SAPISID — it never reads a saved
    auth header. So the *only* thing that goes stale is the cookie, and the
    browser keeps its own cookie store continuously fresh while it's open. We
    pull that fresh cookie via yt-dlp and write a normal browser.json, so the
    rest of app.py is unchanged.

    Uses Firefox by default (see COOKIE_BROWSER) because Chrome 127+ app-bound
    encryption breaks yt-dlp's cookie decryption on Windows. Raises on failure
    so the caller can fall back to the existing browser.json.
    """
    with yt_dlp.YoutubeDL({"cookiesfrombrowser": (COOKIE_BROWSER,), "quiet": True}) as ydl:
        jar = ydl.cookiejar  # lazily extracts the browser's cookies
    cookies = {c.name: c.value for c in jar if "youtube.com" in (c.domain or "")}
    sapisid = cookies.get("__Secure-3PAPISID") or cookies.get("SAPISID")
    if not sapisid:
        raise RuntimeError(
            f"no YouTube auth cookie in {COOKIE_BROWSER} — log into music.youtube.com first"
        )
    # ytmusicapi tags a file as browser-auth only if an Authorization header
    # starting with "SAPISIDHASH" is present; it then recomputes this value on
    # every request from the cookie. We synthesize a valid one so detection and
    # the first request both work.
    origin = "https://music.youtube.com"
    ts = int(time.time())
    digest = hashlib.sha1(f"{ts} {sapisid} {origin}".encode()).hexdigest()
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Content-Type": "application/json",
        "Authorization": f"SAPISIDHASH {ts}_{digest}",
        "X-Goog-AuthUser": "0",
        "x-origin": origin,
        "Cookie": "; ".join(f"{k}={v}" for k, v in cookies.items()),
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(headers, f, indent=2)


try:
    refresh_browser_json()
    print(f"browser.json refreshed from {COOKIE_BROWSER} cookies")
except Exception as e:
    print(f"cookie refresh failed ({e}); using existing {BROWSER_JSON}")

yt = YTMusic(BROWSER_JSON, BRAND_ID)


# --------------------------------------------------------------------------
# error handling: always answer with JSON so the client can show a toast
# --------------------------------------------------------------------------
@app.errorhandler(HTTPException)
def handle_http_error(e):
    # abort(...) and routing errors land here; preserve the status code.
    payload = {"error": e.description or e.name}
    return jsonify(payload), e.code


@app.errorhandler(Exception)
def handle_unexpected_error(e):
    # Anything ytmusicapi/yt-dlp raises (e.g. unauthenticated browser.json)
    # becomes a clean 500 JSON error instead of an HTML stack trace.
    return jsonify({"error": str(e)}), 500


# --------------------------------------------------------------------------
# helpers
# --------------------------------------------------------------------------
def normalize_track(t):
    """Flatten a ytmusicapi track (playlist OR watch-playlist shape) into the
    minimal object the frontend needs. Returns None for unplayable entries."""
    if not t or not t.get("videoId"):
        return None
    artists = t.get("artists") or []
    names = ", ".join(a["name"] for a in artists if a and a.get("name"))
    thumbs = t.get("thumbnails") or t.get("thumbnail") or []
    return {
        "videoId": t["videoId"],
        "title": t.get("title", "Unknown title"),
        "artist": names or "Unknown artist",
        "duration": t.get("duration") or t.get("length") or "",
        "thumbnail": thumbs[-1]["url"] if thumbs else None,
        # setVideoId is the playlist-membership handle remove_playlist_items needs;
        # likeStatus drives the Now Playing thumbs. Both may be absent.
        "setVideoId": t.get("setVideoId"),
        "likeStatus": t.get("likeStatus"),
    }


def _largest_thumb(item):
    thumbs = item.get("thumbnails") or item.get("thumbnail") or []
    return thumbs[-1]["url"] if thumbs else None


def _join_artists(item):
    arts = item.get("artists") or []
    return ", ".join(a["name"] for a in arts if a and a.get("name"))


# videoTypes that aren't audio tracks. We stream audio only, but a regular
# music video's audio is fine to play — only podcast episodes are excluded.
_BLOCKED_VIDEO_TYPES = {"MUSIC_VIDEO_TYPE_PODCAST_EPISODE"}


def normalize_card(item):
    """Unify a home / search / carousel item into one card shape for the UI.

    kind in {song, album, playlist, artist}. Songs carry a videoId and play
    directly (videos are kept too and streamed audio-only); albums/playlists/
    artists carry a route id. Returns None for entries we don't surface
    (podcasts and episodes — this is an audio app)."""
    if not item:
        return None
    rtype = item.get("resultType")
    if rtype in ("episode", "podcast"):
        return None
    if item.get("videoType") in _BLOCKED_VIDEO_TYPES:
        return None

    thumb = _largest_thumb(item)
    browse_id = item.get("browseId") or ""

    # Artist: search puts the name under "artist"; related-artists use "title".
    if rtype == "artist" or (browse_id.startswith("UC") and not item.get("videoId")):
        return {
            "kind": "artist",
            "title": item.get("artist") or item.get("title") or "Unknown artist",
            "subtitle": item.get("subscribers") or "Artist",
            "thumbnail": thumb,
            "browseId": browse_id or item.get("channelId"),
        }

    # Song / video: anything with a videoId plays directly.
    if item.get("videoId"):
        subtitle = _join_artists(item) or item.get("description") or ""
        if item.get("views"):
            tail = f"{item['views']} views"
            subtitle = f"{subtitle} • {tail}" if subtitle else tail
        return {
            "kind": "song",
            "title": item.get("title", "Unknown title"),
            "subtitle": subtitle or "Song",
            "thumbnail": thumb,
            "videoId": item["videoId"],
        }

    # Album: a browseId like MPRE..., usually with a playlistId alongside.
    if rtype == "album" or browse_id.startswith("MPRE"):
        subtitle = _join_artists(item) or item.get("type") or "Album"
        if item.get("year"):
            subtitle = f"{subtitle} • {item['year']}"
        return {
            "kind": "album",
            "title": item.get("title", "Untitled"),
            "subtitle": subtitle,
            "thumbnail": thumb,
            "browseId": browse_id,
        }

    # Otherwise a playlist card: route by its id (VL-prefixed browseId from
    # search, or a bare playlistId from home) — get_playlist handles both.
    pid = browse_id or item.get("playlistId")
    if pid:
        return {
            "kind": "playlist",
            "title": item.get("title", "Untitled"),
            "subtitle": item.get("description") or item.get("author") or "Playlist",
            "thumbnail": thumb,
            "playlistId": pid,
        }
    return None


# --------------------------------------------------------------------------
# YouTube Music metadata
# --------------------------------------------------------------------------
@app.route("/playlists")
def playlists():
    items = yt.get_library_playlists(limit=50)
    return jsonify([
        {
            "playlistId": p["playlistId"],
            "title": p.get("title", "Untitled"),
            "count": p.get("count"),
            "thumbnail": (p.get("thumbnails") or [{}])[-1].get("url"),
        }
        for p in items
    ])


@app.route("/playlists/<playlist_id>")
def playlist_tracks(playlist_id):
    # limit=None pulls every track via continuations (recent ytmusicapi);
    # set a number if your version complains.
    data = yt.get_playlist(playlist_id, limit=None)
    tracks = [nt for t in data.get("tracks", []) if (nt := normalize_track(t))]
    return jsonify({"title": data.get("title", ""), "tracks": tracks})


@app.route("/playlists", methods=["POST"])
def create_playlist():
    body = request.get_json(silent=True) or {}
    title = (body.get("title") or "").strip()
    if not title:
        abort(400, "title is required")
    description = body.get("description") or ""
    privacy = body.get("privacy") or "PRIVATE"
    result = yt.create_playlist(title, description, privacy_status=privacy)
    # create_playlist returns the new playlistId string on success, or a dict
    # describing the failure (e.g. a quota/permission problem).
    if not isinstance(result, str):
        abort(502, f"could not create playlist: {result}")
    return jsonify({"playlistId": result})


@app.route("/playlists/<playlist_id>", methods=["PATCH"])
def update_playlist(playlist_id):
    body = request.get_json(silent=True) or {}
    kwargs = {}
    if body.get("title") is not None:
        kwargs["title"] = body["title"]
    if body.get("description") is not None:
        kwargs["description"] = body["description"]
    if body.get("privacy") is not None:
        kwargs["privacyStatus"] = body["privacy"]
    if not kwargs:
        abort(400, "nothing to update")
    yt.edit_playlist(playlist_id, **kwargs)
    return jsonify({"ok": True})


@app.route("/playlists/<playlist_id>", methods=["DELETE"])
def remove_playlist(playlist_id):
    yt.delete_playlist(playlist_id)
    return jsonify({"ok": True})


@app.route("/playlists/<playlist_id>/items", methods=["POST"])
def add_items(playlist_id):
    body = request.get_json(silent=True) or {}
    video_ids = body.get("videoIds") or []
    if not video_ids:
        abort(400, "videoIds is required")
    # Enforce "a song appears in a playlist at most once": reject if any
    # requested id is already present. duplicates=False below is a backstop.
    existing = yt.get_playlist(playlist_id, limit=None)
    present = {t.get("videoId") for t in existing.get("tracks", [])}
    dupe = next((vid for vid in video_ids if vid in present), None)
    if dupe:
        return jsonify({"error": "already in playlist", "duplicate": True, "videoId": dupe}), 409
    status = yt.add_playlist_items(playlist_id, video_ids, duplicates=False)
    return jsonify(status)


@app.route("/playlists/<playlist_id>/items", methods=["DELETE"])
def remove_items(playlist_id):
    body = request.get_json(silent=True) or {}
    items = body.get("items") or []
    if not items:
        abort(400, "items is required")
    # remove_playlist_items needs each item's videoId AND setVideoId.
    yt.remove_playlist_items(playlist_id, items)
    return jsonify({"ok": True})


@app.route("/rate-song", methods=["POST"])
def rate_song():
    body = request.get_json(silent=True) or {}
    video_id = body.get("videoId")
    rating = body.get("rating") or "INDIFFERENT"
    if not video_id:
        abort(400, "videoId is required")
    yt.rate_song(video_id, rating)
    return jsonify({"ok": True})


@app.route("/song/<video_id>")
def song(video_id):
    """Lazy lookup of a single song's like status, for the Now Playing thumbs
    when the track arrived without one (e.g. played from a home/search card)."""
    watch = yt.get_watch_playlist(videoId=video_id, limit=1)
    tracks = watch.get("tracks") or []
    like = tracks[0].get("likeStatus") if tracks else None
    return jsonify({"likeStatus": like})


@app.route("/recommend")
def recommend():
    """Radio continuation seeded on the last played track (+ its playlist)."""
    seed_video = request.args.get("video_id")
    seed_playlist = request.args.get("playlist_id") or None
    if not seed_video and not seed_playlist:
        abort(400, "pass video_id and/or playlist_id")

    watch = yt.get_watch_playlist(
        videoId=seed_video,
        playlistId=seed_playlist,
        radio=True,        # generate an endless radio from the seed
        limit=30,
    )
    out = []
    for t in watch.get("tracks", []):
        nt = normalize_track(t)
        if nt and nt["videoId"] != seed_video:  # don't immediately replay the seed
            out.append(nt)
    return jsonify(out)


def _cards(items):
    """Normalize a list of raw items to cards, dropping the unsurfaced ones."""
    out = []
    for it in items or []:
        card = normalize_card(it)
        if card:
            out.append(card)
    return out


@app.route("/home")
def home():
    """Homepage suggestions as side-scrolling sections of cards."""
    sections = yt.get_home(limit=4)
    out = []
    for sec in sections:
        items = _cards(sec.get("contents"))
        if items:
            out.append({"title": sec.get("title", ""), "items": items})
    return jsonify(out)


@app.route("/search")
def search():
    """Search results as a flat list of cards. Optional ?filter= narrows by
    type (songs/albums/artists/playlists); the UI also offers filter chips."""
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify([])
    filt = request.args.get("filter") or None
    return jsonify(_cards(yt.search(q, filter=filt, limit=20)))


@app.route("/search/suggestions")
def search_suggestions():
    """Autocomplete suggestions for the search box (list of strings)."""
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify([])
    return jsonify(yt.get_search_suggestions(q))


@app.route("/album/<browse_id>")
def album(browse_id):
    data = yt.get_album(browse_id)
    fallback = (data.get("thumbnails") or [{}])[-1].get("url")
    tracks = []
    for t in data.get("tracks", []):
        nt = normalize_track(t)
        if nt:
            nt["thumbnail"] = nt["thumbnail"] or fallback  # album art for bare tracks
            tracks.append(nt)
    return jsonify({
        "title": data.get("title", ""),
        "subtitle": _join_artists(data) or data.get("type", "Album"),
        "thumbnail": fallback,
        "tracks": tracks,
    })


@app.route("/artist/<channel_id>")
def artist(channel_id):
    data = yt.get_artist(channel_id)
    sections = []
    songs = []
    for t in (data.get("songs") or {}).get("results") or []:
        nt = normalize_track(t)
        if nt:
            songs.append(nt)
    if songs:
        sections.append({"title": "Songs", "kind": "tracks", "items": songs})
    for key, title in (("albums", "Albums"), ("singles", "Singles"),
                       ("videos", "Videos"), ("related", "Fans might also like")):
        cards = _cards((data.get(key) or {}).get("results"))
        if cards:
            sections.append({"title": title, "kind": "cards", "items": cards})
    return jsonify({
        "name": data.get("name", ""),
        "thumbnail": (data.get("thumbnails") or [{}])[-1].get("url"),
        "sections": sections,
    })


# --------------------------------------------------------------------------
# streaming proxy (progressive playback; Range support keeps <audio> happy)
# --------------------------------------------------------------------------
_url_cache = {}                 # video_id -> (stream_url, expires_at)
_CACHE_TTL = 60 * 60 * 5        # under the ~6h googlevideo URL lifetime

YDL_OPTS = {
    "format": "251/bestaudio[ext=webm]/bestaudio",  # opus/webm: Chrome-native
    "quiet": True,
    "no_warnings": True,
    # "cookiefile": "cookies.txt",        # comment out if you don't have one yet
    # "cookiesfrombrowser": ("chrome",),
    # On HTTP 403: install yt-dlp-get-pot + a provider, target the mweb client.
}


def resolve_stream_url(video_id, force=False):
    hit = _url_cache.get(video_id)
    if hit and not force and hit[1] > time.time():
        return hit[0]
    with yt_dlp.YoutubeDL(YDL_OPTS) as ydl:
        info = ydl.extract_info(
            f"https://music.youtube.com/watch?v={video_id}", download=False
        )
    url = info["url"]
    _url_cache[video_id] = (url, time.time() + _CACHE_TTL)
    return url


@app.route("/stream/<video_id>")
def stream(video_id):
    fwd = {"User-Agent": USER_AGENT}
    if (rng := request.headers.get("Range")):
        fwd["Range"] = rng

    def fetch(force=False):
        try:
            url = resolve_stream_url(video_id, force=force)
        except Exception as e:
            abort(502, f"extraction failed: {e}")
        return requests.get(url, headers=fwd, stream=True)

    up = fetch()
    if up.status_code == 403:
        # A cached googlevideo URL likely expired early; drop it, re-extract
        # once, and retry. Without this the dead URL stays cached for the full
        # TTL and every Range request keeps 403ing.
        up.close()
        _url_cache.pop(video_id, None)
        up = fetch(force=True)

    def generate():
        try:
            for chunk in up.iter_content(chunk_size=64 * 1024):
                if chunk:
                    yield chunk
        finally:
            up.close()

    resp = Response(stream_with_context(generate()), status=up.status_code)
    for h in ("Content-Type", "Content-Length", "Content-Range", "Accept-Ranges"):
        if h in up.headers:
            resp.headers[h] = up.headers[h]
    resp.headers.setdefault("Accept-Ranges", "bytes")
    return resp


if __name__ == "__main__":
    # threaded=True so an in-flight stream doesn't block metadata requests.
    app.run(port=5000, threaded=True)
