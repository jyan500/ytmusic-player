// Shared TypeScript types used across the app.

export type LikeStatus = "LIKE" | "DISLIKE" | "INDIFFERENT";

export interface Track {
    videoId: string;
    title: string;
    artist: string;
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
    subtitle: string;
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
