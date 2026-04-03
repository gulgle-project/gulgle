import { useCallback } from "react";
import { bangManager } from "@/state/bang-manager";

export function useGetLoadSettings() {
  return useCallback(async () => {
    const defaultBang = bangManager.getDefaultBangOrStore();
    const customsBangs = bangManager.getCustomBangs();
    const bangs = await bangManager.getAllBangs();

    return {
      bangs,
      customsBangs,
      defaultBang,
    };
  }, []);
}
