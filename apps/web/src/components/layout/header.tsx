import { Settings } from "lucide-react";
import { useState } from "react";
import { GitHubIcon } from "@/assets/github-icon";
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
          <GitHubIcon />
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
