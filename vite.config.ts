import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    ignorePatterns: ["apps/web/src/components/ui/**", "apps/web/src/const/kagi-bangs.ts"],
    printWidth: 120,
  },
  lint: {
    ignorePatterns: ["apps/web/src/components/ui/**", "apps/web/src/const/kagi-bangs.ts"],
    plugins: ["react", "vitest"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  test: {
    globals: true,
    include: ["apps/**/*.test.ts", "packages/**/*.test.ts", "scripts/**/*.test.ts"],
  },
});
