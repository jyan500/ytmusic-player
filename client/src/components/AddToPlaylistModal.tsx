// Pick one of the user's playlists to add a song to. The backend rejects a
// song that's already present (HTTP 409); we surface that as an info toast and
// keep the modal open so another playlist can be chosen.

import { Plus } from "lucide-react";
import Modal from "./Modal";
import Thumbnail from "./Thumbnail";
import { useToast } from "./ToastProvider";
import {
    useGetPlaylistsQuery,
    useAddPlaylistItemsMutation,
} from "../services/api";

export default function AddToPlaylistModal({
    videoId,
    onClose,
    onCreateNew,
}: {
    videoId: string;
    onClose: () => void;
    onCreateNew: () => void;
}) {
    const { data: playlists, isLoading } = useGetPlaylistsQuery();
    const [addItems, { isLoading: adding }] = useAddPlaylistItemsMutation();
    const { toast } = useToast();

    async function add(playlistId: string) {
        try {
            await addItems({ id: playlistId, videoIds: [videoId] }).unwrap();
            toast("Added to playlist", "success");
            onClose();
        } catch (error) {
            const status = (error as { status?: number | string })?.status;
            if (status === 409) {
                toast("Already in this playlist", "info");
            }
            // any other error is handled by the global error toast
        }
    }

    return (
        <Modal title="Add to playlist" onClose={onClose}>
            <button
                onClick={onCreateNew}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-stone-800 transition-colors text-sm text-left mb-1"
            >
                <span className="w-10 h-10 rounded grid place-items-center bg-stone-800 text-amber-400 shrink-0">
                    <Plus size={18} />
                </span>
                <span className="font-medium">New playlist…</span>
            </button>

            {isLoading ? (
                <p className="text-stone-400 text-sm px-3 py-2">Loading playlists…</p>
            ) : (
                <ul className="list-none m-0 p-0 max-h-80 overflow-y-auto">
                    {playlists?.map((playlist) => (
                        <li key={playlist.playlistId}>
                            <button
                                onClick={() => add(playlist.playlistId)}
                                disabled={adding}
                                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-stone-800 transition-colors text-sm text-left disabled:opacity-50"
                            >
                                <Thumbnail src={playlist.thumbnail} iconSize={16} className="w-10 h-10 rounded shrink-0" />
                                <span className="flex-1 truncate font-medium">{playlist.title}</span>
                                {playlist.count != null && (
                                    <span className="text-xs text-stone-400 shrink-0">
                                        {playlist.count}
                                    </span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </Modal>
    );
}
