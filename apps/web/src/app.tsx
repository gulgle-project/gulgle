import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import { Header } from "./components/layout/header";
import { ThemeProvider } from "./components/layout/theme-provider";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./contexts/auth-context";
import { AuthCallbackPage } from "./pages/auth-callback";
import { ImprintPage } from "./pages/imprint";
import { LoginPage } from "./pages/login";
import { SearchPage } from "./pages/search";
import { SettingsPage } from "./pages/settings";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppContent />}>
            <Route element={<SearchPage />} index />
            <Route element={<Navigate replace to="/" />} path="/search" />
            <Route element={<SettingsPage />} path="/settings" />
            <Route element={<ImprintPage />} path="/imprint" />
            <Route element={<LoginPage />} path="/login" />
            <Route element={<AuthCallbackPage />} path="/auth/success" />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function AppContent() {
  return (
    <ThemeProvider>
      <div className="h-dvh flex flex-col items-center bg-white-100 dark:bg-neutral-900 custom-scrollbar overflow-x-hidden overflow-y-auto">
        <Header />
        <Outlet />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
