import { useState } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
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
    return (
        <div
            className="flex flex-col h-screen bg-stone-950 text-stone-100"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
        >
            <div className="flex flex-1 min-h-0">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    <header className="shrink-0 px-6 py-4 border-b border-stone-800">
                        <TopSearchBar />
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
