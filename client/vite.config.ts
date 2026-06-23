import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The backend enables CORS and the app calls it by absolute URL
// (BACKEND = http://localhost:5000), so no dev proxy is needed here.
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
    },
});
