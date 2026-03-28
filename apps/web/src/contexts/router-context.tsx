import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

// Routes derived from pages folder structure
// Note: "/" maps to search.tsx (default page)
// Update this array when adding new pages to src/pages/
const ROUTES = ["/", "/search", "/settings", "/imprint", "/login", "/auth/success"] as const;

export type Route = (typeof ROUTES)[number];

export type Router = {
  currentPath: Route;
  queryParams: URLSearchParams;
  navigate: (path: Route, queryParams?: Record<string, string> | URLSearchParams) => void;
  goBack: () => void;
  replace: (path: Route, queryParams?: Record<string, string> | URLSearchParams) => void;
  updateQueryParams: (params: Record<string, string | null>) => void;
};

const RouterContext = createContext<Router | null>(null);

function isValidRoute(path: string): path is Route {
  return ROUTES.includes(path as Route);
}

// Extract the route from the URL hash (e.g. "#/settings" -> "/settings")
function getRouteFromHash(): Route {
  const hash = window.location.hash;
  let path = hash.startsWith("#") ? hash.slice(1) : "/";

  if (path.includes("?")) {
    path = path.substring(0, path.indexOf("?"));
  }

  return isValidRoute(path) ? path : "/";
}

// Extract query parameters from the URL hash
function getQueryParamsFromHash(): URLSearchParams {
  const hash = window.location.hash;
  const queryIndex = hash.indexOf("?");

  if (queryIndex === -1) {
    return new URLSearchParams();
  }

  const queryString = hash.slice(queryIndex + 1);
  return new URLSearchParams(queryString);
}

// Build hash URL with optional query parameters
function buildHashUrl(path: Route, queryParams?: Record<string, string> | URLSearchParams): string {
  let url = `#${path}`;

  if (queryParams) {
    const params = queryParams instanceof URLSearchParams ? queryParams : new URLSearchParams(queryParams);

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  return url;
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [currentPath, setCurrentPath] = useState<Route>(() => {
    if (typeof window !== "undefined") {
      return getRouteFromHash();
    }
    return "/";
  });

  const [queryParams, setQueryParams] = useState<URLSearchParams>(() => {
    if (typeof window !== "undefined") {
      return getQueryParamsFromHash();
    }
    return new URLSearchParams();
  });

  function navigate(path: Route, params?: Record<string, string> | URLSearchParams) {
    const url = buildHashUrl(path, params);
    window.history.pushState({}, "", url);
    setCurrentPath(path);
    setQueryParams(params instanceof URLSearchParams ? params : new URLSearchParams(params || {}));
  }

  function goBack() {
    window.history.back();
  }

  function replace(path: Route, params?: Record<string, string> | URLSearchParams) {
    const url = buildHashUrl(path, params);
    window.history.replaceState({}, "", url);
    setCurrentPath(path);
    setQueryParams(params instanceof URLSearchParams ? params : new URLSearchParams(params || {}));
  }

  function updateQueryParams(params: Record<string, string | null>) {
    const newParams = new URLSearchParams(queryParams);

    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });

    const url = buildHashUrl(currentPath, newParams);
    window.history.replaceState({}, "", url);
    setQueryParams(newParams);
  }

  useEffect(() => {
    setCurrentPath(getRouteFromHash());
    setQueryParams(getQueryParamsFromHash());

    const handleRouteChange = () => {
      setCurrentPath(getRouteFromHash());
      setQueryParams(getQueryParamsFromHash());
    };

    // hashchange fires when the URL hash changes, including browser back/forward navigation
    window.addEventListener("hashchange", handleRouteChange);

    return () => {
      window.removeEventListener("hashchange", handleRouteChange);
    };
  }, []);

  const router: Router = { currentPath, queryParams, goBack, navigate, replace, updateQueryParams };

  return <RouterContext.Provider value={router}>{children}</RouterContext.Provider>;
}

export function useRouter(): Router {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useRouter must be used within a RouterProvider");
  }
  return context;
}
