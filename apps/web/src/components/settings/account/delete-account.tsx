import { AlertCircle, Trash2 } from "lucide-react";
import { useState } from "react";
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
import { apiClient } from "@/lib/api-client";
import { bangManager } from "@/state/bang-manager";

export function DeleteAccount() {
  const { isAuthenticated, logout } = useAuth();
  const { navigate } = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated) {
    return null;
  }

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await apiClient.deleteAccount();
      bangManager.clearAllData();
      logout();
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="border-destructive/50 p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            <h3 className="text-lg font-semibold">Danger zone</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Permanently delete your account and all data stored in the cloud.
          </p>
          <Button onClick={() => setIsOpen(true)} variant="destructive">
            Delete account
          </Button>
        </div>
      </Card>

      <Dialog onOpenChange={setIsOpen} open={isOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account?</DialogTitle>
            <DialogDescription>
              This permanently deletes your account and all data, including your cloud settings. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button disabled={isDeleting} onClick={() => setIsOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button disabled={isDeleting} onClick={handleDelete} variant="destructive">
              {isDeleting ? "Deleting..." : "Permanently delete account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
