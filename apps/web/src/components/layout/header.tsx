import { Settings } from "lucide-react";
import { useRouter } from "@/contexts/router-context";
import { Button } from "../ui/button";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function Header() {
  const { navigate } = useRouter();

  return (
    <div className="w-full flex justify-between items-center p-4 sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="flex gap-4">
        <Button onClick={() => navigate("/")} variant="ghost">
          Home
        </Button>
      </div>
      <div className="flex gap-2 items-center">
        <UserMenu />
        <Button onClick={() => navigate("/settings")} size="icon" title="Settings" variant="outline">
          <Settings />
        </Button>
        <ThemeToggle />
      </div>
    </div>
  );
}
