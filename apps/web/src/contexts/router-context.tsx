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

// Extract the route from the URL hash (e.g. "#/settings" -> "/settings")
function getRouteFromHash(): Route {
  const hash = window.location.hash;
  const path = hash.startsWith("#") ? hash.slice(1) : "/";
  return isValidRoute(path) ? path : "/";
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [currentPath, setCurrentPath] = useState<Route>(() => {
    if (typeof window !== "undefined") {
      return getRouteFromHash();
    }
    return "/";
  });

  function navigate(path: Route) {
    window.history.pushState({}, "", `#${path}`);
    setCurrentPath(path);
  }

  function goBack() {
    window.history.back();
  }

  function replace(path: Route) {
    window.history.replaceState({}, "", `#${path}`);
    setCurrentPath(path);
  }

  useEffect(() => {
    setCurrentPath(getRouteFromHash());

    const handleRouteChange = () => {
      setCurrentPath(getRouteFromHash());
    };

    // hashchange fires when the URL hash changes, including browser back/forward navigation
    window.addEventListener("hashchange", handleRouteChange);

    return () => {
      window.removeEventListener("hashchange", handleRouteChange);
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
