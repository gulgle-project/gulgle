import { useCallback, useEffect, useState } from "react";
import { type BangStateEvent, bangManager } from "@/state/bang-manager";
import type { Bang, CustomBang, ExportedSettings } from "@/types/types";

export type BangManagerHookResult = {
  // State
  customBangs: Array<CustomBang>;
  defaultBang: Bang | undefined;
  isLoading: boolean;

  // Actions
  addCustomBang: (bang: CustomBang) => void;
  removeCustomBang: (trigger: string) => void;
  updateCustomBang: (trigger: string, updates: Partial<CustomBang>) => boolean;
  setDefaultBang: (bang: Bang) => void;
  clearDefaultBang: () => void;

  // Async actions
  getAllBangs: () => Promise<Array<Bang>>;
  findBang: (trigger: string) => Promise<Bang | undefined>;

  // Import/Export
  exportSettings: () => ExportedSettings;
  importSettings: (settings: ExportedSettings) => { success: boolean; message: string };

  // Utility
  clearAllData: () => void;
};

/**
 * React hook for managing bang state with automatic re-renders on state changes
 */
export function useBangManager(): BangManagerHookResult {
  const [customBangs, setCustomBangs] = useState<Array<CustomBang>>(() => bangManager.getCustomBangs());
  const [defaultBang, setDefaultBang] = useState<Bang | undefined>(() => bangManager.getDefaultBang());
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = bangManager.subscribe((event: BangStateEvent) => {
      switch (event.type) {
        case "CUSTOM_BANGS_CHANGED":
          setCustomBangs(event.payload);
          break;
        case "DEFAULT_BANG_CHANGED":
          setDefaultBang(event.payload);
          break;
        case "SETTINGS_IMPORTED":
          // Refresh both states after import
          setCustomBangs(bangManager.getCustomBangs());
          setDefaultBang(bangManager.getDefaultBang());
          break;
      }
    });

    return unsubscribe;
  }, []);

  // Wrapped actions
  const addCustomBang = useCallback((bang: CustomBang) => {
    bangManager.addCustomBang(bang);
  }, []);

  const removeCustomBang = useCallback((trigger: string) => {
    bangManager.removeCustomBang(trigger);
  }, []);

  const updateCustomBang = useCallback((trigger: string, updates: Partial<CustomBang>) => {
    return bangManager.updateCustomBang(trigger, updates);
  }, []);

  const setDefaultBangAction = useCallback((bang: Bang) => {
    bangManager.setDefaultBang(bang);
  }, []);

  const clearDefaultBang = useCallback(() => {
    bangManager.clearDefaultBang();
  }, []);

  const getAllBangs = useCallback(async () => {
    setIsLoading(true);
    try {
      return await bangManager.getAllBangs();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const findBang = useCallback(async (trigger: string) => {
    setIsLoading(true);
    try {
      return await bangManager.findBang(trigger);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exportSettings = useCallback(() => {
    return bangManager.exportSettings();
  }, []);

  const importSettings = useCallback((settings: ExportedSettings) => {
    return bangManager.importSettings(settings);
  }, []);

  const clearAllData = useCallback(() => {
    bangManager.clearAllData();
  }, []);

  return {
    // Actions
    addCustomBang,

    // Utility
    clearAllData,
    clearDefaultBang,
    // State
    customBangs,
    defaultBang,

    // Import/Export
    exportSettings,
    findBang,

    // Async actions
    getAllBangs,
    importSettings,
    isLoading,
    removeCustomBang,
    setDefaultBang: setDefaultBangAction,
    updateCustomBang,
  };
}

/**
 * Hook for loading initial settings (backwards compatibility)
 */
export function useGetLoadSettings() {
  const [data, setData] = useState<{
    defaultBang: Bang;
    customsBangs: Array<CustomBang>;
    bangs: Array<Bang>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const defaultBang = bangManager.getDefaultBangOrStore();
      const customsBangs = bangManager.getCustomBangs();
      const bangs = await bangManager.getAllBangs();

      const result = {
        bangs,
        customsBangs,
        defaultBang,
      };

      setData(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    isLoading,
    loadSettings,
  };
}
