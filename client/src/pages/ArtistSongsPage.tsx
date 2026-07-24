// The "Show all" destination from an artist page: the full list of an artist's
// top songs. The browseId of the "see all" playlist is passed via router state;
// on a cold load (reload / shared link) we recover it from the artist payload.

import { useLocation, useParams } from "react-router-dom";
import { Play, Shuffle } from "lucide-react";
import {
    useGetArtistQuery,
    useGetPlaylistQuery,
} from "../services/api";
import TrackList from "../components/TrackList";
import { usePlayer } from "../player/PlayerContext";
import { shuffleRange } from "../lib";

export default function ArtistSongsPage() {
    const { id = "" } = useParams();
    const location = useLocation();
    const { playTracks } = usePlayer();

    const state = (location.state as { browseId?: string; name?: string }) || {};

    // Recover the browseId from the artist payload when router state is absent
    // (e.g. after a reload). Skipped entirely when state already carries it.
    const { data: artist } = useGetArtistQuery(id, { skip: !id || !!state.browseId });
    const recoveredBrowseId = artist?.sections.find((s) => s.kind === "tracks")?.browseId || undefined;

    const browseId = state.browseId || recoveredBrowseId;
    const name = state.name || artist?.name;

    const { data, isLoading, error } = useGetPlaylistQuery(browseId || "", { skip: !browseId });

    if (!browseId && artist) return <p className="text-orange-400">No songs to show.</p>;
    if (isLoading || !browseId) return <p className="text-stone-400">Loading songs…</p>;
    if (error || !data) return <p className="text-orange-400">Couldn't load those songs.</p>;

    const tracks = data.tracks;

    return (
        <div>
            <p className="text-sm text-stone-400 mb-1">{name}</p>
            <div className="flex items-center gap-4 mb-6 flex-wrap">
                <h1 className="font-display text-3xl font-bold">Top songs</h1>
                {tracks.length > 0 && (
                    <>
                        <button
                            onClick={() => playTracks(tracks, 0)}
                            className="flex items-center gap-2 bg-amber-400 text-stone-950 font-semibold px-5 py-2 rounded-full hover:brightness-110 transition"
                        >
                            <Play size={18} /> Play
                        </button>
                        <button
                            onClick={() => playTracks(shuffleRange(tracks, 0, tracks.length), 0)}
                            className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 font-semibold px-5 py-2 rounded-full transition"
                        >
                            <Shuffle size={18} /> Shuffle
                        </button>
                    </>
                )}
            </div>
            <TrackList tracks={tracks} />
        </div>
    );
}
