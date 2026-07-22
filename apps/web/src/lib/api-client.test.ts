import assert from "node:assert/strict";
import test from "node:test";

const storage = new Map<string, string>();
Object.assign(globalThis, {
  localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  },
  window: new EventTarget(),
});

const { authenticatedFetch, createRefreshAccessToken, revokeRefreshToken } = await import("./api-client");

test("retries a sync request with a refreshed access token after expiry", async () => {
  storage.set("auth-token", "expired-access-token");
  const calls: Array<{ url: string; authorization: string | null; credentials?: RequestCredentials }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = input.toString();
    calls.push({
      url,
      authorization: new Headers(init?.headers).get("Authorization"),
      credentials: init?.credentials,
    });
    if (url.endsWith("/api/settings/v1.0") && calls.length === 1) {
      return new Response(null, { status: 401 });
    }
    if (url.endsWith("/api/auth/refresh")) {
      return Response.json({ accessToken: "fresh-access-token" });
    }
    return Response.json({ customBangs: [], defaultBang: null, lastModified: new Date().toISOString() });
  };

  try {
    const result = await authenticatedFetch<{ customBangs: Array<unknown> }>("/api/settings/v1.0");
    assert.deepEqual(result.customBangs, []);
    assert.equal(storage.get("auth-token"), "fresh-access-token");
    assert.deepEqual(
      calls.map((call) => call.authorization),
      ["Bearer expired-access-token", null, "Bearer fresh-access-token"],
    );
    assert.ok(calls.every((call) => call.credentials === "include"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("does not retry indefinitely and reports terminal refresh failure", async () => {
  storage.set("auth-token", "expired-access-token");
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(null, { status: 401 });
  };

  try {
    await assert.rejects(() => authenticatedFetch("/api/settings/v1.0"), { name: "UnauthorizedError" });
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("waits for the refresh-token revoke request", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; credentials?: RequestCredentials }> = [];
  globalThis.fetch = async (input, init) => {
    calls.push({ url: input.toString(), credentials: init?.credentials });
    await Promise.resolve();
    return new Response(null, { status: 204 });
  };

  try {
    await revokeRefreshToken();
    assert.equal(calls.length, 1);
    assert.ok(calls[0]?.url.endsWith("/api/auth/logout"));
    assert.equal(calls[0]?.credentials, "include");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("serializes simultaneous refreshes from separate tabs with the Web Lock", async () => {
  storage.set("auth-token", "expired-access-token");
  const originalFetch = globalThis.fetch;
  const originalNavigator = globalThis.navigator;
  let lockTail = Promise.resolve();
  let refreshCalls = 0;
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      locks: {
        request: async (_name: string, callback: () => Promise<string | null>) => {
          const previous = lockTail;
          let release: () => void = () => undefined;
          lockTail = new Promise<void>((resolve) => {
            release = resolve;
          });
          await previous;
          try {
            return await callback();
          } finally {
            release();
          }
        },
      },
    },
  });
  globalThis.fetch = async () => {
    refreshCalls += 1;
    await Promise.resolve();
    return Response.json({ accessToken: "fresh-access-token" });
  };

  try {
    // Separate coordinators model two independently-loaded browser tabs; they
    // share only storage, cookies, and the browser's Web Lock.
    const tabARefresh = createRefreshAccessToken();
    const tabBRefresh = createRefreshAccessToken();
    const [first, second] = await Promise.all([tabARefresh(), tabBRefresh()]);
    assert.equal(first, "fresh-access-token");
    assert.equal(second, "fresh-access-token");
    assert.equal(refreshCalls, 1);
  } finally {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: originalNavigator });
  }
});

test("shares the first refresh from a Web Lock with tabs that have no cached access token", async () => {
  storage.clear();
  const originalFetch = globalThis.fetch;
  const originalNavigator = globalThis.navigator;
  let lockTail = Promise.resolve();
  let refreshCalls = 0;
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      locks: {
        request: async (_name: string, callback: () => Promise<string | null>) => {
          const previous = lockTail;
          let release: () => void = () => undefined;
          lockTail = new Promise<void>((resolve) => {
            release = resolve;
          });
          await previous;
          try {
            return await callback();
          } finally {
            release();
          }
        },
      },
    },
  });
  globalThis.fetch = async () => {
    refreshCalls += 1;
    await Promise.resolve();
    return Response.json({ accessToken: "bootstrap-token" });
  };

  try {
    const tabARefresh = createRefreshAccessToken();
    const tabBRefresh = createRefreshAccessToken();
    const [first, second] = await Promise.all([tabARefresh(), tabBRefresh()]);
    assert.equal(first, "bootstrap-token");
    assert.equal(second, "bootstrap-token");
    assert.equal(refreshCalls, 1);
  } finally {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: originalNavigator });
  }
});

test("retains an explicitly supplied access token during bootstrap", async () => {
  storage.set("auth-token", "stale-access-token");
  const originalFetch = globalThis.fetch;
  let authorization: string | null = null;
  globalThis.fetch = async (_input, init) => {
    authorization = new Headers(init?.headers).get("Authorization");
    return Response.json({ displayName: "Ada" });
  };

  try {
    await authenticatedFetch("/api/user/v1.0/current", { headers: { Authorization: "Bearer bootstrap-token" } });
    assert.equal(authorization, "Bearer bootstrap-token");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("retries a rejected explicitly supplied token with the refreshed successor", async () => {
  storage.set("auth-token", "rejected-bootstrap-token");
  const originalFetch = globalThis.fetch;
  const authorizations: Array<string | null> = [];
  globalThis.fetch = async (input, init) => {
    const url = input.toString();
    authorizations.push(new Headers(init?.headers).get("Authorization"));
    if (url.endsWith("/api/auth/refresh")) {
      return Response.json({ accessToken: "refreshed-token" });
    }
    if (authorizations.length === 1) {
      return new Response(null, { status: 401 });
    }
    return Response.json({ displayName: "Ada" });
  };

  try {
    await authenticatedFetch("/api/user/v1.0/current", { headers: { Authorization: "Bearer bootstrap-token" } });
    assert.deepEqual(authorizations, ["Bearer bootstrap-token", null, "Bearer refreshed-token"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
