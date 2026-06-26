// A single home / search / carousel card. Songs play on click; albums,
// playlists and artists navigate to their page.

import { useNavigate } from "react-router-dom";
import type { Card as CardType } from "../types";
import { usePlayer } from "../player/PlayerContext";
import Thumbnail from "./Thumbnail";

export default function Card({ card }: { card: CardType }) {
    const navigate = useNavigate();
    const { playTrack } = usePlayer();

    function onClick() {
        if (card.kind === "song" && card.videoId) {
            playTrack({
                videoId: card.videoId,
                title: card.title,
                artist: card.subtitle,
                duration: "",
                thumbnail: card.thumbnail,
            });
        } else if (card.kind === "album" && card.browseId) {
            navigate(`/album/${card.browseId}`);
        } else if (card.kind === "artist" && card.browseId) {
            navigate(`/artist/${card.browseId}`);
        } else if (card.kind === "playlist" && card.playlistId) {
            navigate(`/playlist/${card.playlistId}`);
        }
    }

    const round = card.kind === "artist";
    const shape = round ? "rounded-full" : "rounded-xl";

    return (
        <button onClick={onClick} className="w-40 shrink-0 text-left group">
            <Thumbnail
                src={card.thumbnail}
                iconSize={32}
                className={`w-40 h-40 shadow-lg group-hover:brightness-110 transition ${shape}`}
            />
            <p className={`mt-2 text-sm font-medium truncate ${round ? "text-center" : ""}`}>
                {card.title}
            </p>
            <p className={`text-xs text-stone-400 truncate ${round ? "text-center" : ""}`}>
                {card.subtitle}
            </p>
        </button>
    );
}
