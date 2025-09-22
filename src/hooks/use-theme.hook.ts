import { useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Get theme from localStorage or default to system
    const stored = localStorage.getItem("theme") as Theme;
    return stored || "system";
  });

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove previous theme classes
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  const setAndStoreTheme = (newTheme: Theme) => {
    localStorage.setItem("theme", newTheme);
    setTheme(newTheme);
  };

  return {
    setTheme: setAndStoreTheme,
    theme,
  };
}
