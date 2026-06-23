// Small reusable modal: dimmed backdrop + centered panel. Clicking the backdrop
// or the X closes it. Used by the playlist create/rename and add-to-playlist flows.

import { type ReactNode } from "react";
import { X } from "lucide-react";

export default function Modal({
    title,
    onClose,
    children,
}: {
    title: string;
    onClose: () => void;
    children: ReactNode;
}) {
    return (
        <div
            className="fixed inset-0 z-[55] bg-black/60 grid place-items-center p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800">
                    <h2 className="font-display font-semibold text-lg">{title}</h2>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="text-stone-400 hover:text-stone-100 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}
