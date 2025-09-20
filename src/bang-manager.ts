import { isBang } from "./type-guards";
import type { CustomBang, Bang, BuiltInBang, ExportedSettings } from "./types";

// Custom bangs management
const STORAGE_KEY = "custom-bangs";
const DEFAULT_BANG_KEY = "default-bang";

const DEFAULT: BuiltInBang = {
  t: "g",
  s: "Google",
  u: "https://www.google.com/search?q={{{s}}}",
  d: "www.google.com",
};

export function getCustomBangs(): CustomBang[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveCustomBangs(customBangs: CustomBang[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customBangs));
}

export function addCustomBang(bang: CustomBang): void {
  const customBangs = getCustomBangs();
  const existingIndex = customBangs.findIndex((b) => b.t === bang.t);

  if (existingIndex >= 0) {
    customBangs[existingIndex] = bang;
  } else {
    customBangs.push(bang);
  }

  saveCustomBangs(customBangs);
}

export function removeCustomBang(trigger: string): void {
  const customBangs = getCustomBangs().filter((b) => b.t !== trigger);
  saveCustomBangs(customBangs);
}

export function getDefaultBang(): Bang | undefined {
  const result = localStorage.getItem(DEFAULT_BANG_KEY);

  if (!result || !isBang(result)) {
    return undefined;
  }

  return JSON.parse(result);
}

export function getDefaultBangOrStore(): Bang {
  const defaultBang = getDefaultBang();

  if (defaultBang) {
    return defaultBang;
  }

  setDefaultBang(DEFAULT);
  return DEFAULT;
}

export function setDefaultBang(bang: Bang): void {
  localStorage.setItem(DEFAULT_BANG_KEY, JSON.stringify(bang));
}

export async function getAllBangs(): Promise<Bang[]> {
  return [...getCustomBangs(), ...(await getBangs())];
}

export async function getBangs(): Promise<Bang[]> {
  return (await import("./bang")).bangs;
}

export function exportSettings(): ExportedSettings {
  return {
    customBangs: getCustomBangs(),
    defaultBang: getDefaultBang(),
    exportedAt: new Date().toISOString(),
    version: "1.0"
  };
}

export function importSettings(settingsData: ExportedSettings): { success: boolean; message: string } {
  try {
    // Validate the data structure
    if (!settingsData || typeof settingsData !== 'object') {
      return { success: false, message: "Invalid settings data format" };
    }

    if (!Array.isArray(settingsData.customBangs)) {
      return { success: false, message: "Invalid custom bangs data" };
    }

    // Validate custom bangs structure
    for (const bang of settingsData.customBangs) {
      if (!bang.t || !bang.s || !bang.u || !bang.d) {
        return { success: false, message: "Invalid custom bang structure" };
      }
    }

    // Validate default bang structure
    if (settingsData.defaultBang && !isBang(settingsData.defaultBang)) {
      return { success: false, message: "Invalid default bang structure" };
    }

    // Import the settings
    saveCustomBangs(settingsData.customBangs);
    settingsData.defaultBang && setDefaultBang(settingsData.defaultBang);

    return { success: true, message: `Successfully imported ${settingsData.customBangs.length} custom bangs and default search engine` };
  } catch (error) {
    return { success: false, message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}
