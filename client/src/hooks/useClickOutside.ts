// Calls onOutside() when a mousedown lands outside the referenced element.
// Shared by the search-suggestions dropdown (TopSearchBar) and the kebab menu
// (TrackMenu) so the dismiss-on-outside-click logic lives in one place.

import { useEffect, type RefObject } from "react";

export function useClickOutside<T extends HTMLElement>(
    ref: RefObject<T>,
    onOutside: () => void,
) {
    useEffect(() => {
        function handleMouseDown(event: MouseEvent) {
            const element = ref.current;
            if (element && !element.contains(event.target as Node)) {
                onOutside();
            }
        }
        document.addEventListener("mousedown", handleMouseDown);
        return () => document.removeEventListener("mousedown", handleMouseDown);
    }, [ref, onOutside]);
}
