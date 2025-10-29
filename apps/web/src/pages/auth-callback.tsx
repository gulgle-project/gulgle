import { useEffect, useState } from "react";
import { Page } from "@/components/layout/page";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "@/contexts/router-context";

export function AuthCallbackPage() {
  const { login, isAuthenticated } = useAuth();
  const { navigate, replace } = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract token from URL hash fragment
        // Backend redirects to: /auth/success#token=xxx
        const hash = window.location.hash;
        if (!hash) {
          setError("No authentication token received");
          return;
        }

        const params = new URLSearchParams(hash.substring(1)); // Remove # from hash
        const token = params.get("token");

        if (!token) {
          setError("Invalid authentication response");
          return;
        }

        // Login with the token
        await login(token);

        // Clean up the URL (remove hash)
        replace("/auth/success");

        // Redirect to settings page after successful login
        setTimeout(() => {
          navigate("/settings");
        }, 1000);
      } catch (err) {
        console.error("Authentication error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
      }
    };

    // Only process if not already authenticated
    if (!isAuthenticated) {
      handleCallback();
    } else {
      // Already authenticated, redirect to settings
      navigate("/settings");
    }
  }, [login, navigate, replace, isAuthenticated]);

  if (error) {
    return (
      <Page>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-red-600 dark:text-red-400 text-lg font-semibold">Authentication Failed</div>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Return to login
            </button>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="text-gray-800 dark:text-gray-100 text-lg font-semibold">
            {isAuthenticated ? "Authentication Successful!" : "Completing authentication..."}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            {isAuthenticated ? "Redirecting to settings..." : "Please wait..."}
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 dark:border-gray-100" />
          </div>
        </div>
      </div>
    </Page>
  );
}
