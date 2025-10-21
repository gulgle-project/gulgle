// Initialize theme immediately to prevent flash
function initializeTheme() {
  const stored = localStorage.getItem("theme") as "dark" | "light" | "system" | null;
  const theme = stored || "system";

  const root = document.documentElement;
  root.classList.remove("light", "dark");

  if (theme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }
}

// Initialize immediately
initializeTheme();

export { initializeTheme };
