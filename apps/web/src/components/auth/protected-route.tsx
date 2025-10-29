import { type ReactNode, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "@/contexts/router-context";

type ProtectedRouteProps = {
  children: ReactNode;
  redirectTo?: "/login" | "/search";
};

/**
 * ProtectedRoute component
 * Wraps content that requires authentication
 * Redirects to login page if user is not authenticated
 */
export function ProtectedRoute({ children, redirectTo = "/login" }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { navigate } = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(redirectTo);
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 dark:border-gray-100 mx-auto" />
          <div className="text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
}
