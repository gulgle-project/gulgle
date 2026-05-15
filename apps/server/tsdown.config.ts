import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/main.ts",
  outDir: "dist",
  format: "esm",
  platform: "node",
  target: "node24",
  clean: true,
  sourcemap: true,
  dts: false,
  deps: {
    skipNodeModulesBundle: true,
  },
});
