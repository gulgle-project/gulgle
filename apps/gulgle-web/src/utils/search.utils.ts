import type { Bang } from "@/types/types";

function levenshtein(a: string, b: string): number {
  const n = a.length;
  const m = b.length;

  if (n === 0) {
    return m;
  }
  if (m === 0) {
    return n;
  }

  // ensure n <= m to save space
  if (n > m) {
    [a, b] = [b, a];
  }

  let prev = Array(b.length + 1)
    .fill(0)
    .map((_, i) => i);
  let curr = new Array(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const insert = curr[j - 1] + 1;
      const del = prev[j] + 1;
      const replace = prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
      curr[j] = Math.min(insert, del, replace);
    }
    [curr, prev] = [prev, curr];
  }

  return prev[b.length];
}

export function score(bang: Bang, searchValue: string): number {
  // Clean value for trigger matching (remove ! prefix)
  const cleanValue = searchValue.replace(/^!/, "").toLowerCase();
  const originalValue = searchValue.toLowerCase();

  // Check for exact matches first (give them a very low score)
  if (bang.t.toLowerCase() === cleanValue) {
    return 0.01; // Exact trigger match - highest priority
  }
  if (bang.s.toLowerCase() === originalValue) {
    return 0.02; // Exact description match - very high priority
  }
  if (bang.ts?.some((trigger: string) => trigger.toLowerCase() === cleanValue)) {
    return 0.03; // Exact additional trigger match
  }

  // Check for starts-with matches
  let triggerScore = Infinity;
  let descriptionScore = Infinity;
  let tsScore = Infinity;

  if (bang.t.toLowerCase().startsWith(cleanValue)) {
    triggerScore = 0.1; // Starts with trigger
  } else if (bang.t.toLowerCase().includes(cleanValue)) {
    triggerScore = levenshtein(bang.t, cleanValue) * 1;
  }

  if (bang.s.toLowerCase().startsWith(originalValue)) {
    descriptionScore = 0.2; // Starts with description
  } else if (bang.s.toLowerCase().includes(originalValue)) {
    descriptionScore = levenshtein(bang.s, originalValue) * 2;
  }

  if (bang.ts) {
    for (const trigger of bang.ts) {
      const triggerLower = trigger.toLowerCase();
      if (triggerLower.startsWith(cleanValue)) {
        tsScore = Math.min(tsScore, 0.15); // Starts with additional trigger
      } else if (triggerLower.includes(cleanValue)) {
        tsScore = Math.min(tsScore, levenshtein(trigger, cleanValue) * 1.5);
      }
    }
  }

  return Math.min(triggerScore, descriptionScore, tsScore);
}
