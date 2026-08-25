import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, lazyPlugins } from "vite-plus";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const isExtensionBuild = mode === "extension";

  return {
    plugins: lazyPlugins(() => [
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
    ]),
    base: isExtensionBuild ? "./" : "/",
    build: isExtensionBuild
      ? {
          emptyOutDir: true,
          outDir: "../extension/dist",
          rollupOptions: {
            input: path.resolve(__dirname, "./newtab.html"),
          },
        }
      : {
          rollupOptions: {
            // Emit a real /privacy/ entry so the policy is directly reachable on
            // GitHub Pages, which does not provide SPA route fallbacks.
            input: {
              main: path.resolve(__dirname, "index.html"),
              privacy: path.resolve(__dirname, "privacy/index.html"),
            },
          },
        },
    publicDir: isExtensionBuild ? false : "public",
    test: {
      globals: true,
      include: ["src/**/*.test.ts"],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
