import { useEffect } from "react";
import { useNavigate } from "react-router";
import { GitHubIcon } from "@/assets/github-icon";
import { Page } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api-client";

export function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/settings");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleGithubLogin = () => {
    apiClient.initiateGithubLogin();
  };

  if (isLoading) {
    return (
      <Page>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Sign In</h1>
              <p className="text-gray-600 dark:text-gray-400">Sign in to sync your settings across devices</p>
            </div>

            <div className="space-y-4">
              <Button className="w-full" onClick={handleGithubLogin} size="lg">
                <GitHubIcon />
                Continue with GitHub
              </Button>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>
                Signing in shares your GitHub account ID, name, and available profile email with Gulgle and syncs your
                custom bangs and default search engine. See our{" "}
                <a className="font-medium text-foreground underline underline-offset-4" href="/privacy/">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Page>
  );
}
