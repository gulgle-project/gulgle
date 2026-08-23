import { access, cp, mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const outputDirectory = new URL("../dist/", import.meta.url);
const manifestUrl = new URL("../src/manifest.json", import.meta.url);
const iconsDirectory = new URL("../src/icons/", import.meta.url);

const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));

if (manifest.manifest_version !== 3) {
  throw new Error("The extension manifest must use Manifest V3");
}

if ("permissions" in manifest || "host_permissions" in manifest) {
  throw new Error("The extension must not request permissions");
}

await mkdir(outputDirectory, { recursive: true });
await cp(manifestUrl, new URL("manifest.json", outputDirectory));
await cp(iconsDirectory, new URL("icons/", outputDirectory), { recursive: true });

const extensionPage = manifest.chrome_url_overrides?.newtab;
const iconPaths = Object.values(manifest.icons ?? {});

if (typeof extensionPage !== "string" || iconPaths.length === 0) {
  throw new Error("The extension manifest must reference a new-tab page and icons");
}

for (const relativePath of [extensionPage, ...iconPaths]) {
  if (typeof relativePath !== "string") {
    throw new Error("Extension asset paths must be strings");
  }

  await access(new URL(relativePath, outputDirectory));
}

console.log(`Built unpacked extension in ${fileURLToPath(outputDirectory)}`);
