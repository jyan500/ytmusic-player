// RTK Query api slice: owns all server data fetching + caching. Each endpoint
// generates a hook (e.g. useGetHomeQuery); /recommend is also exposed lazily
// because the player triggers it imperatively on track end, not at render.

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BACKEND } from "../lib";
import type {
    AlbumData,
    ArtistData,
    Card,
    HomeSection,
    LikeStatus,
    Playlist,
    PlaylistData,
    Track,
} from "../types";

export const api = createApi({
    reducerPath: "api",
    baseQuery: fetchBaseQuery({ baseUrl: BACKEND }),
    tagTypes: ["Playlists", "Playlist"],
    endpoints: (build) => ({
        getPlaylists: build.query<Playlist[], void>({
            query: () => "/playlists",
            providesTags: ["Playlists"],
        }),
        getHome: build.query<HomeSection[], void>({
            query: () => "/home",
        }),
        getPlaylist: build.query<PlaylistData, string>({
            query: (id) => `/playlists/${encodeURIComponent(id)}`,
            providesTags: (_result, _error, id) => [{ type: "Playlist", id }],
        }),
        getAlbum: build.query<AlbumData, string>({
            query: (id) => `/album/${encodeURIComponent(id)}`,
        }),
        getArtist: build.query<ArtistData, string>({
            query: (id) => `/artist/${encodeURIComponent(id)}`,
        }),
        getSearch: build.query<Card[], { q: string; filter?: string }>({
            query: ({ q, filter }) => {
                const params = new URLSearchParams({ q });
                if (filter) params.set("filter", filter);
                return `/search?${params.toString()}`;
            },
        }),
        getSuggestions: build.query<string[], string>({
            query: (q) => `/search/suggestions?q=${encodeURIComponent(q)}`,
        }),
        getRecommend: build.query<Track[], { videoId: string; playlistId?: string }>({
            query: ({ videoId, playlistId }) => {
                const params = new URLSearchParams({ video_id: videoId });
                if (playlistId) params.set("playlist_id", playlistId);
                return `/recommend?${params.toString()}`;
            },
        }),
        // Lazy fallback for the Now Playing thumbs when a track has no likeStatus.
        getSong: build.query<{ likeStatus: LikeStatus | null }, string>({
            query: (videoId) => `/song/${encodeURIComponent(videoId)}`,
        }),

        // ---- write actions (mutations) ----
        rateSong: build.mutation<{ ok: boolean }, { videoId: string; rating: LikeStatus }>({
            query: (body) => ({ url: "/rate-song", method: "POST", body }),
        }),
        createPlaylist: build.mutation<
            { playlistId: string },
            { title: string; description?: string; privacy?: string }
        >({
            query: (body) => ({ url: "/playlists", method: "POST", body }),
            invalidatesTags: ["Playlists"],
        }),
        editPlaylist: build.mutation<
            { ok: boolean },
            { id: string; title?: string; description?: string; privacy?: string }
        >({
            query: ({ id, ...body }) => ({
                url: `/playlists/${encodeURIComponent(id)}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => ["Playlists", { type: "Playlist", id }],
        }),
        deletePlaylist: build.mutation<{ ok: boolean }, string>({
            query: (id) => ({ url: `/playlists/${encodeURIComponent(id)}`, method: "DELETE" }),
            invalidatesTags: ["Playlists"],
        }),
        addPlaylistItems: build.mutation<unknown, { id: string; videoIds: string[] }>({
            query: ({ id, videoIds }) => ({
                url: `/playlists/${encodeURIComponent(id)}/items`,
                method: "POST",
                body: { videoIds },
            }),
            invalidatesTags: (_result, _error, { id }) => [{ type: "Playlist", id }, "Playlists"],
        }),
        removePlaylistItems: build.mutation<
            { ok: boolean },
            { id: string; items: { videoId: string; setVideoId?: string | null }[] }
        >({
            query: ({ id, items }) => ({
                url: `/playlists/${encodeURIComponent(id)}/items`,
                method: "DELETE",
                body: { items },
            }),
            invalidatesTags: (_result, _error, { id }) => [{ type: "Playlist", id }, "Playlists"],
        }),
    }),
});

export const {
    useGetPlaylistsQuery,
    useGetHomeQuery,
    useGetPlaylistQuery,
    useLazyGetPlaylistQuery,
    useGetAlbumQuery,
    useGetArtistQuery,
    useGetSearchQuery,
    useGetSuggestionsQuery,
    useLazyGetRecommendQuery,
    useLazyGetSongQuery,
    useRateSongMutation,
    useCreatePlaylistMutation,
    useEditPlaylistMutation,
    useDeletePlaylistMutation,
    useAddPlaylistItemsMutation,
    useRemovePlaylistItemsMutation,
} = api;
