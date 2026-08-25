import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/*.test.ts"],
  },
  pack: {
    entry: "src/main.ts",
    outDir: "dist",
    format: "esm",
    platform: "node",
    target: "node24",
    clean: true,
    sourcemap: true,
    dts: false,
    deps: {
      neverBundle: true,
    },
  },
});
