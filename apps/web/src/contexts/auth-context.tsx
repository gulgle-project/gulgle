import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { authenticatedFetch, onAuthExpired, refreshAccessToken, revokeRefreshToken } from "@/lib/api-client";

// Storage keys
const TOKEN_STORAGE_KEY = "auth-token";
const USER_STORAGE_KEY = "auth-user";
const EXPLICIT_LOGOUT_STORAGE_KEY = "auth-explicitly-logged-out";

// Types
export type User = {
  displayName: string;
  email?: string | null;
};

export type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
};

export type AuthContextValue = AuthState & {
  login: (token?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setToken: (token: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Helper functions for token management
function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (error) {
    console.error("Failed to store token:", error);
  }
}

function removeStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to remove token:", error);
  }
}

function getStoredUser(): User | null {
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function setStoredUser(user: User): void {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("Failed to store user:", error);
  }
}

function removeStoredUser(): void {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to remove user:", error);
  }
}

function isExplicitlyLoggedOut(): boolean {
  try {
    return localStorage.getItem(EXPLICIT_LOGOUT_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function setExplicitlyLoggedOut(): void {
  try {
    localStorage.setItem(EXPLICIT_LOGOUT_STORAGE_KEY, "true");
  } catch (error) {
    console.error("Failed to persist logout state:", error);
  }
}

function clearExplicitLogout(): void {
  try {
    localStorage.removeItem(EXPLICIT_LOGOUT_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear logout state:", error);
  }
}

// Decode JWT to check expiration (basic implementation without jwt-decode library)
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return true;
    }

    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) {
      return false;
    }

    // Check if token expires in the next 5 minutes (buffer time)
    const expiresAt = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const buffer = 5 * 60 * 1000; // 5 minutes

    return now >= expiresAt - buffer;
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Fetch current user from API
  const fetchCurrentUser = useCallback(async (token: string): Promise<User | null> => {
    try {
      // Keep bootstrap and callback requests on the same one-refresh-and-retry
      // path as normal API calls.
      return await authenticatedFetch<User>("/api/user/v1.0/current", {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  }, []);

  // Login function - stores token and fetches user
  const login = useCallback(
    async (token?: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Browser logins receive the durable credential in an HttpOnly cookie;
        // iOS may supply its one-time access token through its app callback.
        const accessToken = token ?? (await refreshAccessToken());
        if (!accessToken || isTokenExpired(accessToken)) {
          throw new Error("Invalid or expired token");
        }

        // Fetch user data
        const user = await fetchCurrentUser(accessToken);

        if (!user) {
          throw new Error("Failed to fetch user data");
        }

        // Store token and user
        setStoredToken(accessToken);
        setStoredUser(user);
        clearExplicitLogout();

        setState({
          user,
          token: accessToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Login failed";
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        // Clean up on error
        removeStoredToken();
        removeStoredUser();

        throw error;
      }
    },
    [fetchCurrentUser],
  );

  const clearLocalAuth = useCallback(() => {
    removeStoredToken();
    removeStoredUser();
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  // Logout clears this tab immediately, but waits for the best-effort server
  // revocation so a later bootstrap cannot silently restore the session.
  const logout = useCallback(async () => {
    setExplicitlyLoggedOut();
    clearLocalAuth();
    try {
      await revokeRefreshToken();
    } catch (error) {
      console.error("Failed to revoke refresh token:", error);
    }
  }, [clearLocalAuth]);

  useEffect(() => onAuthExpired(clearLocalAuth), [clearLocalAuth]);

  // Set token directly (for callback page)
  const setToken = useCallback((token: string) => {
    setStoredToken(token);
    setState((prev) => ({ ...prev, token }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (isExplicitlyLoggedOut()) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      const storedToken = getStoredToken();
      const storedUser = getStoredUser();

      if (!storedToken) {
        // The access token is only a cache. A previously authenticated browser
        // may have a valid HttpOnly refresh cookie even when local storage was
        // cleared (or in a newly opened tab), so bootstrap from that cookie.
        const freshToken = await refreshAccessToken();
        if (!freshToken) {
          setState((prev) => ({ ...prev, isLoading: false }));
          return;
        }
        const user = await fetchCurrentUser(freshToken).catch(() => null);
        if (!user) {
          clearLocalAuth();
          return;
        }
        setStoredUser(user);
        setState({ user, token: freshToken, isAuthenticated: true, isLoading: false, error: null });
        return;
      }

      // An access token is intentionally short lived. Restore it with the
      // HttpOnly refresh cookie instead of treating expiry as a logout.
      if (isTokenExpired(storedToken)) {
        const freshToken = await refreshAccessToken();
        if (!freshToken) {
          clearLocalAuth();
          return;
        }
        const user = await fetchCurrentUser(freshToken).catch(() => null);
        if (!user) {
          clearLocalAuth();
          return;
        }
        setStoredUser(user);
        setState({ user, token: freshToken, isAuthenticated: true, isLoading: false, error: null });
        return;
      }

      // If we have both token and user cached, use them
      if (storedUser) {
        setState({
          user: storedUser,
          token: storedToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return;
      }

      // If we only have token, fetch user
      try {
        const user = await fetchCurrentUser(storedToken);
        if (user) {
          setStoredUser(user);
          setState({
            user,
            token: storedToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          clearLocalAuth();
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        clearLocalAuth();
      }
    };

    initializeAuth();
  }, [clearLocalAuth, fetchCurrentUser]);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    clearError,
    setToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
