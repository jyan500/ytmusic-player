import { useParams } from "react-router-dom";
import { Music2 } from "lucide-react";
import { useGetArtistQuery } from "../services/api";
import TrackList from "../components/TrackList";
import Carousel from "../components/Carousel";
import type { Card, Track } from "../types";

export default function ArtistPage() {
    const { id = "" } = useParams();
    const { data, isLoading, error } = useGetArtistQuery(id, { skip: !id });

    if (isLoading) return <p className="text-stone-400">Loading artist…</p>;
    if (error || !data) return <p className="text-orange-400">Couldn't load that artist.</p>;

    return (
        <div>
            <div className="flex items-center gap-5 mb-8">
                {data.thumbnail ? (
                    <img src={data.thumbnail} alt="" className="w-28 h-28 rounded-full object-cover shadow-xl" />
                ) : (
                    <div className="w-28 h-28 rounded-full grid place-items-center bg-stone-800 text-stone-500">
                        <Music2 size={36} />
                    </div>
                )}
                <h1 className="font-display text-4xl font-bold">{data.name}</h1>
            </div>

            {data.sections.map((s, i) =>
                s.kind === "tracks" ? (
                    <section key={i} className="mb-10">
                        <h2 className="font-display text-xl font-bold mb-4">{s.title}</h2>
                        <TrackList tracks={s.items as Track[]} />
                    </section>
                ) : (
                    <Carousel key={i} title={s.title} items={s.items as Card[]} />
                )
            )}
        </div>
    );
}
