// API Client for authenticated requests
import type { SettingsDTO } from "gulgle-shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// Types
export type User = {
  id: string;
  email: string;
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
function getAuthToken(): string | null {
  try {
    return localStorage.getItem("auth-token");
  } catch {
    return null;
  }
}

// Generic fetch wrapper with authentication
async function authenticatedFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();

  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle errors
  if (!response.ok) {
    if (response.status === 401) {
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
  if (!contentType || !contentType.includes("application/json")) {
    return null as T;
  }

  return response.json();
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
