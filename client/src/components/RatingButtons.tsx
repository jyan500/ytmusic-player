// Thumbs up / thumbs down for the current track. Shared by NowPlayingBar and
// NowPlayingScreen (they differ only in icon size / button styling). Reads the
// rating state and rate() action straight from the player context.

import { ThumbsUp, ThumbsDown } from "lucide-react";
import { usePlayer } from "../player/PlayerContext";

export default function RatingButtons({
    size = 18,
    buttonClassName = "",
}: {
    size?: number;
    buttonClassName?: string;
}) {
    const { likeStatus, rate } = usePlayer();

    const className = (active: boolean) =>
        `${buttonClassName} ${
            active ? "text-amber-400" : "text-stone-400 hover:text-stone-100"
        }`;

    return (
        <>
            <button
                onClick={() => rate("LIKE")}
                aria-label="Thumbs up"
                aria-pressed={likeStatus === "LIKE"}
                className={className(likeStatus === "LIKE")}
            >
                <ThumbsUp size={size} />
            </button>
            <button
                onClick={() => rate("DISLIKE")}
                aria-label="Thumbs down"
                aria-pressed={likeStatus === "DISLIKE"}
                className={className(likeStatus === "DISLIKE")}
            >
                <ThumbsDown size={size} />
            </button>
        </>
    );
}
