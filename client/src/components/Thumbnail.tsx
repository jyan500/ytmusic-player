// Album / track / artist artwork with a Music2 fallback when there's no image.
//
// referrerPolicy="no-referrer" is load-bearing: YouTube's image CDNs
// (lh3.googleusercontent.com, yt3.ggpht.com) 403 some requests that carry a
// Referer header from an origin they don't recognize, which is why a handful of
// thumbnails fail as <img> but load fine when opened directly in a new tab.

import { Music2 } from "lucide-react";

type ThumbnailProps = {
    src?: string | null;
    alt?: string;
    // Sizing / shape / shadow classes applied to both the image and the
    // fallback box (e.g. "w-40 h-40 rounded-xl shadow-lg").
    className?: string;
    // Music2 size for the empty-state fallback.
    iconSize?: number;
};

export default function Thumbnail({ src, alt = "", className = "", iconSize = 24 }: ThumbnailProps) {
    if (src) {
        return (
            <img
                src={src}
                alt={alt}
                referrerPolicy="no-referrer"
                className={`object-cover ${className}`}
            />
        );
    }
    return (
        <div className={`grid place-items-center bg-stone-800 text-stone-500 ${className}`}>
            <Music2 size={iconSize} />
        </div>
    );
}
