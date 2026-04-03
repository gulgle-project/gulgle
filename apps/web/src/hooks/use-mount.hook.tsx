import { useEffect } from "react";

export function useMount(callback: () => void) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: Only run on mount
  useEffect(() => callback(), []);
}
