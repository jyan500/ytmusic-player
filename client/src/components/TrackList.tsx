// A clickable list of tracks (playlist / album / artist songs / search songs).
// Clicking a row plays the whole list starting at that track.

import type { Track } from "../types";
import { usePlayer } from "../player/PlayerContext";
import TrackMenu from "./TrackMenu";
import Thumbnail from "./Thumbnail";

export default function TrackList({
    tracks,
    playlistId,
}: {
    tracks: Track[];
    playlistId?: string;
}) {
    const { current, playTracks } = usePlayer();

    return (
        <ul className="list-none m-0 p-0">
            {tracks.map((t, i) => {
                const active = !!current && current.videoId === t.videoId;
                return (
                    <li
                        key={t.videoId + i}
                        onClick={() => playTracks(tracks, i, playlistId)}
                        className={`flex items-center gap-3.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                            active ? "bg-stone-800" : "hover:bg-stone-800"
                        }`}
                    >
                        <span className="w-6 text-center text-sm text-stone-400 tabular-nums shrink-0">
                            {active ? (
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
                            ) : (
                                i + 1
                            )}
                        </span>
                        <Thumbnail src={t.thumbnail} iconSize={16} className="w-10 h-10 rounded shrink-0" />
                        <span className={`flex-1 text-sm truncate ${active ? "text-amber-400" : ""}`}>
                            {t.title}
                        </span>
                        <span className="hidden md:block flex-1 text-sm text-stone-400 truncate">
                            {t.artist}
                        </span>
                        <span className="text-sm text-stone-400 tabular-nums shrink-0">
                            {t.duration}
                        </span>
                        <TrackMenu track={t} playlistId={playlistId} />
                    </li>
                );
            })}
        </ul>
    );
}
