import type { CustomBang, Bang } from "./types";

// Custom bangs management
const STORAGE_KEY = "custom-bangs";
const DEFAULT_BANG_KEY = "default-bang";

const DEFAULT: Bang = {
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

export function getDefaultBang(): Bang | null {
  const result = localStorage.getItem(DEFAULT_BANG_KEY);

  if (!result) {
    return null;
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
