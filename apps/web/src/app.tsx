import { SearchPage } from "./pages/search";
import { SettingsPage } from "./pages/settings";
import { Header } from "./components/layout/header";
import { Footer } from "./components/layout/footer";
import { ImprintPage } from "./pages/imprint";
import { LoginPage } from "./pages/login";
import { AuthCallbackPage } from "./pages/auth-callback";
import { Toaster } from "./components/ui/sonner";
import { useMemo } from "react";
import { RouterProvider, useRouter } from "./contexts/router-context";
import { AuthProvider } from "./contexts/auth-context";

export function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </AuthProvider>
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
      case '/login':
        return <LoginPage />;
      case '/auth/success':
        return <AuthCallbackPage />;
      default:
        const exhaustiveCheck: never = currentPath;
        return exhaustiveCheck;
    }
  }, [currentPath]);

  return (
    <div className="h-dvh flex flex-col items-center bg-white-100 dark:bg-neutral-900 custom-scrollbar overflow-x-hidden overflow-y-auto">
      <Header />
      {page}
      <Footer />
      <Toaster />
    </div>
  )
}
