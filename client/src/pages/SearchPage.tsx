import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useGetSearchQuery } from "../services/api";
import Card from "../components/Card";
import TrackList from "../components/TrackList";
import type { Card as CardType, CardKind, Track } from "../types";

const FILTERS = [
    { label: "All", value: "" },
    { label: "Songs", value: "songs" },
    { label: "Albums", value: "albums" },
    { label: "Artists", value: "artists" },
    { label: "Playlists", value: "playlists" },
];

const GROUPS: { title: string; kind: CardKind }[] = [
    { title: "Albums", kind: "album" },
    { title: "Artists", kind: "artist" },
    { title: "Playlists", kind: "playlist" },
];

const toTrack = (c: CardType): Track => ({
    videoId: c.videoId!,
    title: c.title,
    artist: c.subtitle,
    duration: "",
    thumbnail: c.thumbnail,
});

export default function SearchPage() {
    const [params] = useSearchParams();
    const q = params.get("q") || "";
    const [filter, setFilter] = useState("");
    const { data, isLoading, error } = useGetSearchQuery(
        { q, filter: filter || undefined },
        { skip: !q }
    );

    if (!q) return <p className="text-stone-400">Type something to search.</p>;

    const cards = data || [];
    const songs = cards.filter((c) => c.kind === "song");

    return (
        <div>
            <div className="flex gap-2 mb-6 flex-wrap">
                {FILTERS.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            filter === f.value
                                ? "bg-amber-400 text-stone-950"
                                : "bg-stone-800 hover:bg-stone-700"
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <p className="text-stone-400">Searching…</p>
            ) : error ? (
                <p className="text-orange-400">Search failed.</p>
            ) : cards.length === 0 ? (
                <p className="text-stone-400">No results for “{q}”.</p>
            ) : (
                <>
                    {songs.length > 0 && (
                        <section className="mb-10">
                            <h2 className="font-display text-xl font-bold mb-4">Songs</h2>
                            <TrackList tracks={songs.map(toTrack)} />
                        </section>
                    )}
                    {GROUPS.map((g) => {
                        const items = cards.filter((c) => c.kind === g.kind);
                        if (!items.length) return null;
                        return (
                            <section key={g.kind} className="mb-10">
                                <h2 className="font-display text-xl font-bold mb-4">{g.title}</h2>
                                <div className="flex gap-4 flex-wrap">
                                    {items.map((c, i) => (
                                        <Card
                                            key={(c.browseId || c.playlistId || c.title) + i}
                                            card={c}
                                        />
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </>
            )}
        </div>
    );
}
