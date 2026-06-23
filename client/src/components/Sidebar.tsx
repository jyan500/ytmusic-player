// Persistent left nav: Home link + the user's library playlists.

import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Home, Music2, Plus } from "lucide-react";
import { useGetPlaylistsQuery } from "../services/api";
import PlaylistFormModal from "./PlaylistFormModal";

const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex justify-between items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive ? "bg-stone-800 text-amber-400" : "hover:bg-stone-800"
    }`;

export default function Sidebar() {
    const { data: playlists, isLoading, error } = useGetPlaylistsQuery();
    const [showCreate, setShowCreate] = useState(false);

    return (
        <aside className="w-60 shrink-0 bg-stone-900 border-r border-stone-800 p-5 flex flex-col gap-3 overflow-y-auto">
            <div className="flex items-center gap-2 px-1 mb-1">
                <Music2 size={18} className="text-amber-400" />
                <span className="font-display font-semibold text-sm tracking-wide">YT Music</span>
            </div>

            <NavLink to="/" end className={linkClass}>
                <span className="flex items-center gap-3 font-medium">
                    <Home size={18} /> Home
                </span>
            </NavLink>

            <div className="flex items-center justify-between px-3 mt-2">
                <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold">
                    Library
                </span>
                <button
                    onClick={() => setShowCreate(true)}
                    aria-label="New playlist"
                    className="text-stone-400 hover:text-amber-400 transition-colors"
                >
                    <Plus size={16} />
                </button>
            </div>

            {isLoading ? (
                <p className="text-stone-400 text-sm px-3">Loading playlists…</p>
            ) : error ? (
                <p className="text-orange-400 text-sm px-3 leading-relaxed">
                    Can't reach the backend at localhost:5000. Is app.py running?
                </p>
            ) : (
                <ul className="list-none m-0 p-0 flex flex-col gap-0.5">
                    {playlists?.map((p) => (
                        <li key={p.playlistId}>
                            <NavLink to={`/playlist/${p.playlistId}`} className={linkClass}>
                                <span className="font-medium truncate">{p.title}</span>
                                <span className="text-xs text-stone-400 shrink-0">{p.count}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            )}

            {showCreate && <PlaylistFormModal onClose={() => setShowCreate(false)} />}
        </aside>
    );
}
