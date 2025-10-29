import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";

// Storage keys
const TOKEN_STORAGE_KEY = "auth-token";
const USER_STORAGE_KEY = "auth-user";

// Types
export type User = {
  id: string;
  email: string;
};

export type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
};

export type AuthContextValue = AuthState & {
  login: (token: string) => Promise<void>;
  logout: () => void;
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
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const response = await fetch(`${apiBaseUrl}/api/user/v1.0/current`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed");
        }
        throw new Error("Failed to fetch user");
      }

      const user = await response.json();
      return user;
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  }, []);

  // Login function - stores token and fetches user
  const login = useCallback(
    async (token: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Validate token format
        if (!token || isTokenExpired(token)) {
          throw new Error("Invalid or expired token");
        }

        // Fetch user data
        const user = await fetchCurrentUser(token);

        if (!user) {
          throw new Error("Failed to fetch user data");
        }

        // Store token and user
        setStoredToken(token);
        setStoredUser(user);

        setState({
          user,
          token,
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

  // Logout function
  const logout = useCallback(() => {
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
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();

      if (!storedToken) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      // Check if token is expired
      if (isTokenExpired(storedToken)) {
        logout();
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
          logout();
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        logout();
      }
    };

    initializeAuth();
  }, [fetchCurrentUser, logout]);

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
