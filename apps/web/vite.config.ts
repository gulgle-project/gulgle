import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    // Generate a service worker that activates new versions immediately
    // (skipWaiting + clientsClaim) and cleans up outdated caches.
    registerType: "autoUpdate",
    // Don't inject the plugin's own registration script: the service worker
    // is registered manually in src/main.ts, where we also reload the page
    // when a new version takes control (see issue #42).
    injectRegister: false,
  }),],
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
