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

const CODE_CHALLENGE_METHOD = "S256";
const COOKIE_AUTH_CODE = "sso-auth-code";

const githubConfig = new client.Configuration(
	{
		issuer: "https://github.com",
		authorization_endpoint: "https://github.com/login/oauth/authorize",
		token_endpoint: "https://github.com/login/oauth/access_token",
	},
	process.env.GITHUB_CLIENT_ID,
	process.env.GITHUB_CLIENT_SECRET,
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
			scope: "openid email",
			code_challenge,
			code_challenge_method: CODE_CHALLENGE_METHOD,
		};

		if (!getConfig(provider).serverMetadata().supportsPKCE()) {
			nonce = client.randomNonce();
			parameters.nonce = nonce;
		}

		const cookies = req.cookies;

		const auth = AuthEntitySchema.parse({
			provider,
			code_verifier,
			expectedNonce: nonce,
		});

		executeQuery("auth", (col) => col.insertOne(auth));

		cookies.set(COOKIE_AUTH_CODE, auth.auth_code.toString());

		return redirect(
			client.buildAuthorizationUrl(getConfig(provider), parameters).toString(),
		);
	}

	if (stage === "response") {
		const cookies = req.cookies;
		const auth_code = cookies.get(COOKIE_AUTH_CODE);

		if (!auth_code) {
			return new Response(null, { status: 500 });
		}

		cookies.delete(COOKIE_AUTH_CODE);

		const code = new URL(req.url).searchParams.get("code");
		if (!code) {
			return internalServerError();
		}

		const tokens = await codeExchange(code, auth_code);

		const accessToken: string | undefined = tokens.access_token;
		const refreshToken: string | undefined = tokens.refresh_token;

		if (!accessToken) {
			return internalServerError();
		}

		const userEmail = await getUserEmail(provider, accessToken);

		if (!userEmail) {
			return internalServerError();
		}

		const user = await executeQuery("user", (col) =>
			col.findOne({ email: userEmail }),
		);
		let id: ObjectId;
		if (!user) {
			id = (
				await executeQuery("user", (col) =>
					col.insertOne(new User(userEmail, undefined)),
				)
			).insertedId;
		} else {
			id = user._id;
		}

		return Response.json({ token: createToken(id.toString()) });
	}
}

function getConfig(provider: OIDCProvider): client.Configuration {
	if (provider === "github") {
		return githubConfig;
	}
}

function getRedirectUrl(provider: string): string {
	//TODO
	if (provider === "github") {
		return `${getBaseUrl()}/api/auth/github/callback`;
	}
}

async function getUserEmail(
	provider: string,
	token: string,
): Promise<string | undefined> {
	if (provider === "github") {
		const res: { email: string; primary: boolean }[] = await fetch(
			"https://api.github.com/user/public_emails",
			{
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/vnd.github+json",
					"X-GitHub-Api-Version": "2022-11-28",
				},
			},
		).then((r) => r.json());

		return res.find((v) => v.primary)?.email;
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

		data.append("client_id", process.env.GITHUB_CLIENT_ID);
		data.append("client_secret", process.env.GITHUB_CLIENT_SECRET);
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
