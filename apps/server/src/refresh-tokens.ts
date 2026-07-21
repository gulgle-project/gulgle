import { createHash, randomBytes, randomUUID } from "node:crypto";

export const ACCESS_TOKEN_TTL = "15m";
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type RefreshTokenRecord = {
  selector: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  createdAt: Date;
};

/**
 * A refresh token family is one login session: the chain of refresh tokens
 * produced by rotation, starting from the token issued at login. Only the
 * `current` (most recently issued) token is valid. If an older token from the
 * chain is ever presented again, it has been replayed - likely stolen - and
 * the whole family is revoked, ending that session on every copy of the token.
 */
export type RefreshTokenFamily = {
  familyId: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  current: Pick<RefreshTokenRecord, "selector" | "tokenHash" | "createdAt">;
  revokedAt?: Date;
};

export type RefreshRotation = { kind: "rotated"; userId: string } | { kind: "rejected" };
export type RefreshTokenReplacement = Pick<RefreshTokenRecord, "selector" | "tokenHash" | "createdAt">;

export type RefreshSessionStore = {
  create(family: RefreshTokenFamily, token: RefreshTokenRecord): Promise<void>;
  rotate(
    current: { selector: string; tokenHash: string },
    replacement: RefreshTokenReplacement,
    now: Date,
  ): Promise<RefreshRotation>;
  revoke(selector: string, tokenHash: string, now: Date): Promise<void>;
};

export class RefreshTokenService {
  constructor(
    private readonly store: RefreshSessionStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async create(userId: string): Promise<string> {
    const token = createOpaqueToken();
    const now = this.now();
    const expiresAt = new Date(now.getTime() + REFRESH_TOKEN_TTL_MS);
    const familyId = randomUUID();
    await this.store.create(
      {
        familyId,
        userId,
        createdAt: now,
        expiresAt,
        current: { selector: token.selector, tokenHash: hashToken(token.value), createdAt: now },
      },
      { selector: token.selector, tokenHash: hashToken(token.value), familyId, createdAt: now, expiresAt },
    );
    return token.value;
  }

  async rotate(token: string | undefined): Promise<{ token: string; userId: string } | null> {
    const parsed = parseOpaqueToken(token);
    if (!parsed) {
      return null;
    }

    const now = this.now();
    const replacement = createOpaqueToken();
    const result = await this.store.rotate(
      { selector: parsed.selector, tokenHash: hashToken(parsed.value) },
      {
        selector: replacement.selector,
        tokenHash: hashToken(replacement.value),
        createdAt: now,
      },
      now,
    );
    return result.kind === "rotated" ? { token: replacement.value, userId: result.userId } : null;
  }

  async revoke(token: string | undefined): Promise<void> {
    const parsed = parseOpaqueToken(token);
    if (parsed) {
      await this.store.revoke(parsed.selector, hashToken(parsed.value), this.now());
    }
  }
}

function createOpaqueToken(): { selector: string; value: string } {
  const selector = randomUUID();
  return { selector, value: `${selector}.${randomBytes(32).toString("base64url")}` };
}

function parseOpaqueToken(token: string | undefined): { selector: string; value: string } | null {
  if (!token) {
    return null;
  }
  const [selector, secret, ...extra] = token.split(".");
  return selector && secret && extra.length === 0 ? { selector, value: token } : null;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
