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
    switch (currentPath) {
      case '/':
      case '/search':
        return <SearchPage />;
      case '/settings':
        return <SettingsPage />;
      case '/imprint':
        return <ImprintPage />;
      default:
        const exhaustiveCheck: never = currentPath;
        return exhaustiveCheck;
    }
  }, [currentPath]);

  return (
    <div className="h-screen flex flex-col items-center bg-white-100 dark:bg-neutral-900 overflow-hidden">
      <Header />
      {page}
      <Footer />
      <Toaster />
    </div>
  )
}
