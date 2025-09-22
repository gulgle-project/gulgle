import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

export type Router = {
  currentPath: string;
  navigate: (path: string) => void;
  goBack: () => void;
  replace: (path: string) => void;
};

const RouterContext = createContext<Router | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname;
    }
    return "/";
  });

  function navigate(path: string) {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
  }

  function goBack() {
    window.history.back();
  }

  function replace(path: string) {
    window.history.replaceState({}, "", path);
    setCurrentPath(path);
  }

  useEffect(() => {
    setCurrentPath(window.location.pathname);

    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
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
