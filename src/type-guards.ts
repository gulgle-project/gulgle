import { Bang } from "./types";

export function isBang(value: unknown): value is Bang {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as any).t === "string" &&
    typeof (value as any).s === "string" &&
    typeof (value as any).u === "string" &&
    typeof (value as any).d === "string" &&
    (typeof (value as any).c === "boolean" || (value as any).c === undefined)
  );
}
