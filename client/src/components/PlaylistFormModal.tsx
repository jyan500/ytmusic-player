// Create a new playlist, or rename an existing one (when `playlist` is passed,
// the form is prefilled and submits an edit instead of a create).

import { useState } from "react";
import Modal from "./Modal";
import { useToast } from "./ToastProvider";
import {
    useCreatePlaylistMutation,
    useEditPlaylistMutation,
} from "../services/api";

interface ExistingPlaylist {
    id: string;
    title: string;
}

export default function PlaylistFormModal({
    playlist,
    onClose,
    onCreated,
}: {
    playlist?: ExistingPlaylist;
    onClose: () => void;
    onCreated?: (playlistId: string) => void;
}) {
    const isEdit = !!playlist;
    const [title, setTitle] = useState(playlist?.title ?? "");
    const [createPlaylist, { isLoading: creating }] = useCreatePlaylistMutation();
    const [editPlaylist, { isLoading: editing }] = useEditPlaylistMutation();
    const { toast } = useToast();
    const busy = creating || editing;

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        const trimmed = title.trim();
        if (!trimmed) return;
        try {
            if (isEdit && playlist) {
                await editPlaylist({ id: playlist.id, title: trimmed }).unwrap();
                toast("Playlist renamed", "success");
            } else {
                const result = await createPlaylist({ title: trimmed }).unwrap();
                toast("Playlist created", "success");
                onCreated?.(result.playlistId);
            }
            onClose();
        } catch {
            // error toast fires globally via the store middleware
        }
    }

    return (
        <Modal title={isEdit ? "Rename playlist" : "New playlist"} onClose={onClose}>
            <form onSubmit={submit} className="flex flex-col gap-4">
                <input
                    autoFocus
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Playlist name"
                    className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-stone-500 transition-colors"
                />
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-full text-sm text-stone-300 hover:bg-stone-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={busy || !title.trim()}
                        className="px-5 py-2 rounded-full bg-amber-400 text-stone-950 font-semibold text-sm hover:brightness-110 transition disabled:opacity-40 disabled:cursor-default"
                    >
                        {isEdit ? "Save" : "Create"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
