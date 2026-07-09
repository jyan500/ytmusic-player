// Persistent left nav: Home link + the user's library playlists.

import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Home, Music2, Plus, ChevronLeft } from "lucide-react";
import { useGetPlaylistsQuery } from "../services/api";
import PlaylistFormModal from "./PlaylistFormModal";

const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex justify-between items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive ? "bg-stone-800 text-amber-400" : "hover:bg-stone-800"
    }`;

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { data: playlists, isLoading, error } = useGetPlaylistsQuery();
    const [showCreate, setShowCreate] = useState(false);

    return (
        <>
            {/* dimmed backdrop behind the mobile drawer; tap to close */}
            {open && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 z-40 bg-black/60 md:hidden"
                    aria-hidden="true"
                />
            )}

            <aside
                // Static column on md+; off-canvas sliding drawer on mobile.
                className={`w-60 shrink-0 bg-stone-900 border-r border-stone-800 p-5 flex flex-col gap-3 overflow-y-auto
                    fixed inset-y-0 left-0 z-50 transition-transform duration-200
                    md:static md:z-auto md:translate-x-0
                    ${open ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="flex items-center gap-2 px-1 mb-1">
                    <Music2 size={18} className="text-amber-400" />
                    <span className="font-display font-semibold text-sm tracking-wide">YT Music</span>
                    {/* close arrow — mobile drawer only */}
                    <button
                        onClick={onClose}
                        aria-label="Close menu"
                        className="md:hidden ml-auto text-stone-400 hover:text-stone-100"
                    >
                        <ChevronLeft size={20} />
                    </button>
                </div>

                <NavLink to="/" end onClick={onClose} className={linkClass}>
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
                        Can't reach the backend. Is app.py running?
                    </p>
                ) : (
                    <ul className="list-none m-0 p-0 flex flex-col gap-0.5">
                        {playlists?.map((p) => (
                            <li key={p.playlistId}>
                                <NavLink
                                    to={`/playlist/${p.playlistId}`}
                                    onClick={onClose}
                                    className={linkClass}
                                >
                                    <span className="font-medium truncate">{p.title}</span>
                                    <span className="text-xs text-stone-400 shrink-0">{p.count}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                )}

                {showCreate && <PlaylistFormModal onClose={() => setShowCreate(false)} />}
            </aside>
        </>
    );
}
