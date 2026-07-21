import type { Collection } from "mongodb";
import { executeQuery } from "../db/db";
import type { RefreshRotation, RefreshSessionStore, RefreshTokenFamily, RefreshTokenRecord } from "../refresh-tokens";

const TOKEN_COLLECTION = "refreshToken";
// A "family" is one login session's chain of rotated refresh tokens;
// see the RefreshTokenFamily doc comment in refresh-tokens.ts.
const FAMILY_COLLECTION = "refreshTokenFamily";
let indexes: Promise<void> | undefined;

export function ensureRefreshSessionIndexes(): Promise<void> {
  if (!indexes) {
    const pendingIndexes = Promise.all([
      executeQuery(TOKEN_COLLECTION, async (collection) => {
        await collection.createIndex({ selector: 1 }, { unique: true });
        await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      }),
      executeQuery(FAMILY_COLLECTION, async (collection) => {
        await collection.createIndex({ familyId: 1 }, { unique: true });
        await collection.createIndex({ "current.selector": 1 }, { unique: true });
        await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      }),
    ]).then(() => undefined);
    indexes = pendingIndexes;
    pendingIndexes.catch(() => {
      if (indexes === pendingIndexes) {
        indexes = undefined;
      }
    });
  }
  return indexes;
}

/**
 * A family is one Mongo document. Its `current` token is replaced with a
 * find-and-update compare-and-set, so rotation and family invalidation never
 * need a MongoDB transaction (and therefore work on standalone deployments).
 */
export const mongoRefreshSessionStore: RefreshSessionStore = {
  async create(family, token) {
    await ensureRefreshSessionIndexes();
    await executeQuery(TOKEN_COLLECTION, (collection) => collection.insertOne(token));
    await executeQuery(FAMILY_COLLECTION, (collection) => collection.insertOne(family));
  },

  async rotate(current, replacement, now) {
    const family = await executeQuery(FAMILY_COLLECTION, (collection) =>
      (collection as unknown as Collection<RefreshTokenFamily>).findOneAndUpdate(
        {
          "current.selector": current.selector,
          "current.tokenHash": current.tokenHash,
          revokedAt: { $exists: false },
          expiresAt: { $gt: now },
        },
        { $set: { current: { selector: replacement.selector, tokenHash: replacement.tokenHash, createdAt: now } } },
        { returnDocument: "before" },
      ),
    );
    if (family) {
      const token: RefreshTokenRecord = { ...replacement, familyId: family.familyId, expiresAt: family.expiresAt };
      await executeQuery(TOKEN_COLLECTION, (collection) => collection.insertOne(token));
      return { kind: "rotated", userId: family.userId } satisfies RefreshRotation;
    }

    // A failed CAS for a known token is replay. This update is against the
    // family document, so it also revokes a successor created by another
    // process between the failed CAS and this lookup.
    const knownToken = await executeQuery(TOKEN_COLLECTION, (collection) =>
      (collection as unknown as Collection<RefreshTokenRecord>).findOne({
        selector: current.selector,
        tokenHash: current.tokenHash,
      }),
    );
    if (knownToken) {
      await executeQuery(FAMILY_COLLECTION, (collection) =>
        collection.updateOne(
          { familyId: knownToken.familyId, revokedAt: { $exists: false } },
          { $set: { revokedAt: now } },
        ),
      );
    }
    return { kind: "rejected" } satisfies RefreshRotation;
  },

  async revoke(selector, tokenHash, now) {
    const token = await executeQuery(TOKEN_COLLECTION, (collection) =>
      (collection as unknown as Collection<RefreshTokenRecord>).findOne({ selector, tokenHash }),
    );
    if (token) {
      await executeQuery(FAMILY_COLLECTION, (collection) =>
        collection.updateOne({ familyId: token.familyId, revokedAt: { $exists: false } }, { $set: { revokedAt: now } }),
      );
    }
  },
};
