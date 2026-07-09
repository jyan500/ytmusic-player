import { useState } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "./components/Sidebar";
import TopSearchBar from "./components/TopSearchBar";
import NowPlayingBar from "./components/NowPlayingBar";
import NowPlayingScreen from "./components/NowPlayingScreen";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import PlaylistPage from "./pages/PlaylistPage";
import AlbumPage from "./pages/AlbumPage";
import ArtistPage from "./pages/ArtistPage";

function Layout() {
    const [expanded, setExpanded] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    return (
        <div
            // h-[100dvh] (dynamic viewport height) instead of h-screen so the
            // NowPlayingBar isn't hidden under the mobile browser's toolbar.
            className="flex flex-col h-[100dvh] bg-stone-950 text-stone-100"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
        >
            <div className="flex flex-1 min-h-0">
                <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
                <div className="flex-1 flex flex-col min-w-0">
                    <header className="shrink-0 px-4 md:px-6 py-4 border-b border-stone-800 flex items-center gap-3">
                        <button
                            onClick={() => setMenuOpen(true)}
                            aria-label="Open menu"
                            className="md:hidden shrink-0 text-stone-300 hover:text-stone-100"
                        >
                            <Menu size={22} />
                        </button>
                        <div className="flex-1 min-w-0">
                            <TopSearchBar />
                        </div>
                    </header>
                    <main className="flex-1 overflow-y-auto p-6 md:p-8">
                        <Outlet />
                    </main>
                </div>
            </div>
            <NowPlayingBar onExpand={() => setExpanded(true)} />
            {expanded && <NowPlayingScreen onClose={() => setExpanded(false)} />}
        </div>
    );
}

export default function App() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="search" element={<SearchPage />} />
                <Route path="playlist/:id" element={<PlaylistPage />} />
                <Route path="album/:id" element={<AlbumPage />} />
                <Route path="artist/:id" element={<ArtistPage />} />
            </Route>
        </Routes>
    );
}
