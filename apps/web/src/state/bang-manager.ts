import { type Bang, type CustomBang, type ExportedSettings, isBang, type SettingsDTO } from "gulgle-shared";
import { DEFAULT_BANG } from "@/const/default-bang";
import { apiClient, ConflictError, UnauthorizedError } from "@/lib/api-client";

// Storage keys
const STORAGE_KEY = "custom-bangs";
const DEFAULT_BANG_KEY = "default-bang";
const LAST_SYNC_KEY = "last-sync";

// Event types for state changes
export type BangStateEvent =
  | { type: "CUSTOM_BANGS_CHANGED"; payload: Array<CustomBang> }
  | { type: "DEFAULT_BANG_CHANGED"; payload: Bang | undefined }
  | { type: "SETTINGS_IMPORTED"; payload: ExportedSettings }
  | { type: "SYNC_STARTED" }
  | { type: "SYNC_SUCCESS"; payload: { timestamp: Date } }
  | { type: "SYNC_ERROR"; payload: { error: string } }
  | { type: "SYNC_CONFLICT"; payload: { serverSettings: SettingsDTO } };

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

  // Cloud Sync Methods

  /**
   * Get last sync timestamp
   */
  getLastSyncTime(): Date | null {
    const stored = this.storage.getItem(LAST_SYNC_KEY);
    return stored ? new Date(stored) : null;
  }

  private setLastSyncTime(date: Date): void {
    this.storage.setItem(LAST_SYNC_KEY, date.toISOString());
  }

  /**
   * Push local settings to cloud
   */
  async syncToCloud(userId: string): Promise<void> {
    try {
      this.emit({ type: "SYNC_STARTED" });

      const settings: SettingsDTO = {
        userId,
        customBangs: this.getCustomBangs(),
        defaultBang: this.getDefaultBang(),
        lastModified: new Date(),
      };

      const result = await apiClient.pushSettings(settings);

      this.setLastSyncTime(new Date(result.lastModified));
      this.emit({ type: "SYNC_SUCCESS", payload: { timestamp: new Date() } });
    } catch (error) {
      if (error instanceof ConflictError) {
        // Server has newer data - need to resolve conflict
        const serverSettings = await apiClient.pullSettings();
        this.emit({ type: "SYNC_CONFLICT", payload: { serverSettings } });
        throw error;
      }

      if (error instanceof UnauthorizedError) {
        this.emit({ type: "SYNC_ERROR", payload: { error: "Authentication required" } });
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : "Sync failed";
      this.emit({ type: "SYNC_ERROR", payload: { error: errorMessage } });
      throw error;
    }
  }

  /**
   * Pull settings from cloud and merge with local
   */
  async syncFromCloud(): Promise<void> {
    try {
      this.emit({ type: "SYNC_STARTED" });

      const serverSettings = await apiClient.pullSettings();

      // Update local settings with server data
      this.saveCustomBangs(serverSettings.customBangs);
      if (serverSettings.defaultBang) {
        this.setDefaultBang(serverSettings.defaultBang);
      } else {
        this.clearDefaultBang();
      }

      this.setLastSyncTime(new Date(serverSettings.lastModified));
      this.emit({ type: "SYNC_SUCCESS", payload: { timestamp: new Date() } });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        this.emit({ type: "SYNC_ERROR", payload: { error: "Authentication required" } });
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : "Sync failed";
      this.emit({ type: "SYNC_ERROR", payload: { error: errorMessage } });
      throw error;
    }
  }

  /**
   * Resolve conflict by choosing local or server settings
   */
  async resolveConflict(choice: "local" | "server", serverSettings?: SettingsDTO, userId?: string): Promise<void> {
    if (choice === "server" && serverSettings) {
      // Use server settings
      this.saveCustomBangs(serverSettings.customBangs);
      if (serverSettings.defaultBang) {
        this.setDefaultBang(serverSettings.defaultBang);
      } else {
        this.clearDefaultBang();
      }
      this.setLastSyncTime(new Date(serverSettings.lastModified));
      this.emit({ type: "SYNC_SUCCESS", payload: { timestamp: new Date() } });
    } else if (choice === "local" && userId) {
      // Force push local settings
      const settings: SettingsDTO = {
        userId,
        customBangs: this.getCustomBangs(),
        defaultBang: this.getDefaultBang(),
        lastModified: new Date(),
      };

      // This will overwrite server settings
      const result = await apiClient.pushSettings(settings);
      this.setLastSyncTime(new Date(result.lastModified));
      this.emit({ type: "SYNC_SUCCESS", payload: { timestamp: new Date() } });
    }
  }

  /**
   * Bi-directional sync: pull from server, then push local changes
   */
  async fullSync(userId: string): Promise<void> {
    try {
      this.emit({ type: "SYNC_STARTED" });

      // First, pull from server
      const serverSettings = await apiClient.pullSettings();
      const localLastModified = this.getLastSyncTime();

      // If server is newer, use server settings
      if (!localLastModified || new Date(serverSettings.lastModified) > localLastModified) {
        this.saveCustomBangs(serverSettings.customBangs);
        if (serverSettings.defaultBang) {
          this.setDefaultBang(serverSettings.defaultBang);
        } else {
          this.clearDefaultBang();
        }
        this.setLastSyncTime(new Date(serverSettings.lastModified));
      } else {
        // Local is newer or same, push to server
        const settings: SettingsDTO = {
          userId,
          customBangs: this.getCustomBangs(),
          defaultBang: this.getDefaultBang(),
          lastModified: new Date(),
        };

        const result = await apiClient.pushSettings(settings);
        this.setLastSyncTime(new Date(result.lastModified));
      }

      this.emit({ type: "SYNC_SUCCESS", payload: { timestamp: new Date() } });
    } catch (error) {
      if (error instanceof ConflictError) {
        const serverSettings = await apiClient.pullSettings();
        this.emit({ type: "SYNC_CONFLICT", payload: { serverSettings } });
        throw error;
      }

      if (error instanceof UnauthorizedError) {
        this.emit({ type: "SYNC_ERROR", payload: { error: "Authentication required" } });
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : "Sync failed";
      this.emit({ type: "SYNC_ERROR", payload: { error: errorMessage } });
      throw error;
    }
  }
}

// Create singleton instance
const bangManager = new BangManagerState();
export { bangManager, BangManagerState };
