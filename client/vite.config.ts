import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The backend enables CORS and the app calls it by absolute URL
// (BACKEND = http://localhost:5000), so no dev proxy is needed here.
export default defineConfig({
    plugins: [react()],
    server: {
        host: true,   // listen on the LAN so other devices (e.g. phone) can connect
        port: 5173,
    },
});
