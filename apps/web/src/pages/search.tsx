import { Page } from "@/components/layout/page";
import { CopySearchEngine } from "@/components/search/copy-search-engine";
import { SearchBar } from "@/components/search/search-bar";

export function SearchPage() {
  return (
    <Page centered>
      <h1 className="mb-16 select-none text-8xl">Gulgle</h1>

      <SearchBar />

      <div className="w-full max-w-xl mb-8 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Gulgle includes all of&nbsp;
          <a
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline text-sm transition-colors"
            href="https://kbe.smaertness.net/"
            rel="noopener noreferrer"
            target="_blank"
          >
            Kagi's bangs
          </a>
        </p>
      </div>

      <CopySearchEngine />
    </Page>
  );
}
