import { useParams } from "react-router-dom";
import { Play, Music2 } from "lucide-react";
import { useGetAlbumQuery } from "../services/api";
import TrackList from "../components/TrackList";
import { usePlayer } from "../player/PlayerContext";

export default function AlbumPage() {
    const { id = "" } = useParams();
    const { data, isLoading, error } = useGetAlbumQuery(id, { skip: !id });
    const { playTracks } = usePlayer();

    if (isLoading) return <p className="text-stone-400">Loading album…</p>;
    if (error || !data) return <p className="text-orange-400">Couldn't load that album.</p>;

    return (
        <div>
            <div className="flex flex-col md:flex-row items-start md:items-end gap-5 mb-8">
                {data.thumbnail ? (
                    <img src={data.thumbnail} alt="" className="w-40 h-40 rounded-xl object-cover shadow-2xl" />
                ) : (
                    <div className="w-40 h-40 rounded-xl grid place-items-center bg-stone-800 text-stone-500">
                        <Music2 size={40} />
                    </div>
                )}
                <div>
                    <h1 className="font-display text-3xl font-bold">{data.title}</h1>
                    <p className="text-stone-400 mt-1">{data.subtitle}</p>
                    {data.tracks.length > 0 && (
                        <button
                            onClick={() => playTracks(data.tracks, 0)}
                            className="mt-4 flex items-center gap-2 bg-amber-400 text-stone-950 font-semibold px-5 py-2 rounded-full hover:brightness-110 transition"
                        >
                            <Play size={18} /> Play
                        </button>
                    )}
                </div>
            </div>
            <TrackList tracks={data.tracks} />
        </div>
    );
}
