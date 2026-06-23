import { useGetHomeQuery } from "../services/api";
import Carousel from "../components/Carousel";

export default function HomePage() {
    const { data, isLoading, error } = useGetHomeQuery();

    if (isLoading) return <p className="text-stone-400">Loading home…</p>;
    if (error) return <p className="text-orange-400">Couldn't load home suggestions.</p>;

    return (
        <div>
            {data?.map((s, i) => (
                <Carousel key={s.title + i} title={s.title} items={s.items} />
            ))}
        </div>
    );
}
