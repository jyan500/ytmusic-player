// Renders a track's / card's artists as comma-separated links to their artist
// pages. Artists without an id render as plain text; when there are no
// structured artists at all it falls back to the plain joined string.
//
// Clicking a link stops propagation so it doesn't also trigger the enclosing
// row's play/expand handler. `onNavigate` lets callers react to a link click
// (e.g. the Now Playing overlay closes itself so the artist page is visible).

import { Fragment } from "react";
import { Link } from "react-router-dom";
import type { ArtistRef } from "../types";

export default function ArtistLinks({
    artists,
    fallback,
    extra,
    onNavigate,
}: {
    artists?: ArtistRef[];
    fallback?: string;
    extra?: string;
    onNavigate?: () => void;
}) {
    if (!artists || artists.length === 0) {
        return <>{fallback}</>;
    }
    return (
        <>
            {artists.map((a, i) => (
                <Fragment key={(a.id || a.name) + i}>
                    {i > 0 && ", "}
                    {a.id ? (
                        <Link
                            to={`/artist/${a.id}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onNavigate?.();
                            }}
                            className="rounded-sm transition-colors hover:text-stone-100 hover:underline"
                        >
                            {a.name}
                        </Link>
                    ) : (
                        a.name
                    )}
                </Fragment>
            ))}
            {extra && ` • ${extra}`}
        </>
    );
}
