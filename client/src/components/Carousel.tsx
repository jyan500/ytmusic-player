// A titled, horizontally scrolling row of cards (home sections, artist rows).

import type { Card as CardType } from "../types";
import Card from "./Card";

const cardKey = (c: CardType, i: number) =>
    (c.videoId || c.browseId || c.playlistId || c.title) + i;

export default function Carousel({ title, items }: { title: string; items: CardType[] }) {
    return (
        <section className="mb-10">
            <h2 className="font-display text-xl font-bold mb-4">{title}</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 px-1 -mx-1">
                {items.map((c, i) => (
                    <Card key={cardKey(c, i)} card={c} />
                ))}
            </div>
        </section>
    );
}
