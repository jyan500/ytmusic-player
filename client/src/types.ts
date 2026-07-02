// Shared TypeScript types used across the app.

export type LikeStatus = "LIKE" | "DISLIKE" | "INDIFFERENT";

// A single artist with an optional channel id. `id` may be missing/null for
// artists YouTube didn't link (e.g. "Unknown artist"); those render as text.
export interface ArtistRef {
    name: string;
    id?: string | null;
}

export interface Track {
    videoId: string;
    title: string;
    artist: string;               // joined names, kept for display/fallback
    artists?: ArtistRef[];        // structured artists for per-name links
    duration: string;
    thumbnail: string | null;
    setVideoId?: string | null;   // playlist-membership handle (for removal)
    likeStatus?: LikeStatus | null;
}

export interface Playlist {
    playlistId: string;
    title: string;
    count: number | null;
    thumbnail: string | null;
}

export type CardKind = "song" | "album" | "playlist" | "artist";

// A unified card the backend emits for home / search / artist carousels.
export interface Card {
    kind: CardKind;
    title: string;
    subtitle: string;         // full combined string, kept for display/fallback
    artists?: ArtistRef[];    // structured artists (song/album) for per-name links
    extra?: string;           // non-artist tail shown after the links (views/year)
    thumbnail: string | null;
    videoId?: string;     // kind === "song"
    browseId?: string;    // kind === "album" | "artist"
    playlistId?: string;  // kind === "playlist"
}

export interface HomeSection {
    title: string;
    items: Card[];
}

export interface PlaylistData {
    title: string;
    tracks: Track[];
}

export interface AlbumData {
    title: string;
    subtitle: string;
    artists?: ArtistRef[];    // structured artists for linking the header
    thumbnail: string | null;
    tracks: Track[];
}

// Artist sections are either a track list ("tracks") or a card carousel ("cards").
export interface ArtistSection {
    title: string;
    kind: "tracks" | "cards";
    items: Track[] | Card[];
}

export interface ArtistData {
    name: string;
    thumbnail: string | null;
    sections: ArtistSection[];
}
