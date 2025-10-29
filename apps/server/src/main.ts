import { githubResponse, loginGithub } from "./handlers/auth";
import { pullSettings, pushSettings } from "./handlers/settings";
import { getCurrentUser } from "./handlers/user";
import { logger } from "./logger";
import { authenticated } from "./middleware/authenticated";
import { requireEnv } from "./utils";

function createServer(): Bun.Server<unknown> {
	logger.info("Creating server...");

	const hostname = requireEnv("LISTEN_HOST");
	const port = requireEnv("LISTEN_PORT");

	const server = Bun.serve({
		hostname,
		port,
		async fetch(req) {
			const url = new URL(req.url);
			logger.info(`${req.method} ${url.pathname}`);

			// CORS headers
			const origin = req.headers.get("Origin") || "*";
			const corsHeaders = {
				"Access-Control-Allow-Origin": origin,
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Access-Control-Allow-Credentials": "true",
			};

			// Handle preflight requests
			if (req.method === "OPTIONS") {
				return new Response(null, { status: 204, headers: corsHeaders });
			}

			try {
				let response: Response;

				// Auth routes
				if (url.pathname === "/api/auth/github" && req.method === "GET") {
					response = await loginGithub(req as any);
				} else if (url.pathname === "/api/auth/github/callback" && req.method === "GET") {
					response = await githubResponse(req as any);
				} else if (url.pathname === "/api/user/v1.0/current" && req.method === "GET") {
					// User routes
					response = await authenticated(getCurrentUser)(req as any);
				} else if (url.pathname === "/api/settings/v1.0") {
					// Settings routes
					if (req.method === "GET") {
						response = await authenticated(pullSettings)(req as any);
					} else if (req.method === "PUT") {
						response = await authenticated(pushSettings)(req as any);
					} else {
						response = new Response("Not Found", { status: 404 });
					}
				} else {
					response = new Response("Not Found", { status: 404 });
				}

				// Add CORS headers to response
				Object.entries(corsHeaders).forEach(([key, value]) => {
					response.headers.set(key, value);
				});

				return response;
			} catch (error) {
				logger.error("Request error:", error);
				return new Response("Internal Server Error", {
					status: 500,
					headers: corsHeaders,
				});
			}
		},
	});

	logger.info(`Server created, listening on ${hostname}:${port}`);

	return server;
}

const server = createServer();

async function shutdown() {
	logger.info("Shutting down...");
	server.stop();
	await new Promise((RES) => setTimeout(RES, 3000));
	process.exit(0);
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
