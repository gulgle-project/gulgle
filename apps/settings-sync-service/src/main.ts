import { githubResponse, loginGithub } from "./handlers/auth";
import { pullSettings, pushSettings } from "./handlers/settings";
import { getCurrentUser } from "./handlers/user";
import { logger } from "./logger";
import { authenticated } from "./middleware/authenticated";
import { requireEnv } from "./utils";

function createServer(): Bun.Server {
	logger.info("Creating server...");

  const hostname = requireEnv("LISTEN_HOST");
  const port = requireEnv("LISTEN_PORT");

	const server = Bun.serve({
		hostname,
		port,
		routes: {
			// "/api/login": loginUsernamePassword,
			"/api/auth/github": loginGithub,
			"/api/auth/github/callback": githubResponse,
			"/api/user/v1.0/current": authenticated(getCurrentUser),
			"/api/settings/v1.0": {
				PUT: authenticated(pushSettings),
				GET: authenticated(pullSettings),
			},
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
