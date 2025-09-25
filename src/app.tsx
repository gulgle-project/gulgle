import { SearchPage } from "./pages/search";
import { SettingsPage } from "./pages/settings";
import { Header } from "./components/layout/header";
import { Footer } from "./components/layout/footer";
import { ImprintPage } from "./pages/imprint";
import { Toaster } from "./components/ui/sonner";
import { useMemo } from "react";
import { RouterProvider, useRouter } from "./contexts/router-context";

export function App() {
  return (
    <RouterProvider>
      <AppContent />
    </RouterProvider>
  );
}

function AppContent() {
  const { currentPath } = useRouter();

  const page = useMemo(() => {
    if (currentPath === '/settings' || currentPath.endsWith('/settings')) {
      return <SettingsPage />;
    }

    if (currentPath === '/imprint' || currentPath.endsWith('/imprint')) {
      return <ImprintPage />;
    }

    // Default to search page for root, /search, or any query parameters
    return <SearchPage />;
  }, [currentPath]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-white-100 dark:bg-neutral-900">
      <Header />
      {page}
      <Footer />
      <Toaster />
    </div>
  )
}
