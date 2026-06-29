// Owns all playback state and the single, always-mounted <audio> element.
// Mounted above the router so playback survives navigation. Server data is
// fetched by pages via RTK Query and handed here through playTracks/playTrack;
// the only fetch this context does is the imperative radio continuation.

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { BACKEND, shuffleRange } from "../lib";
import type { LikeStatus, Track } from "../types";
import {
    useLazyGetRecommendQuery,
    useLazyGetSongQuery,
    useRateSongMutation,
} from "../services/api";
import { useToast } from "../components/ToastProvider";

interface Progress {
    current: number;
    duration: number;
}

interface PlayerValue {
    queue: Track[];
    index: number;
    current: Track | null;
    isPlaying: boolean;
    progress: Progress;
    pct: number;
    shuffle: boolean;
    loop: boolean;
    volume: number;
    originalLen: number;
    isRadio: boolean;
    likeStatus: LikeStatus;
    playTracks: (tracks: Track[], startIndex?: number, playlistId?: string) => void;
    playTrack: (track: Track) => void;
    goNext: () => void;
    prev: () => void;
    jumpTo: (index: number) => void;
    togglePlay: () => void;
    toggleShuffle: () => void;
    toggleLoop: () => void;
    toggleMute: () => void;
    setVolume: (value: number) => void;
    rate: (status: LikeStatus) => void;
}

const PlayerContext = createContext<PlayerValue | null>(null);

