import { useNavigate, useParams } from "react-router-dom";
import { Shuffle, Radio } from "lucide-react";
import {
    useGetArtistQuery,
    useLazyGetPlaylistQuery,
    useLazyGetRecommendQuery,
} from "../services/api";
import TrackList from "../components/TrackList";
import Carousel from "../components/Carousel";
import Thumbnail from "../components/Thumbnail";
import { usePlayer } from "../player/PlayerContext";
import { shuffleRange } from "../lib";
import type { ArtistSection, Card, Track } from "../types";

export default function ArtistPage() {
    const { id = "" } = useParams();
    const navigate = useNavigate();
    const { data, isLoading, error } = useGetArtistQuery(id, { skip: !id });
    const { playTracks } = usePlayer();
    const [fetchPlaylist] = useLazyGetPlaylistQuery();
    const [fetchRecommend] = useLazyGetRecommendQuery();

    if (isLoading) return <p className="text-stone-400">Loading artist…</p>;
    if (error || !data) return <p className="text-orange-400">Couldn't load that artist.</p>;

    const songsSection = data.sections.find((s) => s.kind === "tracks");
    const songs = (songsSection?.items as Track[]) || [];
    const songsBrowseId = songsSection?.browseId || null;

    // The artist payload only carries the first few top songs; when a "see all"
    // playlist exists, pull the full list so Shuffle/Mix work off everything.
    async function fullSongs(): Promise<Track[]> {
        if (!songsBrowseId) return songs;
        try {
            const pl = await fetchPlaylist(songsBrowseId).unwrap();
            return pl.tracks.length ? pl.tracks : songs;
        } catch {
            return songs;
        }
    }

    // Shuffle: play the top songs in a random order.
    async function handleShuffle() {
        const all = await fullSongs();
        if (!all.length) return;
        playTracks(shuffleRange(all, 0, all.length), 0);
    }

    // Mix: a radio branching out from the top songs (similar tracks).
    async function handleMix() {
        if (!songs.length) return;
        try {
            const recs = await fetchRecommend({ videoId: songs[0].videoId }).unwrap();
            if (recs.length) {
                playTracks(recs, 0);
                return;
            }
        } catch {
            // fall through to just playing the top songs
        }
        const all = await fullSongs();
        if (all.length) playTracks(all, 0);
    }

    return (
        <div>
            <div className="flex items-center gap-5 mb-6">
                <Thumbnail src={data.thumbnail} iconSize={36} className="w-28 h-28 rounded-full shadow-xl" />
                <h1 className="font-display text-4xl font-bold">{data.name}</h1>
            </div>

            {songs.length > 0 && (
                <div className="flex items-center gap-3 mb-8">
                    <button
                        onClick={handleShuffle}
                        className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 font-semibold px-5 py-2 rounded-full transition"
                    >
                        <Shuffle size={18} /> Shuffle
                    </button>
                    <button
                        onClick={handleMix}
                        className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 font-semibold px-5 py-2 rounded-full transition"
                    >
                        <Radio size={18} /> Mix
                    </button>
                </div>
            )}

            {data.sections.map((s: ArtistSection, i) =>
                s.kind === "tracks" ? (
                    <section key={i} className="mb-10">
                        <h2 className="font-display text-xl font-bold mb-4">{s.title}</h2>
                        <TrackList tracks={s.items as Track[]} />
                        {s.browseId && (
                            <button
                                onClick={() =>
                                    navigate(`/artist/${encodeURIComponent(id)}/songs`, {
                                        state: { browseId: s.browseId, name: data.name },
                                    })
                                }
                                className="mt-3 bg-stone-800 hover:bg-stone-700 text-sm font-semibold px-4 py-2 rounded-full transition"
                            >
                                Show all
                            </button>
                        )}
                    </section>
                ) : (
                    <Carousel key={i} title={s.title} items={s.items as Card[]} />
                )
            )}
        </div>
    );
}
