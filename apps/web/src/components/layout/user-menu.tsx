import { LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "@/contexts/router-context";

export function UserMenu() {
  const { user, isAuthenticated, logout } = useAuth();
  const { navigate } = useRouter();

  const handleLogout = () => {
    logout();
    navigate("/search");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  if (!isAuthenticated || !user) {
    return (
      <Button variant="outline" size="sm" onClick={handleLogin}>
        Sign In
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{user.email}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Signed in as</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <Button variant="outline" size="sm" onClick={handleLogout} className="w-full gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
