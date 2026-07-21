import type { ObjectId } from "bson";
import jwt from "jsonwebtoken";
import * as client from "openid-client";
import { executeQuery } from "./db/db";
import { OAuthInvalidProviderError } from "./errors";
import { logger } from "./logger";
import {
  type AuthEntity,
  AuthEntitySchema,
  type OIDCPlatform,
  OIDCPlatformValues,
  type OIDCProvider,
  type OIDCStage,
} from "./models/auth";
import User from "./models/user";
import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL_MS, RefreshTokenService } from "./refresh-tokens";
import { mongoRefreshSessionStore } from "./repositories/refresh-session";
import { getBaseUrl, internalServerError, requireEnv } from "./utils";

const CODE_CHALLENGE_METHOD = "S256";
const COOKIE_AUTH_CODE = "sso-auth-code";
export const REFRESH_COOKIE = "gulgle-refresh";
const refreshTokenService = new RefreshTokenService(mongoRefreshSessionStore);

const GITHUB_CLIENT_ID = requireEnv("GITHUB_CLIENT_ID");
const GITHUB_CLIENT_SECRET = requireEnv("GITHUB_CLIENT_SECRET");

type OAuthUser = {
  externalId: string;
  displayName?: string;
  email?: string;
};

type GitHubUser = {
  id: number | string;
  name?: string | null;
  email?: string | null;
};

type StoredUser = Omit<User, "externalId"> & {
  externalId: string | number;
};

const githubConfig = new client.Configuration(
  {
    issuer: "https://github.com",
    authorization_endpoint: "https://github.com/login/oauth/authorize",
    token_endpoint: "https://github.com/login/oauth/access_token",
  },
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
);

export type Tokens = {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
};

export async function oidcLogin(provider: OIDCProvider, stage: OIDCStage, req: Request): Promise<Response> {
  if (stage === "redirect") {
    let nonce: string | undefined;
    const code_verifier = client.randomPKCECodeVerifier();
    const code_challenge = await client.calculatePKCECodeChallenge(code_verifier);

    const parameters: Record<string, string> = {
      redirect_uri: getRedirectUrl(provider),
      code_challenge,
      code_challenge_method: CODE_CHALLENGE_METHOD,
    };

    if (!getConfig(provider).serverMetadata().supportsPKCE()) {
      nonce = client.randomNonce();
      parameters.nonce = nonce;
    }

    switch (provider) {
      case "github":
        parameters.scope = "user";
        break;
    }

    // Read platform from query parameter (defaults to "web")
    const requestUrl = new URL(req.url);
    const platformParam = requestUrl.searchParams.get("platform");
    const platform: OIDCPlatform =
      platformParam && (OIDCPlatformValues as ReadonlyArray<string>).includes(platformParam)
        ? (platformParam as OIDCPlatform)
        : "web";

    const auth = AuthEntitySchema.parse({
      provider,
      code_verifier,
      expectedNonce: nonce,
      platform,
    });

    await executeQuery("auth", (col) => col.insertOne(auth));

    const authUrl = client.buildAuthorizationUrl(getConfig(provider), parameters).toString();

    // Set cookie and redirect
    const response = new Response(null, {
      status: 302,
      headers: {
        Location: authUrl,
        "Set-Cookie": authCodeCookie(auth.auth_code.toString(), req),
      },
    });

    return response;
  }

  if (stage === "response") {
    const cookieHeader = req.headers.get("Cookie");
    const cookies = cookieHeader
      ? Object.fromEntries(
          cookieHeader.split("; ").map((c) => {
            const [key, ...v] = c.split("=");
            return [key, v.join("=")];
          }),
        )
      : {};

    const auth_code = cookies[COOKIE_AUTH_CODE];

    if (!auth_code) {
      logger.error("Missing auth code cookie");
      return new Response("Missing auth code cookie", { status: 500 });
    }

    const code = new URL(req.url).searchParams.get("code");
    if (!code) {
      logger.error("Missing OAuth code parameter");
      return internalServerError();
    }

    logger.info("Exchanging code for tokens...");
    const { tokens, platform } = await codeExchange(code, auth_code);

    const accessToken: string | undefined = tokens.access_token;

    if (!accessToken) {
      logger.error("No access token received from OAuth provider");
      return internalServerError();
    }

    logger.info("Getting user external id...");
    const externalUser = await getExternalId(provider, accessToken);

    if (!externalUser) {
      logger.error("Could not retrieve user external id");
      return internalServerError();
    }

    const externalIds: Array<string | number> = [externalUser.externalId];
    const legacyExternalId = Number(externalUser.externalId);
    if (Number.isSafeInteger(legacyExternalId)) {
      externalIds.push(legacyExternalId);
    }

    const user = await executeQuery("user", (col) =>
      col.findOne<StoredUser>({ provider, externalId: { $in: externalIds } }),
    );

    let id: ObjectId;
    if (!user) {
      logger.info("Creating new user...");
      id = (
        await executeQuery("user", (col) =>
          col.insertOne(new User(provider, externalUser.externalId, externalUser.displayName, externalUser.email)),
        )
      ).insertedId;
    } else {
      logger.info("User found, using existing ID");
      if (!user._id) {
        logger.error("User found without ID");
        return internalServerError();
      }

      id = user._id;

      // Update if out of date
      user.displayName = externalUser.displayName;
      user.email = externalUser.email;

      await executeQuery("user", (col) =>
        col.updateOne(
          { _id: id },
          {
            $set: {
              externalId: externalUser.externalId,
              displayName: user.displayName,
              email: user.email,
            },
          },
        ),
      );
    }

    const token = createToken(id.toString());
    const refreshToken = await refreshTokenService.create(id.toString());
    const redirectUrl = platform === "ios" ? getIOSRedirectUrl(token, refreshToken) : getFrontendRedirectUrl();

    logger.debug(`Redirecting authenticated ${platform} client`);

    // Delete the auth cookie and redirect
    const headers = new Headers({ Location: redirectUrl });
    headers.append("Set-Cookie", clearAuthCodeCookie(req));
    headers.append("Set-Cookie", refreshCookie(refreshToken, req));
    return new Response(null, {
      status: 302,
      headers,
    });
  }

  throw new Error("OAuth error invalid stage:", stage);
}

