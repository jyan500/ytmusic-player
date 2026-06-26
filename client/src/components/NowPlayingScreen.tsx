// Full-screen Now Playing view: big art, full controls, and the Up-next queue
// (including the radio continuation). Toggled from the bottom bar.

import { Fragment } from "react";
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Shuffle,
    Repeat,
    Volume2,
    VolumeX,
    Radio,
    ChevronDown,
} from "lucide-react";
import { usePlayer } from "../player/PlayerContext";
import Thumbnail from "./Thumbnail";
import TrackMenu from "./TrackMenu";
import RatingButtons from "./RatingButtons";
import { fmt } from "../lib";

export default function NowPlayingScreen({ onClose }: { onClose: () => void }) {
    const {
        current,
        queue,
        index,
        originalLen,
        isPlaying,
        isRadio,
        progress,
        pct,
        shuffle,
        loop,
        volume,
        togglePlay,
        prev,
        goNext,
        jumpTo,
        toggleShuffle,
        toggleLoop,
        toggleMute,
        setVolume,
    } = usePlayer();

    if (!current) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-stone-950 text-stone-100 overflow-y-auto"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
        >
            <div className="max-w-4xl mx-auto p-7 md:p-12">
                <button
                    onClick={onClose}
                    aria-label="Collapse"
                    className="text-stone-400 hover:text-stone-100 transition-colors mb-6"
                >
                    <ChevronDown size={26} />
                </button>

                <section className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                    <Thumbnail
                        src={current.thumbnail}
                        iconSize={48}
                        className="w-44 h-44 md:w-60 md:h-60 rounded-xl shadow-2xl"
                    />
                    <div className="flex flex-col gap-3 max-w-xl min-w-0">
                        {isRadio && (
                            <span className="self-start inline-flex items-center gap-1.5 bg-stone-800 text-amber-400 text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full">
                                <Radio size={13} /> Radio
                            </span>
                        )}
                        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight leading-tight m-0">
                            {current.title}
                        </h1>
                        <p className="text-stone-400 text-base md:text-lg m-0">{current.artist}</p>

                        <div className={isPlaying ? "eq playing mt-1" : "eq mt-1"}>
                            <span /><span /><span /><span /><span />
                        </div>

                        <div className="h-1 bg-stone-800 rounded overflow-hidden">
                            <div
                                className="h-full bg-amber-400 transition-all duration-200"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-stone-400 tabular-nums">
                            <span>{fmt(progress.current)}</span>
                            <span>{fmt(progress.duration)}</span>
                        </div>

                        <div className="flex items-center gap-5 mt-1">
                            <button
                                onClick={toggleShuffle}
                                aria-label="Shuffle"
                                aria-pressed={shuffle}
                                className={`transition-colors grid place-items-center ${
                                    shuffle ? "text-amber-400" : "text-stone-400 hover:text-stone-100"
                                }`}
                            >
                                <Shuffle size={20} />
                            </button>
                            <button
                                onClick={prev}
                                disabled={index === 0}
                                aria-label="Previous"
                                className="text-stone-400 hover:text-stone-100 disabled:opacity-30 disabled:cursor-default transition-colors grid place-items-center"
                            >
                                <SkipBack size={22} />
                            </button>
                            <button
                                onClick={togglePlay}
                                aria-label="Play or pause"
                                className="w-14 h-14 rounded-full bg-amber-400 text-stone-950 grid place-items-center hover:brightness-110 transition"
                            >
                                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                            </button>
                            <button
                                onClick={goNext}
                                aria-label="Next"
                                className="text-stone-400 hover:text-stone-100 transition-colors grid place-items-center"
                            >
                                <SkipForward size={22} />
                            </button>
                            <button
                                onClick={toggleLoop}
                                aria-label="Repeat"
                                aria-pressed={loop}
                                className={`transition-colors grid place-items-center ${
                                    loop ? "text-amber-400" : "text-stone-400 hover:text-stone-100"
                                }`}
                            >
                                <Repeat size={20} />
                            </button>

                            <RatingButtons
                                size={20}
                                buttonClassName="transition-colors grid place-items-center"
                            />
                            <TrackMenu track={current} />

                            <div className="flex items-center gap-2 ml-auto">
                                <button
                                    onClick={toggleMute}
                                    aria-label={volume === 0 ? "Unmute" : "Mute"}
                                    className="text-stone-400 hover:text-stone-100 transition-colors grid place-items-center"
                                >
                                    {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
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
                </section>

                <section className="mt-12">
                    <h2 className="text-xs uppercase tracking-widest text-stone-400 font-semibold mb-3">
                        Up next
                    </h2>
                    <ul className="max-h-96 overflow-y-auto list-none m-0 p-0">
                        {queue.map((t, i) => (
                            <Fragment key={t.videoId + i}>
                                {i === originalLen && originalLen > 0 && (
                                    <li className="flex items-center gap-3 text-amber-400 text-xs uppercase tracking-widest font-semibold pt-4 pb-2 px-3">
                                        Radio
                                        <span className="h-px flex-1 bg-stone-800" />
                                    </li>
                                )}
                                <li
                                    onClick={() => jumpTo(i)}
                                    className={`flex items-center gap-3.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                                        i === index ? "bg-stone-800" : "hover:bg-stone-800"
                                    }`}
                                >
                                    <span className="w-7 text-center text-sm text-stone-400 tabular-nums shrink-0">
                                        {i === index ? (
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
                                        ) : (
                                            i + 1
                                        )}
                                    </span>
                                    <span className={`flex-1 text-sm truncate ${i === index ? "text-amber-400" : ""}`}>
                                        {t.title}
                                    </span>
                                    <span className="hidden md:block text-sm text-stone-400 shrink-0">
                                        {t.artist}
                                    </span>
                                    <span className="text-sm text-stone-400 tabular-nums shrink-0">
                                        {t.duration}
                                    </span>
                                </li>
                            </Fragment>
                        ))}
                    </ul>
                </section>
            </div>
        </div>
    );
}
