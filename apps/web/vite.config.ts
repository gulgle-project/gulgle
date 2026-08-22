import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    // The virtual:pwa-register helper in src/main.ts handles registration and
    // reloads open pages after an updated worker activates.
    registerType: "autoUpdate",
    injectRegister: "auto",
  }),],
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
