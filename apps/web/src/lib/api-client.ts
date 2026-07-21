// API Client for authenticated requests
import type { SettingsDTO } from "gulgle-shared";

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "http://localhost:3000";
const TOKEN_STORAGE_KEY = "auth-token";
const AUTH_EXPIRED_EVENT = "gulgle:auth-expired";

// Types
export type User = {
  email?: string | null;
  displayName: string;
};

export type { SettingsDTO };

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor() {
    super("Unauthorized", 401, "Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Conflict") {
    super(message, 409, "Conflict");
    this.name = "ConflictError";
  }
}

// Helper to get auth token from localStorage
export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeAccessToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function createRefreshAccessToken(): () => Promise<string | null> {
  let pendingRefresh: Promise<string | null> | undefined;
  return async () => {
    if (!pendingRefresh) {
      pendingRefresh = refreshWithCrossTabLock().finally(() => {
        pendingRefresh = undefined;
      });
    }
    return pendingRefresh;
  };
}

export const refreshAccessToken = createRefreshAccessToken();

async function refreshWithCrossTabLock(): Promise<string | null> {
  const tokenBeforeLock = getAuthToken();
  const refresh = () =>
    fetch(`${API_BASE_URL}/api/auth/refresh`, { method: "POST", credentials: "include" })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }
        const body = (await response.json()) as { accessToken?: unknown };
        if (typeof body.accessToken !== "string") {
          return null;
        }
        storeAccessToken(body.accessToken);
        return body.accessToken;
      })
      .catch(() => null);

  // Web Locks are shared by same-origin tabs. The second tab reuses the access
  // token written by the lock holder rather than presenting the just-rotated
  // cookie as a replay. Browsers without Web Locks retain the server's strict
  // replay behaviour instead of accepting a weaker grace window.
  if (!globalThis.navigator?.locks) {
    return refresh();
  }
  return globalThis.navigator.locks.request("gulgle-refresh-token", async () => {
    const tokenAfterLock = getAuthToken();
    // This also covers concurrent first-time bootstrap, when the waiting tab
    // had no access token before acquiring the lock.
    if (tokenAfterLock && tokenAfterLock !== tokenBeforeLock) {
      return tokenAfterLock;
    }
    return refresh();
  });
}

function notifyAuthExpired(): void {
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}

export function onAuthExpired(listener: () => void): () => void {
  window.addEventListener(AUTH_EXPIRED_EVENT, listener);
  return () => window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
}

// Generic fetch wrapper with authentication. A 401 gets one cookie-backed refresh and retry.
export async function authenticatedFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const request = async (useProvidedAuthorization = true) => {
    const token = getAuthToken();
    const headers = new Headers(options.headers);
    if (!useProvidedAuthorization) {
      headers.delete("Authorization");
    }
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
    }
    return fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers, credentials: "include" });
  };

  let response = await request();
  if (response.status === 401 && (await refreshAccessToken())) {
    // A caller can supply an access token during bootstrap. Retrying that
    // rejected token would defeat refresh, so always use the stored successor.
    response = await request(false);
  }

  // Handle errors
  if (!response.ok) {
    if (response.status === 401) {
      notifyAuthExpired();
      throw new UnauthorizedError();
    }
    if (response.status === 409) {
      const message = await response.text().catch(() => "Conflict");
      throw new ConflictError(message);
    }
    throw new ApiError(`Request failed: ${response.statusText}`, response.status, response.statusText);
  }

  // Handle empty responses
  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return null as T;
  }
  return response.json();
}

export async function revokeRefreshToken(): Promise<void> {
  await fetch(`${API_BASE_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
}

// API methods

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User> {
  return authenticatedFetch<User>("/api/user/v1.0/current");
}

/**
 * Pull settings from server
 */
export async function pullSettings(): Promise<SettingsDTO> {
  return authenticatedFetch<SettingsDTO>("/api/settings/v1.0", {
    method: "GET",
  });
}

/**
 * Push settings to server
 */
export async function pushSettings(settings: SettingsDTO): Promise<SettingsDTO> {
  return authenticatedFetch<SettingsDTO>("/api/settings/v1.0", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

/**
 * Initiate GitHub OAuth login
 * Redirects to backend OAuth endpoint
 */
export function initiateGithubLogin(): void {
  window.location.href = `${API_BASE_URL}/api/auth/github`;
}

// Export API client as a namespace
export const apiClient = {
  getCurrentUser,
  pullSettings,
  pushSettings,
  initiateGithubLogin,
};