function getConfig(provider: OIDCProvider): client.Configuration {
  if (provider === "github") {
    return githubConfig;
  }

  throw new OAuthInvalidProviderError(provider);
}

function getRedirectUrl(provider: string): string {
  //TODO
  if (provider === "github") {
    return `${getBaseUrl()}/api/auth/github/callback`;
  }

  throw new OAuthInvalidProviderError(provider);
}

function getFrontendRedirectUrl(): string {
  const baseFrontendUrl = requireEnv("BASE_FRONTEND_URL");
  return `${baseFrontendUrl}/#/auth/success`;
}

function getIOSRedirectUrl(token: string, refreshToken: string): string {
  return `gulgle://auth/callback#token=${encodeURIComponent(token)}&refresh_token=${encodeURIComponent(refreshToken)}`;
}

async function getExternalId(provider: string, token: string): Promise<OAuthUser | undefined> {
  if (provider === "github") {
    try {
      const user = (await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2026-03-10",
        },
      }).then((r) => r.json())) as GitHubUser;

      return {
        externalId: user.id.toString(),
        displayName: !user.name ? undefined : user.name,
        email: !user.email ? undefined : user.email,
      };
    } catch (error) {
      logger.error("Error fetching GitHub user external id:", error);
      return undefined;
    }
  }
}

async function codeExchange(code: string, auth_code: string): Promise<{ tokens: Tokens; platform: OIDCPlatform }> {
  const auth = await executeQuery("auth", (col) => col.findOne<AuthEntity>({ auth_code }));

  if (!auth) {
    logger.error("Auth is null!");
    return Promise.reject();
  }

  const platform = auth.platform ?? "web";

  if (auth.provider === "github") {
    const data = new URLSearchParams();

    data.append("client_id", GITHUB_CLIENT_ID);
    data.append("client_secret", GITHUB_CLIENT_SECRET);
    data.append("code", code);
    data.append("code_verifier", auth.code_verifier);
    data.append("nonce", auth.expectedNonce);
    data.append("accept", "application/json");

    const tokens = await fetch(`https://github.com/login/oauth/access_token`, {
      method: "POST",
      body: data,
      headers: { Accept: "application/json" },
    }).then((r) => r.json());

    return { tokens: tokens as Tokens, platform };
  }

  throw new OAuthInvalidProviderError(auth.provider);
}

export function createToken(userId: string): string {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: ACCESS_TOKEN_TTL });
}

