import type { SettingsDTO } from "gulgle-shared";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { type BangStateEvent, bangManager } from "@/state/bang-manager";

export type SyncStatus = "idle" | "syncing" | "success" | "error" | "conflict";

export type SyncState = {
  status: SyncStatus;
  error: string | null;
  lastSyncTime: Date | null;
  serverSettings: SettingsDTO | null;
};

export function useSettingsSync() {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<SyncState>({
    status: "idle",
    error: null,
    lastSyncTime: bangManager.getLastSyncTime(),
    serverSettings: null,
  });

  // Listen to sync events from bang manager
  useEffect(() => {
    const unsubscribe = bangManager.subscribe((event: BangStateEvent) => {
      switch (event.type) {
        case "SYNC_STARTED":
          setState((prev) => ({ ...prev, status: "syncing", error: null }));
          break;
        case "SYNC_SUCCESS":
          setState((prev) => ({
            ...prev,
            status: "success",
            error: null,
            lastSyncTime: event.payload.timestamp,
          }));
          // Reset to idle after 3 seconds
          setTimeout(() => {
            setState((prev) => (prev.status === "success" ? { ...prev, status: "idle" } : prev));
          }, 3000);
          break;
        case "SYNC_ERROR":
          setState((prev) => ({
            ...prev,
            status: "error",
            error: event.payload.error,
          }));
          break;
        case "SYNC_CONFLICT":
          setState((prev) => ({
            ...prev,
            status: "conflict",
            serverSettings: event.payload.serverSettings,
          }));
          break;
      }
    });

    return unsubscribe;
  }, []);

  /**
   * Sync local settings to cloud
   */
  const syncToCloud = useCallback(async () => {
    if (!user) {
      throw new Error("User not authenticated");
    }
    await bangManager.syncToCloud(user.id);
  }, [user]);

  /**
   * Sync settings from cloud to local
   */
  const syncFromCloud = useCallback(async () => {
    await bangManager.syncFromCloud();
  }, []);

  /**
   * Full bidirectional sync
   */
  const fullSync = useCallback(async () => {
    if (!user) {
      throw new Error("User not authenticated");
    }
    await bangManager.fullSync(user.id);
  }, [user]);

  /**
   * Resolve sync conflict
   */
  const resolveConflict = useCallback(
    async (choice: "local" | "server") => {
      if (choice === "local" && !user) {
        throw new Error("User not authenticated");
      }
      await bangManager.resolveConflict(choice, state.serverSettings || undefined, user?.id);
      setState((prev) => ({ ...prev, status: "idle", serverSettings: null }));
    },
    [state.serverSettings, user],
  );

  /**
   * Clear sync error
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, status: "idle", error: null }));
  }, []);

  return {
    ...state,
    isAuthenticated,
    syncToCloud,
    syncFromCloud,
    fullSync,
    resolveConflict,
    clearError,
  };
}
