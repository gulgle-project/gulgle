import type { Bang } from "./types";

export function isBang(value: unknown): value is Bang {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.t === "string" &&
    typeof obj.s === "string" &&
    typeof obj.u === "string" &&
    typeof obj.d === "string" &&
    (obj.ts === undefined || (Array.isArray(obj.ts) && obj.ts.every((item: unknown) => typeof item === "string"))) &&
    (obj.c === undefined || obj.c === true)
  );
}