export async function refreshAccessToken(req: Request): Promise<Response> {
  try {
    const cookieRefreshToken = getCookie(req, REFRESH_COOKIE);
    const refreshToken = cookieRefreshToken ?? (await getRefreshTokenFromBody(req));
    const rotated = await refreshTokenService.rotate(refreshToken);
    if (!rotated) {
      if (refreshToken) {
        // A presented but rejected token means an expired session or a replayed
        // (possibly stolen) token that revoked its family. Worth surfacing.
        logger.warn("Refresh token rotation rejected");
      }
      return new Response(null, { status: 401, headers: { "Set-Cookie": clearRefreshCookie(req) } });
    }

    // Native clients present the token in the request body because they cannot
    // use the browser's HttpOnly cookie. Return the rotated successor to them.
    const body = cookieRefreshToken
      ? { accessToken: createToken(rotated.userId) }
      : { accessToken: createToken(rotated.userId), refreshToken: rotated.token };
    return Response.json(body, { headers: { "Set-Cookie": refreshCookie(rotated.token, req) } });
  } catch (error) {
    logger.error("Refresh token error:", error);
    return new Response(null, { status: 401, headers: { "Set-Cookie": clearRefreshCookie(req) } });
  }
}

async function getRefreshTokenFromBody(req: Request): Promise<string | undefined> {
  if (!req.headers.get("Content-Type")?.includes("application/json")) {
    return undefined;
  }

  const body: unknown = await req.json();
  if (!body || typeof body !== "object") {
    return undefined;
  }
  // Must match the `refreshToken` key returned by the refresh endpoint's JSON body.
  const refreshToken = (body as { refreshToken?: unknown }).refreshToken;
  return typeof refreshToken === "string" ? refreshToken : undefined;
}

export async function logout(req: Request): Promise<Response> {
  try {
    await refreshTokenService.revoke(getCookie(req, REFRESH_COOKIE));
  } catch (error) {
    // Local logout must still remove the browser credential if persistence is unavailable.
    logger.error("Logout error:", error);
  }
  return new Response(null, { status: 204, headers: { "Set-Cookie": clearRefreshCookie(req) } });
}

function getCookie(req: Request, name: string): string | undefined {
  const cookie = req.headers.get("Cookie");
  if (!cookie) {
    return undefined;
  }

  for (const part of cookie.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) {
      return value.join("=");
    }
  }
  return undefined;
}

function refreshCookie(token: string, req: Request): string {
  // The refresh cookie is only ever presented by same-site fetches to
  // /api/auth, so Strict adds CSRF protection without breaking any flow.
  return `${REFRESH_COOKIE}=${token}; HttpOnly; Path=/api/auth; Max-Age=${Math.floor(
    REFRESH_TOKEN_TTL_MS / 1000,
  )}; SameSite=Strict${secureAttribute(req)}`;
}

function clearRefreshCookie(req: Request): string {
  return `${REFRESH_COOKIE}=; HttpOnly; Path=/api/auth; Max-Age=0; SameSite=Strict${secureAttribute(req)}`;
}

function authCodeCookie(authCode: string, req: Request): string {
  // Lax (not Strict) is required. Although we both set and read this cookie,
  // SameSite is evaluated against the site that *initiates* the request, not
  // the one that set the cookie: the /callback request is a top-level
  // redirect initiated by the OAuth provider (github.com), which browsers
  // treat as cross-site and therefore omit Strict cookies from, breaking
  // login. Lax cookies are still sent on top-level GET navigations.
  return `${COOKIE_AUTH_CODE}=${authCode}; HttpOnly; Path=/; SameSite=Lax${secureAttribute(req)}`;
}

function clearAuthCodeCookie(req: Request): string {
  return `${COOKIE_AUTH_CODE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secureAttribute(req)}`;
}

function secureAttribute(req: Request): string {
  // Outside local development the Secure attribute is mandatory, regardless
  // of what protocol the (possibly misconfigured) proxy chain reports.
  // Only plain-http requests in a dev environment may omit it.
  const isDevEnv = process.env.NODE_ENV === undefined || process.env.NODE_ENV === "development";
  return isDevEnv && !isSecureRequest(req) ? "" : "; Secure";
}

function isSecureRequest(req: Request): boolean {
  if (new URL(req.url).protocol === "https:") {
    return true;
  }

  // Proxies may append their protocol to an existing forwarded chain.
  const forwardedProto = req.headers.get("X-Forwarded-Proto")?.split(",")[0]?.trim().toLowerCase();
  return forwardedProto === "https";
}

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw Error("no");
  }

  return secret;
}
