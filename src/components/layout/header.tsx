import { Link } from "../ui/link";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <div className="w-full flex justify-between items-center p-4">
      <div className="flex gap-4">
        <Link to="/">Home</Link>
        <Link to="/settings">Settings</Link>
      </div>
      <ThemeToggle />
    </div>
  );
}
