import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Play, MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
    useGetPlaylistQuery,
    useDeletePlaylistMutation,
} from "../services/api";
import TrackList from "../components/TrackList";
import PlaylistFormModal from "../components/PlaylistFormModal";
import { usePlayer } from "../player/PlayerContext";
import { useToast } from "../components/ToastProvider";
import { useClickOutside } from "../hooks/useClickOutside";

export default function PlaylistPage() {
    const { id = "" } = useParams();
    const navigate = useNavigate();
    const { data, isLoading, error } = useGetPlaylistQuery(id, { skip: !id });
    const { playTracks } = usePlayer();
    const { toast } = useToast();
    const [deletePlaylist] = useDeletePlaylistMutation();

    const [menuOpen, setMenuOpen] = useState(false);
    const [showRename, setShowRename] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    useClickOutside(menuRef, () => setMenuOpen(false));

    if (isLoading) return <p className="text-stone-400">Loading playlist…</p>;
    if (error || !data) return <p className="text-orange-400">Couldn't load that playlist.</p>;

    async function handleDelete() {
        setMenuOpen(false);
        if (!window.confirm("Delete this playlist? This can't be undone.")) return;
        try {
            await deletePlaylist(id).unwrap();
            toast("Playlist deleted", "success");
            navigate("/");
        } catch {
            // global error toast handles failures
        }
    }

    return (
        <div>
            <div className="flex items-center gap-4 mb-6 flex-wrap">
                <h1 className="font-display text-3xl font-bold">{data.title || "Playlist"}</h1>
                {data.tracks.length > 0 && (
                    <button
                        onClick={() => playTracks(data.tracks, 0, id)}
                        className="flex items-center gap-2 bg-amber-400 text-stone-950 font-semibold px-5 py-2 rounded-full hover:brightness-110 transition"
                    >
                        <Play size={18} /> Play
                    </button>
                )}

                <div ref={menuRef} className="relative">
                    <button
                        onClick={() => setMenuOpen((value) => !value)}
                        aria-label="Playlist options"
                        className="text-stone-400 hover:text-stone-100 transition-colors p-1"
                    >
                        <MoreVertical size={20} />
                    </button>
                    {menuOpen && (
                        <div className="absolute left-0 top-full mt-1 z-40 w-44 bg-stone-900 border border-stone-700 rounded-xl py-1.5 shadow-2xl">
                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    setShowRename(true);
                                }}
                                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-left hover:bg-stone-800 transition-colors"
                            >
                                <Pencil size={16} className="text-stone-400 shrink-0" />
                                Rename
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-left hover:bg-stone-800 transition-colors text-red-400"
                            >
                                <Trash2 size={16} className="shrink-0" />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <TrackList tracks={data.tracks} playlistId={id} />

            {showRename && (
                <PlaylistFormModal
                    playlist={{ id, title: data.title }}
                    onClose={() => setShowRename(false)}
                />
            )}
        </div>
    );
}
