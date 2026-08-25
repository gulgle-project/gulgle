import { useEffect } from "react";

export function useMount(callback: () => void) {
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- Only run on mount.
  useEffect(() => callback(), []);
}
