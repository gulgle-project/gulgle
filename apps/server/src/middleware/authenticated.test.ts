import assert from "node:assert/strict";
import test from "node:test";

process.env.GITHUB_CLIENT_ID = "test-client";
process.env.GITHUB_CLIENT_SECRET = "test-secret";
process.env.JWT_SECRET = "test-jwt-secret";

const { authenticated } = await import("./authenticated");

test("redirects unauthenticated requests to login", async () => {
  const handler = authenticated(async () => Response.json({ authenticated: true }));
  const response = await handler(new Request("http://localhost/api/settings/v1.0"));

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "/login");
});
