import { Link } from "../ui/link";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function Header() {
  return (
    <div className="w-full flex justify-between items-center p-4 sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="flex gap-4">
        <Link to="/">Home</Link>
        <Link to="/settings">Settings</Link>
      </div>
      <div className="flex gap-2 items-center">
        <UserMenu />
        <ThemeToggle />
      </div>
    </div>
  );
}
