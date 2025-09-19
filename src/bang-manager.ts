import type { bangs } from "./bang";
import type { CustomBang } from "./types";

// Custom bangs management
const STORAGE_KEY = "custom-bangs";
const DEFAULT_BANG_KEY = "default-bang";

const DEFAULT = {
  t: "g",
  s: "Google",
  u: "https://www.google.com/search?q={{{s}}}",
  d: "www.google.com"
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
  const existingIndex = customBangs.findIndex(b => b.t === bang.t);
  
  if (existingIndex >= 0) {
    customBangs[existingIndex] = bang;
  } else {
    customBangs.push(bang);
  }
  
  saveCustomBangs(customBangs);
}

export function removeCustomBang(trigger: string): void {
  const customBangs = getCustomBangs().filter(b => b.t !== trigger);
  saveCustomBangs(customBangs);
}

export function getDefaultBang(): CustomBang | typeof bangs[0] | null {
  const result = localStorage.getItem(DEFAULT_BANG_KEY);

  if (!result) {
    return null;
  }

  return JSON.parse(result);
}

export function getDefaultBangOrStore(): CustomBang | typeof bangs[0] | typeof DEFAULT {
  const defaultBang = getDefaultBang();

  if (defaultBang) {
    return defaultBang;
  }

  setDefaultBang(DEFAULT);
  return DEFAULT;
}


export function setDefaultBang(bang: CustomBang | typeof bangs[0]): void {
  localStorage.setItem(DEFAULT_BANG_KEY, JSON.stringify(bang));
}

export async function getAllBangs(): Promise<(CustomBang | typeof bangs[0])[]> {
  return [...getCustomBangs(), ...(await getBangs())];
}

export async function getBangs(): Promise<typeof bangs> {
  return (await import("./bang")).bangs
}