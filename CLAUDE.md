# YT Music Streaming Player

A personal web app that streams your YouTube Music library with **live, play-as-it-streams** audio (no full-file download before playback). Single user, runs locally.

## Architecture

```
React SPA  ──fetch──▶  Flask backend  ──proxies bytes──▶  googlevideo
   │   <audio src>          │
   │  (browser does the     ├─ ytmusicapi: home / search / playlists /
   │   progressive          │             albums / artists / radio
   │   playback)            └─ yt-dlp: resolve a direct audio URL, then
   │                            stream it through with Range support
```

The browser's `<audio>` element handles progressive playback and buffering itself. The backend's only streaming job is to resolve a URL via yt-dlp and proxy the bytes, forwarding HTTP Range headers so playback starts within a second or two.

The client is a routed SPA. **RTK Query** owns all server data (caching/dedupe per argument); a **React Context** (`PlayerContext`) owns playback state and the single, always-mounted `<audio>` element. The player provider sits above the router, so the bottom "now playing" bar and audio survive navigation between pages.

## Layout

```
yt-music-player-v2/
├── server/
│   ├── app.py            # Flask: playlists, recommend, stream proxy
│   ├── setup.py          # one-off: verify ytmusicapi OAuth creds + account
│   ├── requirements.txt  # flask, flask-cors, yt-dlp, requests, ytmusicapi (also needs python-dotenv)
│   ├── .env              # YT_TV_CLIENT_ID / YT_TV_CLIENT_SECRET_ID (gitignore — create locally)
│   ├── browser.json      # ytmusicapi browser auth — what app.py actually uses (gitignore)
│   ├── oauth.json        # ytmusicapi OAuth token (gitignore — used by setup.py)
│   └── cookies.txt       # yt-dlp cookies (gitignore — optional, for private/age-restricted)
├── client/              # Vite + React + TypeScript + Tailwind, react-router + RTK Query
│   ├── src/
│   │   ├── main.tsx          # <Provider store><BrowserRouter><PlayerProvider>
│   │   ├── App.tsx           # <Routes> + <Layout> (sidebar + outlet + bottom bar)
│   │   ├── index.css         # Tailwind + font import + .eq equalizer keyframes
│   │   ├── types.ts          # shared TS types (Track, Card, Playlist, …)
│   │   ├── lib.ts            # BACKEND const, fmt(), shuffleRange()
│   │   ├── store.ts          # configureStore with the RTK Query reducer/middleware
│   │   ├── services/api.ts   # createApi: all endpoints + generated hooks
│   │   ├── player/PlayerContext.tsx  # playback state + actions + the <audio> element
│   │   ├── components/       # Sidebar, TopSearchBar, NowPlayingBar, NowPlayingScreen,
│   │   │                     #   Carousel, Card, TrackList
│   │   └── pages/            # HomePage, SearchPage, PlaylistPage, AlbumPage, ArtistPage
│   ├── package.json, vite.config.ts, tsconfig.json
│   └── tailwind.config.js, postcss.config.js
└── CLAUDE.md
```

## Backend endpoints (`server/app.py`)

- `GET /playlists` — your library playlists (`get_library_playlists`)
- `GET /playlists/<id>` — normalized tracks in a playlist (`get_playlist`; accepts the `VL`-prefixed `browseId` that search returns)
- `GET /home` — homepage suggestions as sections of cards (`get_home`)
- `GET /search?q=&filter=` — search results as a flat list of cards (`search`); optional `filter` (songs/albums/artists/playlists)
- `GET /search/suggestions?q=` — autocomplete strings (`get_search_suggestions`)
- `GET /album/<browse_id>` — album header + tracks (`get_album`)
- `GET /artist/<channel_id>` — artist header + sections of tracks/cards (`get_artist`)
- `GET /recommend?video_id=&playlist_id=` — radio continuation seeded on the last track (`get_watch_playlist(radio=True)`); this is what plays after a playlist ends
- `GET /stream/<video_id>` — progressive audio for `<audio src>`, with Range passthrough

`normalize_track` flattens a track; `normalize_card` unifies home/search/carousel items into one `{kind, title, subtitle, thumbnail, …}` shape (`kind` ∈ song/album/playlist/artist).

## Run

```
# server
cd server
pip install -r requirements.txt python-dotenv
ytmusicapi browser        # one-time: paste headers from a logged-in YT Music request -> browser.json
python app.py             # serves on http://localhost:5000

# client
cd client
npm install
npm run dev               # Vite, usually http://localhost:5173
```

## Key decisions (please respect — don't re-litigate)

- **Streaming, not downloading.** Never download the full file before playback. The `<audio>` element + Range-forwarding proxy is the mechanism.
- **Format:** prefer `251/bestaudio[ext=webm]/bestaudio` (Opus/WebM) — Chrome-native and streams gracefully without the MP4 moov-atom problem.
- **Cache resolved stream URLs** per `videoId` with a TTL (~5h, under the ~6h googlevideo expiry). The browser issues several Range requests per track, and `extract_info` is slow — re-extracting per request is the main perf trap.
- **Radio continuation** uses `get_watch_playlist(radio=True)`, not random picks, so it sounds like the playlist. The seed track is stripped to avoid an immediate replay.
- **No in-song seeking required** by the UX, but Range support is kept in the proxy because it's free and keeps the `<audio>` element well-behaved.
- **Audio only, but videos are kept.** Videos appear in search/artist/home results and are playable — only their audio streams, since `resolve_stream_url` always extracts `bestaudio`. Only **podcasts and episodes** are filtered out of results (`normalize_card` returns `None` for them).
- **State split (hybrid):** RTK Query for server data, React Context for playback. Player state is *not* in Redux on purpose — the `<audio>` element is imperative (refs/effects) and the ~4×/sec progress updates would flood the store. The only fetch the context does is the radio continuation, via the lazy `useLazyGetRecommendQuery` hook (it's event-driven, not render-driven).
- **Two separate credentials:** `browser.json` (ytmusicapi, for listing playlists) and `cookies.txt` (yt-dlp, only needed for private/age-restricted streaming). Don't conflate them. `app.py` constructs `YTMusic("browser.json", BRAND_ID)` — the brand account ID selects the right library when the Google account has brand accounts. An OAuth path also exists (`.env` TV-client creds + `oauth.json`, exercised by `setup.py`) but is not what `app.py` currently uses.
- **Code style:** 4-space indentation everywhere. The client is **TypeScript** (split into `components/` + `pages/`); styling is Tailwind (built-in `stone`/`amber` palette), with the font import + equalizer keyframes living in `index.css`. Icons come from `lucide-react`, not inline SVGs. In Python, avoid the walrus operator (`:=`) — use plain assignment + an existence check.

## Known gotchas / likely failure points

- **HTTP 403 on `/stream`** usually means YouTube PO-token enforcement. Fix by installing the `yt-dlp-get-pot` plugin + a PO-token provider and targeting the `mweb` client — not a bug in our code.
- **Stale cookies:** YouTube rotates cookies on normal open tabs. Export from a private/incognito window and close it *without* logging out for longer-lived cookies.
- **yt-dlp OAuth login no longer works**; cookie-based auth is the only route for private content.
- **`get_playlist(..., limit=None)`** pulls all tracks on recent ytmusicapi; pin a number if the installed version objects.

## Possible next steps (not yet built)

- Persist "currently playing" across reloads.
- Move the font + EQ keyframes into `tailwind.config` and swap `.eq` for `animate-*` utilities.
- Add an "add to queue" action (vs. replacing the queue) from cards/track rows.
