import { AlertCircle, CheckCircle, Cloud, CloudDownload, CloudOff, CloudUpload, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "@/contexts/router-context";
import { useSettingsSync } from "@/hooks/use-settings-sync.hook";
import { bangManager } from "@/state/bang-manager";

export function SyncSettings() {
  const { isAuthenticated } = useAuth();
  const { navigate } = useRouter();
  const {
    status,
    error,
    lastSyncTime,
    serverSettings,
    syncToCloud,
    syncFromCloud,
    fullSync,
    resolveConflict,
    clearError,
  } = useSettingsSync();

  const handleSync = async () => {
    try {
      await fullSync();
    } catch (err) {
      console.error("Sync failed:", err);
    }
  };

  const handlePush = async () => {
    try {
      await syncToCloud();
    } catch (err) {
      console.error("Push failed:", err);
    }
  };

  const handlePull = async () => {
    try {
      await syncFromCloud();
    } catch (err) {
      console.error("Pull failed:", err);
    }
  };

  const handleResolveConflict = async (choice: "local" | "server") => {
    try {
      await resolveConflict(choice);
    } catch (err) {
      console.error("Resolve conflict failed:", err);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CloudOff className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold">Cloud Sync</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Sign in to sync your settings across devices</p>
          <Button onClick={() => navigate("/login")} variant="outline">
            Sign In to Enable Sync
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Cloud Sync</h3>
            </div>
            {status === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
            {status === "error" && <AlertCircle className="h-5 w-5 text-red-500" />}
            {status === "syncing" && <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />}
          </div>

          {lastSyncTime && (
            <p className="text-sm text-gray-600 dark:text-gray-400">Last synced: {lastSyncTime.toLocaleString()}</p>
          )}

          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  <Button
                    onClick={clearError}
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-auto p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSync} disabled={status === "syncing"} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${status === "syncing" ? "animate-spin" : ""}`} />
              Sync Now
            </Button>
            <Button onClick={handlePush} disabled={status === "syncing"} variant="outline" className="gap-2">
              <CloudUpload className="h-4 w-4" />
              Push to Cloud
            </Button>
            <Button onClick={handlePull} disabled={status === "syncing"} variant="outline" className="gap-2">
              <CloudDownload className="h-4 w-4" />
              Pull from Cloud
            </Button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Your custom bangs and default search engine will be synced across all your devices.
          </p>
        </div>
      </Card>

      {/* Conflict Resolution Dialog */}
      <Dialog open={status === "conflict"} onOpenChange={() => clearError()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sync Conflict Detected</DialogTitle>
            <DialogDescription>
              Your local settings differ from the cloud. Choose which version to keep.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium">Local Settings:</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Custom bangs: {bangManager.getCustomBangs().length}
              </p>
            </div>

            {serverSettings && (
              <div className="space-y-2">
                <h4 className="font-medium">Cloud Settings:</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Custom bangs: {serverSettings.customBangs.length}
                  <br />
                  Last modified: {new Date(serverSettings.lastModified).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleResolveConflict("server")}>
              Use Cloud Version
            </Button>
            <Button onClick={() => handleResolveConflict("local")}>Use Local Version</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
