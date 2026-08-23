import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SearchForm } from "@/components/search/search-form";
import { SearchStartPage } from "@/components/search/search-start-page";
import "./index.css";

const GULGLE_SEARCH_URL = "https://www.gulgle.link?q=";

function search(query: string) {
  window.location.assign(`${GULGLE_SEARCH_URL}${encodeURIComponent(query)}`);
}

function ExtensionStartPage() {
  return (
    <ThemeProvider>
      <div className="custom-scrollbar flex h-dvh flex-col items-center overflow-x-hidden overflow-y-auto bg-background">
        <SearchStartPage centerOnShortViewports search={<SearchForm onSearch={search} />} />
      </div>
    </ThemeProvider>
  );
}

const container = document.querySelector("#root");

if (!container) {
  throw new Error("App container not found");
}

createRoot(container).render(
  <StrictMode>
    <ExtensionStartPage />
  </StrictMode>,
);
