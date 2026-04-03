import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  const nextTheme = {
    light: "dark",
    dark: "system",
    system: "light",
  } as const;

  const handleToggleTheme = () => {
    setTheme(nextTheme[theme]);
  };

  return (
    <Button onClick={handleToggleTheme} size="icon" title={`Theme: ${theme}`} variant="ghost">
      <Sun
        className="h-[1.2rem] w-[1.2rem] transition-all data-[theme=light]:scale-100 data-[theme=light]:rotate-0 data-[theme=dark]:scale-0 data-[theme=dark]:-rotate-90 data-[theme=system]:scale-0 data-[theme=system]:-rotate-90"
        data-theme={theme}
      />
      <Moon
        className="absolute h-[1.2rem] w-[1.2rem] transition-all data-[theme=dark]:scale-100 data-[theme=dark]:rotate-0 data-[theme=light]:scale-0 data-[theme=light]:rotate-90 data-[theme=system]:scale-0 data-[theme=system]:rotate-90"
        data-theme={theme}
      />
      <Monitor
        className="absolute h-[1.2rem] w-[1.2rem] transition-all data-[theme=system]:scale-100 data-[theme=system]:rotate-0 data-[theme=light]:scale-0 data-[theme=light]:rotate-90 data-[theme=dark]:scale-0 data-[theme=dark]:-rotate-90"
        data-theme={theme}
      />
      <span className="sr-only">Cycle theme (light, dark, system)</span>
    </Button>
  );
}
