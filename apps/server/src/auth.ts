import type { ObjectId } from "bson";
import jwt from "jsonwebtoken";
import * as client from "openid-client";
import { executeQuery } from "./db/db";
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
import { internalServerError, redirect,requireEnv,getBaseUrl } from "./utils";
import { OAuthInvalidProviderError } from "./errors";

const CODE_CHALLENGE_METHOD = "S256";
const COOKIE_AUTH_CODE = "sso-auth-code";

const {GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET} = process.env;

type OAuthUser = {
  externalId: string;
  displayName?: string;
  email?: string;
};

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
  console.error("Please provice github oauth params.");
  process.exit(1);
}

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

export async function oidcLogin(
	provider: OIDCProvider,
	stage: OIDCStage,
	req: Bun.BunRequest<string>,
): Promise<Response> {
	if (stage === "redirect") {
		let nonce: string | undefined;
		const code_verifier = client.randomPKCECodeVerifier();
		const code_challenge =
			await client.calculatePKCECodeChallenge(code_verifier);

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
		const platform: OIDCPlatform = platformParam && (OIDCPlatformValues as readonly string[]).includes(platformParam)
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
				"Set-Cookie": `${COOKIE_AUTH_CODE}=${auth.auth_code.toString()}; HttpOnly; Path=/; SameSite=Lax`,
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
		const refreshToken: string | undefined = tokens.refresh_token;

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

		const user = await executeQuery("user", (col) =>
			col.findOne<User>({ provider, externalId: externalUser.externalId }),
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
			id = user._id!;

      // Update if out of date
      user.displayName = externalUser.displayName;
      user.email = externalUser.email;

      await executeQuery("user", (col) => col.updateOne({ _id: id }, { "$set": { displayName: user.displayName , email: user.email } }))
		}

		const token = createToken(id.toString());
		const redirectUrl = platform === "ios"
			? getIOSRedirectUrl(token)
			: getFrontendRedirectUrl(token);

		logger.debug(`Redirecting to frontend: ${redirectUrl}`);

		// Delete the auth cookie and redirect
		return new Response(null, {
			status: 302,
			headers: {
				Location: redirectUrl,
				"Set-Cookie": `${COOKIE_AUTH_CODE}=; HttpOnly; Path=/; Max-Age=0`,
			},
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

function getFrontendRedirectUrl(token: string): string {
  const baseFrontendUrl = requireEnv("BASE_FRONTEND_URL");
  return `${baseFrontendUrl}/auth/success#token=${encodeURIComponent(token)}`
}

function getIOSRedirectUrl(token: string): string {
  return `gulgle://auth/callback#token=${encodeURIComponent(token)}`;
}

async function getExternalId(
	provider: string,
	token: string,
): Promise<OAuthUser | undefined> {
	if (provider === "github") {
		try {
			const user = await fetch("https://api.github.com/user", {
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/vnd.github+json",
					"X-GitHub-Api-Version": "2026-03-10",
				},
			}).then((r) => r.json()) as any;

			return {
        externalId: user.id,
        displayName: !user.name ? undefined : user.name,
        email: !user.email ? undefined : user.email
      };
		} catch (error) {
			logger.error("Error fetching GitHub user external id:", error);
			return undefined;
		}
	}
}

async function codeExchange(code: string, auth_code: string): Promise<{ tokens: Tokens; platform: OIDCPlatform }> {
	const auth = await executeQuery("auth", (col) =>
		col.findOne<AuthEntity>({ auth_code }),
	);

	if (!auth) {
		logger.error("Auth is null!");
		return Promise.reject();
	}

	const platform = auth.platform ?? "web";

	if (auth.provider === "github") {
		const data = new URLSearchParams();

		data.append("client_id", GITHUB_CLIENT_ID!);
		data.append("client_secret", GITHUB_CLIENT_SECRET!);
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

function createToken(userId: string): string {
	return jwt.sign({ userId: userId }, getJwtSecret(), { expiresIn: "1D" });
}

export function getJwtSecret() {
	const secret = process.env.JWT_SECRET;

	if (!secret) {
		throw Error("no");
	}

	return secret;
}
