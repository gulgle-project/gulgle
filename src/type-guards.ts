import { Bang } from "./types";

export function isBang(value: unknown): value is Bang {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as any).t === "string" &&
    typeof (value as any).s === "string" &&
    typeof (value as any).u === "string" &&
    typeof (value as any).d === "string" &&
    ((value as any).ts === undefined || (Array.isArray((value as any).ts) && (value as any).ts.every((item: any) => typeof item === "string"))) &&
    ((value as any).c === undefined || (value as any).c === true)
  );
}
