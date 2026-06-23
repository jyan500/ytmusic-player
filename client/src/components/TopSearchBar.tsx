// Search box with live autocomplete. Typing (debounced) fetches suggestions;
// Enter or picking a suggestion navigates to the results page.

import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Clock } from "lucide-react";
import { useGetSuggestionsQuery } from "../services/api";
import { useClickOutside } from "../hooks/useClickOutside";

export default function TopSearchBar() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [text, setText] = useState(params.get("q") || "");
    const [debounced, setDebounced] = useState("");
    const [open, setOpen] = useState(false);
    const boxRef = useRef<HTMLDivElement>(null);

    // debounce keystrokes before asking the backend for suggestions
    useEffect(() => {
        const id = setTimeout(() => setDebounced(text.trim()), 200);
        return () => clearTimeout(id);
    }, [text]);

    const { data: suggestions } = useGetSuggestionsQuery(debounced, { skip: !debounced });

    // close the dropdown when clicking outside the box
    useClickOutside(boxRef, () => setOpen(false));

    function submit(q: string) {
        const term = q.trim();
        if (!term) return;
        setText(term);
        setOpen(false);
        navigate(`/search?q=${encodeURIComponent(term)}`);
    }

    return (
        <div ref={boxRef} className="relative max-w-2xl w-full mx-auto">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    submit(text);
                }}
            >
                <div className="flex items-center gap-3 bg-stone-900 border border-stone-700 rounded-full px-4 py-2.5 focus-within:border-stone-500 transition-colors">
                    <Search size={18} className="text-stone-400 shrink-0" />
                    <input
                        value={text}
                        onChange={(e) => {
                            setText(e.target.value);
                            setOpen(true);
                        }}
                        onFocus={() => setOpen(true)}
                        placeholder="Search songs, albums, artists"
                        className="bg-transparent outline-none w-full text-sm placeholder:text-stone-500"
                    />
                </div>
            </form>

            {open && suggestions && suggestions.length > 0 && (
                <ul className="absolute z-30 mt-2 w-full bg-stone-900 border border-stone-700 rounded-2xl py-2 shadow-2xl list-none m-0 overflow-hidden">
                    {suggestions.map((s, i) => (
                        <li
                            key={s + i}
                            onClick={() => submit(s)}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-stone-800 cursor-pointer text-sm"
                        >
                            <Clock size={15} className="text-stone-500 shrink-0" />
                            <span className="truncate">{s}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
