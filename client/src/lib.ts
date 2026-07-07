// App-wide constants and small helper functions.

import type { Track } from "./types";

export const BACKEND = "http://192.168.1.66:5000";

export const fmt = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

// Fisher-Yates shuffle of tracks in [start, end), leaving the rest untouched.
export function shuffleRange(tracks: Track[], start: number, end: number): Track[] {
    const next = [...tracks];
    for (let i = end - 1; i > start; i--) {
        const j = start + Math.floor(Math.random() * (i - start + 1));
        [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
}
