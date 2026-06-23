// Kebab (⋯) menu for a track: "Add to playlist…" everywhere, plus "Remove from
// this playlist" when rendered inside a playlist (playlistId given). Owns the
// add/create modals it opens. Reuses useClickOutside to dismiss the dropdown.

import { useRef, useState } from "react";
import { MoreVertical, ListPlus, Trash2 } from "lucide-react";
import type { Track } from "../types";
import { useClickOutside } from "../hooks/useClickOutside";
import { useToast } from "./ToastProvider";
import {
    useAddPlaylistItemsMutation,
    useRemovePlaylistItemsMutation,
} from "../services/api";
import AddToPlaylistModal from "./AddToPlaylistModal";
import PlaylistFormModal from "./PlaylistFormModal";

export default function TrackMenu({
    track,
    playlistId,
    openUp = false,
}: {
    track: Track;
    playlistId?: string;
    openUp?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [addItems] = useAddPlaylistItemsMutation();
    const [removeItems] = useRemovePlaylistItemsMutation();
    const { toast } = useToast();

    useClickOutside(menuRef, () => setOpen(false));

    async function removeFromPlaylist() {
        setOpen(false);
        if (!playlistId) return;
        try {
            await removeItems({
                id: playlistId,
                items: [{ videoId: track.videoId, setVideoId: track.setVideoId }],
            }).unwrap();
            toast("Removed from playlist", "success");
        } catch {
            // global error toast handles failures
        }
    }

    // after creating a playlist from the "New playlist…" entry, drop this song in it
    async function addToNewPlaylist(newPlaylistId: string) {
        try {
            await addItems({ id: newPlaylistId, videoIds: [track.videoId] }).unwrap();
            toast("Added to playlist", "success");
        } catch {
            // global error toast handles failures
        }
    }

    // stop row-level click handlers (which start playback) from firing
    function stop(event: React.MouseEvent) {
        event.stopPropagation();
    }

    return (
        <div ref={menuRef} className="relative shrink-0" onClick={stop}>
            <button
                onClick={() => setOpen((value) => !value)}
                aria-label="Track options"
                className="text-stone-400 hover:text-stone-100 transition-colors p-1"
            >
                <MoreVertical size={18} />
            </button>

            {open && (
                <div
                    className={`absolute right-0 z-40 w-52 bg-stone-900 border border-stone-700 rounded-xl py-1.5 shadow-2xl ${
                        openUp ? "bottom-full mb-1" : "top-full mt-1"
                    }`}
                >
                    <button
                        onClick={() => {
                            setOpen(false);
                            setShowAdd(true);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-left hover:bg-stone-800 transition-colors"
                    >
                        <ListPlus size={16} className="text-stone-400 shrink-0" />
                        Add to playlist…
                    </button>
                    {playlistId && (
                        <button
                            onClick={removeFromPlaylist}
                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-left hover:bg-stone-800 transition-colors text-red-400"
                        >
                            <Trash2 size={16} className="shrink-0" />
                            Remove from this playlist
                        </button>
                    )}
                </div>
            )}

            {showAdd && (
                <AddToPlaylistModal
                    videoId={track.videoId}
                    onClose={() => setShowAdd(false)}
                    onCreateNew={() => {
                        setShowAdd(false);
                        setShowCreate(true);
                    }}
                />
            )}
            {showCreate && (
                <PlaylistFormModal
                    onClose={() => setShowCreate(false)}
                    onCreated={addToNewPlaylist}
                />
            )}
        </div>
    );
}
