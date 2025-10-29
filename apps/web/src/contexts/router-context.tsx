import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

// Routes derived from pages folder structure
// Note: "/" maps to search.tsx (default page)
// Update this array when adding new pages to src/pages/
const ROUTES = ["/", "/search", "/settings", "/imprint", "/login", "/auth/success"] as const;

export type Route = (typeof ROUTES)[number];

export type Router = {
  currentPath: Route;
  navigate: (path: Route) => void;
  goBack: () => void;
  replace: (path: Route) => void;
};

const RouterContext = createContext<Router | null>(null);

function isValidRoute(path: string): path is Route {
  return ROUTES.includes(path as Route);
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [currentPath, setCurrentPath] = useState<Route>(() => {
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      if (isValidRoute(pathname)) {
        return pathname;
      }
      return "/";
    }
    return "/";
  });

  function navigate(path: Route) {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
  }

  function goBack() {
    window.history.back();
  }

  function replace(path: Route) {
    window.history.replaceState({}, "", path);
    setCurrentPath(path);
  }

  useEffect(() => {
    const pathname = window.location.pathname;
    setCurrentPath(isValidRoute(pathname) ? pathname : "/");

    const handlePopState = () => {
      const pathname = window.location.pathname;
      setCurrentPath(isValidRoute(pathname) ? pathname : "/");
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const router: Router = { currentPath, goBack, navigate, replace };

  return <RouterContext.Provider value={router}>{children}</RouterContext.Provider>;
}

export function useRouter(): Router {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useRouter must be used within a RouterProvider");
  }
  return context;
}
