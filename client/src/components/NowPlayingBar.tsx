// Persistent compact player at the bottom of every page. Clicking the track
// info expands the full Now Playing screen.

import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Shuffle,
    Repeat,
    Volume2,
    VolumeX,
    Music2,
    ChevronUp,
} from "lucide-react";
import { usePlayer } from "../player/PlayerContext";
import TrackMenu from "./TrackMenu";
import RatingButtons from "./RatingButtons";

export default function NowPlayingBar({ onExpand }: { onExpand: () => void }) {
    const {
        current,
        isPlaying,
        pct,
        shuffle,
        loop,
        volume,
        index,
        togglePlay,
        prev,
        goNext,
        toggleShuffle,
        toggleLoop,
        toggleMute,
        setVolume,
    } = usePlayer();

    if (!current) return null;

    return (
        <div className="shrink-0 bg-stone-900 border-t border-stone-800">
            <div className="h-1 bg-stone-800">
                <div
                    className="h-full bg-amber-400 transition-all duration-200"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <div className="flex items-center gap-4 px-4 py-3">
                {/* track info — click to expand */}
                <button
                    onClick={onExpand}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left group"
                >
                    {current.thumbnail ? (
                        <img src={current.thumbnail} alt="" className="w-12 h-12 rounded object-cover shrink-0" />
                    ) : (
                        <div className="w-12 h-12 rounded bg-stone-800 grid place-items-center text-stone-500 shrink-0">
                            <Music2 size={18} />
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{current.title}</p>
                        <p className="text-xs text-stone-400 truncate">{current.artist}</p>
                    </div>
                    <ChevronUp
                        size={16}
                        className="text-stone-500 opacity-0 group-hover:opacity-100 transition shrink-0"
                    />
                </button>

                {/* rating + options */}
                <div className="flex items-center gap-2 shrink-0">
                    <RatingButtons size={17} />
                    <TrackMenu track={current} openUp />
                </div>

                {/* transport */}
                <div className="flex items-center gap-4 shrink-0">
                    <button
                        onClick={toggleShuffle}
                        aria-label="Shuffle"
                        aria-pressed={shuffle}
                        className={shuffle ? "text-amber-400" : "text-stone-400 hover:text-stone-100"}
                    >
                        <Shuffle size={18} />
                    </button>
                    <button
                        onClick={prev}
                        disabled={index === 0}
                        aria-label="Previous"
                        className="text-stone-400 hover:text-stone-100 disabled:opacity-30 disabled:cursor-default"
                    >
                        <SkipBack size={20} />
                    </button>
                    <button
                        onClick={togglePlay}
                        aria-label="Play or pause"
                        className="w-10 h-10 rounded-full bg-amber-400 text-stone-950 grid place-items-center hover:brightness-110 transition"
                    >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <button
                        onClick={goNext}
                        aria-label="Next"
                        className="text-stone-400 hover:text-stone-100"
                    >
                        <SkipForward size={20} />
                    </button>
                    <button
                        onClick={toggleLoop}
                        aria-label="Repeat"
                        aria-pressed={loop}
                        className={loop ? "text-amber-400" : "text-stone-400 hover:text-stone-100"}
                    >
                        <Repeat size={18} />
                    </button>
                </div>

                {/* volume */}
                <div className="hidden md:flex items-center gap-2 flex-1 justify-end">
                    <button
                        onClick={toggleMute}
                        aria-label={volume === 0 ? "Unmute" : "Mute"}
                        className="text-stone-400 hover:text-stone-100"
                    >
                        {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        aria-label="Volume"
                        className="w-24 accent-amber-400 cursor-pointer"
                    />
                </div>
            </div>
        </div>
    );
}
