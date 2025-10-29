import type { ObjectId } from "bson";
import jwt from "jsonwebtoken";
import * as client from "openid-client";
import { executeQuery } from "./db/db";
import { logger } from "./logger";
import {
	type AuthEntity,
	AuthEntitySchema,
	type OIDCProvider,
	type OIDCStage,
} from "./models/auth";
import User from "./models/user";
import { internalServerError, redirect,requireEnv,getBaseUrl } from "./utils";
import { OAuthInvalidProviderError } from "./errors";

const CODE_CHALLENGE_METHOD = "S256";
const COOKIE_AUTH_CODE = "sso-auth-code";

const {GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET} = process.env;

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

// export async function loginLocally(email: string, password: string): Promise<Response> {
//   const user = await executeQuery("user", col => col.findOne<User>({ email: email }))

//   if (!user || !user.password) {
//     return Promise.reject("Incorrect username or password");
//   }

//   try {
//     await argon2.verify(user.password, password);
//     return Response.json({ token: createToken(user._id) });
//   } catch {
//     return Promise.reject("Incorrect username or password");
//   }
// }

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
			scope: "user:email",
			code_challenge,
			code_challenge_method: CODE_CHALLENGE_METHOD,
		};

		if (!getConfig(provider).serverMetadata().supportsPKCE()) {
			nonce = client.randomNonce();
			parameters.nonce = nonce;
		}

		const auth = AuthEntitySchema.parse({
			provider,
			code_verifier,
			expectedNonce: nonce,
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
		const tokens = await codeExchange(code, auth_code);

		const accessToken: string | undefined = tokens.access_token;
		const refreshToken: string | undefined = tokens.refresh_token;

		if (!accessToken) {
			logger.error("No access token received from OAuth provider");
			return internalServerError();
		}

		logger.info("Getting user email...");
		const userEmail = await getUserEmail(provider, accessToken);

		if (!userEmail) {
			logger.error("Could not retrieve user email");
			return internalServerError();
		}

		logger.info(`User email: ${userEmail}`);

		const user = await executeQuery("user", (col) =>
			col.findOne({ email: userEmail }),
		);
		let id: ObjectId;
		if (!user) {
			logger.info("Creating new user...");
			id = (
				await executeQuery("user", (col) =>
					col.insertOne(new User(userEmail, undefined)),
				)
			).insertedId;
		} else {
			logger.info("User found, using existing ID");
			id = user._id;
		}

		const token = createToken(id.toString());
		const redirectUrl = getFrontendRedirectUrl(token);

		logger.info(`Redirecting to frontend: ${redirectUrl}`);

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

async function getUserEmail(
	provider: string,
	token: string,
): Promise<string | undefined> {
	if (provider === "github") {
		try {
			// First try to get email from /user/emails endpoint
			const emails = await fetch("https://api.github.com/user/emails", {
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/vnd.github+json",
					"X-GitHub-Api-Version": "2022-11-28",
				},
			}).then((r) => r.json()) as Array<{ email: string; primary: boolean; verified: boolean }>;

			// Find primary verified email
			const primaryEmail = emails.find((e) => e.primary && e.verified);
			if (primaryEmail) {
				return primaryEmail.email;
			}

			// Fallback: get any verified email
			const verifiedEmail = emails.find((e) => e.verified);
			if (verifiedEmail) {
				return verifiedEmail.email;
			}

			// Last resort: try to get email from user object
			const user = await fetch("https://api.github.com/user", {
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/vnd.github+json",
					"X-GitHub-Api-Version": "2022-11-28",
				},
			}).then((r) => r.json()) as { email?: string };

			return user.email;
		} catch (error) {
			logger.error("Error fetching GitHub user email:", error);
			return undefined;
		}
	}
}

async function codeExchange(code: string, auth_code: string): Promise<Tokens> {
	console.log(code, auth_code);
	const auth = await executeQuery("auth", (col) =>
		col.findOne<AuthEntity>({ auth_code }),
	);

	if (!auth) {
		logger.error("Auth is null!");
		return Promise.reject();
	}

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

		return tokens as Tokens;
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
