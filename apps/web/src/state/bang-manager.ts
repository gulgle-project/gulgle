import { type Bang, type CustomBang, type ExportedSettings, isBang } from "gulgle-shared";
import { DEFAULT_BANG } from "@/const/default-bang";

// Storage keys
const STORAGE_KEY = "custom-bangs";
const DEFAULT_BANG_KEY = "default-bang";

// Event types for state changes
export type BangStateEvent =
  | { type: "CUSTOM_BANGS_CHANGED"; payload: Array<CustomBang> }
  | { type: "DEFAULT_BANG_CHANGED"; payload: Bang | undefined }
  | { type: "SETTINGS_IMPORTED"; payload: ExportedSettings };

// Type for event listeners
type BangStateListener = (event: BangStateEvent) => void;

// Storage interface to allow for different storage implementations
type StorageInterface = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

// Default localStorage implementation
const defaultStorage: StorageInterface = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Silently fail if localStorage is not available
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Silently fail if localStorage is not available
    }
  },
};

/**
 * Bang Manager State
 */
class BangManagerState {
  private listeners: Set<BangStateListener> = new Set();
  private storage: StorageInterface;
  private _customBangs: Array<CustomBang> | null = null;
  private _defaultBang: Bang | undefined | null = null;
  private _allBangs: Array<Bang> | null = null;

  constructor(storage: StorageInterface = defaultStorage) {
    this.storage = storage;
  }

  // Event subscription methods
  subscribe(listener: BangStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: BangStateEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("Error in bang state listener:", error);
      }
    });
  }

  // Custom bangs management
  getCustomBangs(): Array<CustomBang> {
    if (this._customBangs === null) {
      const stored = this.storage.getItem(STORAGE_KEY);
      this._customBangs = stored ? JSON.parse(stored) : [];
    }
    return [...(this._customBangs || [])];
  }

  private saveCustomBangs(customBangs: Array<CustomBang>): void {
    this._customBangs = customBangs;
    this._allBangs = null; // Invalidate cache
    this.storage.setItem(STORAGE_KEY, JSON.stringify(customBangs));
    this.emit({ payload: [...customBangs], type: "CUSTOM_BANGS_CHANGED" });
  }

  addCustomBang(bang: CustomBang): void {
    const customBangs = this.getCustomBangs();
    const existingIndex = customBangs.findIndex((b) => b.t === bang.t);

    if (existingIndex >= 0) {
      customBangs[existingIndex] = bang;
    } else {
      customBangs.push(bang);
    }

    this.saveCustomBangs(customBangs);
  }

  removeCustomBang(trigger: string): void {
    const customBangs = this.getCustomBangs().filter((b) => b.t !== trigger);
    this.saveCustomBangs(customBangs);
  }

  updateCustomBang(trigger: string, updates: Partial<CustomBang>): boolean {
    const customBangs = this.getCustomBangs();
    const existingIndex = customBangs.findIndex((b) => b.t === trigger);

    if (existingIndex >= 0) {
      customBangs[existingIndex] = { ...customBangs[existingIndex], ...updates };
      customBangs.sort((a, b) => a.t.localeCompare(b.t));
      this.saveCustomBangs(customBangs);
      return true;
    }

    return false;
  }

  // Default bang management
  getDefaultBang(): Bang | undefined {
    if (this._defaultBang === null) {
      const result = this.storage.getItem(DEFAULT_BANG_KEY);

      if (!result) {
        this._defaultBang = undefined;
        return undefined;
      }

      try {
        const parsed = JSON.parse(result);
        if (!isBang(parsed)) {
          this._defaultBang = undefined;
          return undefined;
        }
        this._defaultBang = parsed;
      } catch {
        this._defaultBang = undefined;
        return undefined;
      }
    }

    return this._defaultBang;
  }

  getDefaultBangOrStore(): Bang {
    const defaultBang = this.getDefaultBang();

    if (defaultBang) {
      return defaultBang;
    }

    this.setDefaultBang(DEFAULT_BANG);
    return DEFAULT_BANG;
  }

  setDefaultBang(bang: Bang): void {
    this._defaultBang = bang;
    this.storage.setItem(DEFAULT_BANG_KEY, JSON.stringify(bang));
    this.emit({ payload: bang, type: "DEFAULT_BANG_CHANGED" });
  }

  clearDefaultBang(): void {
    this._defaultBang = undefined;
    this.storage.removeItem(DEFAULT_BANG_KEY);
    this.emit({ payload: undefined, type: "DEFAULT_BANG_CHANGED" });
  }

  // All bangs management
  async getAllBangs(): Promise<Array<Bang>> {
    if (this._allBangs === null) {
      const customBangs = this.getCustomBangs();
      const builtInBangs = await this.getBangs();
      this._allBangs = [...customBangs, ...builtInBangs];
    }
    return [...this._allBangs];
  }

  async getBangs(): Promise<Array<Bang>> {
    return (await import("../const/kagi-bangs")).bangs;
  }

  async findBang(trigger: string): Promise<Bang | undefined> {
    const allBangs = await this.getAllBangs();
    return allBangs.find((bang) => bang.t === trigger || bang.ts?.includes(trigger));
  }

  // Import/Export functionality
  exportSettings(): ExportedSettings {
    return {
      customBangs: this.getCustomBangs(),
      defaultBang: this.getDefaultBang(),
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };
  }

  importSettings(settingsData: ExportedSettings): { success: boolean; message: string } {
    try {
      // Validate the data structure
      if (!settingsData || typeof settingsData !== "object") {
        return { message: "Invalid settings data format", success: false };
      }

      if (!Array.isArray(settingsData.customBangs)) {
        return { message: "Invalid custom bangs data", success: false };
      }

      // Validate custom bangs structure
      for (const bang of settingsData.customBangs) {
        if (!bang.t || !bang.s || !bang.u || !bang.d) {
          return { message: "Invalid custom bang structure", success: false };
        }
      }

      // Validate default bang structure
      if (settingsData.defaultBang && !isBang(settingsData.defaultBang)) {
        return { message: "Invalid default bang structure", success: false };
      }

      // Import the settings
      this.saveCustomBangs(settingsData.customBangs);
      if (settingsData.defaultBang) {
        this.setDefaultBang(settingsData.defaultBang);
      }

      this.emit({ payload: settingsData, type: "SETTINGS_IMPORTED" });

      return {
        message: `Successfully imported ${settingsData.customBangs.length} custom bangs and default search engine`,
        success: true,
      };
    } catch (error) {
      return {
        message: `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        success: false,
      };
    }
  }

  // Clear all data
  clearAllData(): void {
    this._customBangs = [];
    this._defaultBang = undefined;
    this._allBangs = null;
    this.storage.removeItem(STORAGE_KEY);
    this.storage.removeItem(DEFAULT_BANG_KEY);
    this.emit({ payload: [], type: "CUSTOM_BANGS_CHANGED" });
    this.emit({ payload: undefined, type: "DEFAULT_BANG_CHANGED" });
  }

  // Get current state snapshot
  getState() {
    return {
      customBangs: this.getCustomBangs(),
      defaultBang: this.getDefaultBang(),
    };
  }
}

// Create singleton instance
const bangManager = new BangManagerState();
export { bangManager, BangManagerState };
