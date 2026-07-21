import assert from "node:assert/strict";
import test from "node:test";
import {
  hashToken,
  REFRESH_TOKEN_TTL_MS,
  type RefreshRotation,
  type RefreshSessionStore,
  type RefreshTokenFamily,
  type RefreshTokenRecord,
  type RefreshTokenReplacement,
  RefreshTokenService,
} from "./refresh-tokens";

class MemoryRefreshSessionStore implements RefreshSessionStore {
  families: Array<RefreshTokenFamily> = [];
  tokens: Array<RefreshTokenRecord> = [];

  async create(family: RefreshTokenFamily, token: RefreshTokenRecord): Promise<void> {
    this.families.push(structuredClone(family));
    this.tokens.push(structuredClone(token));
  }

  async rotate(
    current: { selector: string; tokenHash: string },
    replacement: RefreshTokenReplacement,
    now: Date,
  ): Promise<RefreshRotation> {
    const family = this.families.find(
      (candidate) =>
        candidate.current.selector === current.selector &&
        candidate.current.tokenHash === current.tokenHash &&
        !candidate.revokedAt &&
        candidate.expiresAt > now,
    );
    if (family) {
      family.current = { selector: replacement.selector, tokenHash: replacement.tokenHash, createdAt: now };
      this.tokens.push({ ...replacement, familyId: family.familyId, expiresAt: family.expiresAt });
      return { kind: "rotated", userId: family.userId };
    }
    const token = this.tokens.find(
      (candidate) => candidate.selector === current.selector && candidate.tokenHash === current.tokenHash,
    );
    const replayedFamily = token && this.families.find((candidate) => candidate.familyId === token.familyId);
    if (replayedFamily && !replayedFamily.revokedAt) {
      replayedFamily.revokedAt = now;
    }
    return { kind: "rejected" };
  }

  async revoke(selector: string, tokenHash: string, now: Date): Promise<void> {
    const token = this.tokens.find((candidate) => candidate.selector === selector && candidate.tokenHash === tokenHash);
    const family = token && this.families.find((candidate) => candidate.familyId === token.familyId);
    if (family && !family.revokedAt) {
      family.revokedAt = now;
    }
  }
}

test("rotates a valid refresh token and preserves its user", async () => {
  const store = new MemoryRefreshSessionStore();
  const service = new RefreshTokenService(store);
  const token = await service.create("user-123");
  const rotated = await service.rotate(token);
  assert.equal(rotated?.userId, "user-123");
  assert.notEqual(rotated?.token, token);
  assert.equal(store.tokens.length, 2);
  assert.notEqual(store.families[0]?.current.selector, token.split(".")[0]);
});

test("stores only a SHA-256 hash of an opaque token with 256 bits of secret entropy", async () => {
  const store = new MemoryRefreshSessionStore();
  const token = await new RefreshTokenService(store).create("user-123");
  const [, secret] = token.split(".");
  assert.ok(secret);
  assert.equal(Buffer.from(secret, "base64url").length, 32);
  assert.equal(store.tokens[0]?.tokenHash, hashToken(token));
  assert.equal(JSON.stringify(store).includes(token), false);
});

test("expires a whole refresh family after its bounded lifetime", async () => {
  let now = new Date("2026-01-01T00:00:00Z");
  const store = new MemoryRefreshSessionStore();
  const service = new RefreshTokenService(store, () => now);
  const token = await service.create("user-123");
  now = new Date(now.getTime() + REFRESH_TOKEN_TTL_MS + 1);
  assert.equal(await service.rotate(token), null);
});

test("replay revokes the entire family", async () => {
  const store = new MemoryRefreshSessionStore();
  const service = new RefreshTokenService(store);
  const token = await service.create("user-123");
  const rotated = await service.rotate(token);
  assert.ok(rotated);
  assert.equal(await service.rotate(token), null);
  assert.equal(await service.rotate(rotated.token), null);
  assert.ok(store.families[0]?.revokedAt);
});

test("two server instances cannot leave a successor valid after an interleaved replay", async () => {
  const store = new MemoryRefreshSessionStore();
  const instanceA = new RefreshTokenService(store);
  const instanceB = new RefreshTokenService(store);
  const token = await instanceA.create("user-123");

  // These services have no shared in-process lock. Exactly one CAS can replace
  // the family current token; the loser then atomically revokes that family.
  const [first, second] = await Promise.all([instanceA.rotate(token), instanceB.rotate(token)]);
  const successor = first ?? second;
  assert.ok(successor);
  assert.equal(Number(first !== null) + Number(second !== null), 1);
  assert.equal(await instanceA.rotate(successor.token), null);
  assert.ok(store.families[0]?.revokedAt);
});

test("rejects malformed or unknown refresh tokens", async () => {
  const service = new RefreshTokenService(new MemoryRefreshSessionStore());
  assert.equal(await service.rotate("not-a-refresh-token"), null);
  assert.equal(await service.rotate(undefined), null);
});