export function usePlayer(): PlayerValue {
    const ctx = useContext(PlayerContext);
    if (!ctx) throw new Error("usePlayer must be used within <PlayerProvider>");
    return ctx;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
    const audioRef = useRef<HTMLAudioElement>(null);

    const [queue, setQueue] = useState<Track[]>([]);
    const [originalLen, setOriginalLen] = useState(0); // where radio begins
    const [index, setIndex] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState<Progress>({ current: 0, duration: 0 });
    const [shuffle, setShuffle] = useState(false);
    const [loop, setLoop] = useState(false);
    const [volume, setVolumeState] = useState(.5);
    const [radioSeedPlaylistId, setRadioSeedPlaylistId] = useState<string | null>(null);
    const [likeStatus, setLikeStatus] = useState<LikeStatus>("INDIFFERENT");
    const lastVolume = useRef(1); // restore point for unmuting

    const [triggerRecommend] = useLazyGetRecommendQuery();
    const [triggerGetSong] = useLazyGetSongQuery();
    const [rateSong] = useRateSongMutation();
    const { toast } = useToast();

    const current = index >= 0 ? queue[index] : null;
    const isRadio = originalLen > 0 && index >= originalLen;
    const pct = progress.duration ? (progress.current / progress.duration) * 100 : 0;

    // when the track changes, play it (the initial click unlocks autoplay)
    useEffect(() => {
        const a = audioRef.current;
        if (a && current) a.play().catch(() => {});
    }, [index, queue]);

    // keep the audio element's volume in sync
    useEffect(() => {
        const a = audioRef.current;
        if (a) a.volume = volume;
    }, [volume]);

    // warm the backend URL cache for the next queued track while this one plays,
    // so its /stream request skips the slow yt-dlp extraction. Best-effort and
    // fire-and-forget; we de-dupe so a re-render doesn't re-hit the same id.
    const prefetched = useRef<Set<string>>(new Set());
    useEffect(() => {
        const next = queue[index + 1];
        if (!next || prefetched.current.has(next.videoId)) return;
        prefetched.current.add(next.videoId);
        fetch(`${BACKEND}/prefetch/${next.videoId}`).catch(() => {});
    }, [index, queue]);

    // reflect the current track's real rating: use the value it arrived with,
    // otherwise look it up lazily (e.g. songs played from a home/search card)
    useEffect(() => {
        if (!current) {
            setLikeStatus("INDIFFERENT");
            return;
        }
        if (current.likeStatus) {
            setLikeStatus(current.likeStatus);
            return;
        }
        let cancelled = false;
        setLikeStatus("INDIFFERENT");
        triggerGetSong(current.videoId)
            .unwrap()
            .then((data) => {
                if (!cancelled && data.likeStatus) setLikeStatus(data.likeStatus);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [current?.videoId, triggerGetSong]);

    function playTracks(tracks: Track[], startIndex = 0, playlistId?: string) {
        let q = tracks;
        // "play all" from the top reshuffles the whole list when shuffle is on;
        // clicking a specific row keeps order so the picked track plays.
        if (shuffle && startIndex === 0 && tracks.length > 1) {
            q = shuffleRange(tracks, 0, tracks.length);
        }
        setRadioSeedPlaylistId(playlistId ?? null);
        setQueue(q);
        setOriginalLen(q.length);
        setIndex(q.length ? startIndex : -1);
    }

    // play a single song as a one-item queue; goNext extends it with radio
    function playTrack(track: Track) {
        setRadioSeedPlaylistId(null);
        setQueue([track]);
        setOriginalLen(1);
        setIndex(0);
    }

    async function goNext() {
        if (index < queue.length - 1) {
            setIndex(index + 1);
            return;
        }
        // end of queue -> extend with a radio continuation
        const last = queue[index];
        if (!last) return;
        try {
            const recs = await triggerRecommend({
                videoId: last.videoId,
                playlistId: radioSeedPlaylistId || undefined,
            }).unwrap();
            if (recs && recs.length) {
                setQueue((q) => [...q, ...recs]);
                setIndex((i) => i + 1);
            } else {
                setIsPlaying(false);
            }
        } catch {
            setIsPlaying(false);
        }
    }

    const prev = () => index > 0 && setIndex(index - 1);
    const jumpTo = (i: number) => setIndex(i);

    // toggle shuffle; when turning it on, reshuffle the not-yet-played playlist
    // tracks (radio tracks, appended later, are left in place)
    function toggleShuffle() {
        setShuffle((on) => {
            const next = !on;
            if (next) {
                const end = originalLen > 0 ? originalLen : queue.length;
                if (end - index > 2) {
                    setQueue((q) => shuffleRange(q, index + 1, end));
                }
            }
            return next;
        });
    }

    function setVolume(v: number) {
        setVolumeState(v);
    }

    function toggleMute() {
        setVolumeState((v) => {
            if (v > 0) {
                lastVolume.current = v;
                return 0;
            }
            return lastVolume.current || 1;
        });
    }

    const toggleLoop = () => setLoop((on) => !on);

    function togglePlay() {
        const a = audioRef.current;
        if (!a) return;
        if (a.paused) a.play();
        else a.pause();
    }

    // natural track-end: replay the current track when looping, otherwise
    // advance the queue. The manual Next button always advances (calls goNext).
    function onEnded() {
        const a = audioRef.current;
        if (loop && a) {
            a.currentTime = 0;
            a.play().catch(() => {});
            return;
        }
        goNext();
    }

    function onTime() {
        const a = audioRef.current;
        if (a) setProgress({ current: a.currentTime || 0, duration: a.duration || 0 });
    }

    // thumbs up/down for the current track; clicking the active state un-rates it
    async function rate(status: LikeStatus) {
        if (!current) return;
        const next = likeStatus === status ? "INDIFFERENT" : status;
        setLikeStatus(next); // optimistic
        try {
            await rateSong({ videoId: current.videoId, rating: next }).unwrap();
            const message =
                next === "LIKE"
                    ? "Liked song"
                    : next === "DISLIKE"
                    ? "Disliked song"
                    : "Removed rating";
            toast(message, "success");
        } catch {
            setLikeStatus(likeStatus); // revert; the error toast fires globally
        }
    }

    function onAudioError() {
        if (current) {
            toast(
                `Couldn't stream "${current.title}" — it may be unavailable or blocked.`,
                "error",
            );
        }
    }

    const value: PlayerValue = {
        queue,
        index,
        current,
        isPlaying,
        progress,
        pct,
        shuffle,
        loop,
        volume,
        originalLen,
        isRadio,
        likeStatus,
        playTracks,
        playTrack,
        goNext,
        prev,
        jumpTo,
        togglePlay,
        toggleShuffle,
        toggleLoop,
        toggleMute,
        setVolume,
        rate,
    };

    return (
        <PlayerContext.Provider value={value}>
            {children}
            <audio
                ref={audioRef}
                src={current ? `${BACKEND}/stream/${current.videoId}` : undefined}
                onEnded={onEnded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={onTime}
                onLoadedMetadata={onTime}
                onError={onAudioError}
            />
        </PlayerContext.Provider>
    );
}
