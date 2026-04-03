import { Settings } from "lucide-react";
import { useState } from "react";
import { useRouter } from "@/contexts/router-context";
import { useMount } from "@/hooks/use-mount.hook";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function Header() {
  const { navigate } = useRouter();
  const [starCount, setStarCount] = useState<string | null>(null);

  useMount(() => {
    const controller = new AbortController();

    async function loadStarCount() {
      try {
        const response = await fetch("https://api.github.com/repos/gulgle-project/gulgle", {
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { stargazers_count?: number };
        if (typeof data.stargazers_count === "number") {
          setStarCount(new Intl.NumberFormat("en", { notation: "compact" }).format(data.stargazers_count));
        }
      } catch {
        // Ignore network errors and keep button usable without a count.
      }
    }

    loadStarCount();

    return () => {
      controller.abort();
    };
  });

  return (
    <div className="w-full flex justify-between items-center p-4 sticky top-0 z-10 bg-background/40 backdrop-blur-sm border-b border-border">
      <div className="flex gap-4">
        <Button onClick={() => navigate("/")} variant="ghost">
          Home
        </Button>
      </div>
      <div className="flex gap-2 items-center">
        <Button
          className="mr-1"
          onClick={() => open("https://github.com/gulgle-project/gulgle", "_blank", "noreferrer")}
          variant="outline"
        >
          <svg aria-hidden="true" className="size-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12a12.01 12.01 0 0 0 8.2 11.39c.6.11.82-.26.82-.58v-2.23c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.74.08-.74 1.2.08 1.84 1.23 1.84 1.23 1.08 1.83 2.82 1.3 3.5.99.11-.78.42-1.3.77-1.6-2.67-.3-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.16 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.65 1.64.24 2.86.12 3.16.76.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.62-5.48 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.22.69.82.58A12 12 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span className="hidden sm:inline">Star</span>
          <Separator className="mx-1" orientation="vertical" />
          {starCount ? <span className="hidden md:inline text-muted-foreground">{starCount}</span> : null}
        </Button>

        <Separator orientation="vertical" />

        <ThemeToggle />

        <Separator orientation="vertical" />

        <UserMenu />
        <Button onClick={() => navigate("/settings")} size="icon" title="Settings" variant="ghost">
          <Settings />
        </Button>
      </div>
    </div>
  );
}
