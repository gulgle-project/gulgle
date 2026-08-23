import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const isExtensionBuild = mode === "extension";

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(!isExtensionBuild
        ? [
            VitePWA({
              // The virtual:pwa-register helper in src/main.ts handles registration and
              // reloads open pages after an updated worker activates.
              injectRegister: "auto",
              registerType: "autoUpdate",
            }),
          ]
        : []),
    ],
    base: isExtensionBuild ? "./" : "/",
    build: isExtensionBuild
      ? {
          emptyOutDir: true,
          outDir: "../extension/dist",
          rollupOptions: {
            input: path.resolve(__dirname, "./newtab.html"),
          },
        }
      : undefined,
    publicDir: isExtensionBuild ? false : "public",
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
