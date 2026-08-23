import { ExternalLink } from "lucide-react";
import { Page } from "@/components/layout/page";
import { CopySearchEngine } from "@/components/search/copy-search-engine";
import { SearchBar } from "@/components/search/search-bar";

export function SearchPage() {
  return (
    <Page centered>
      <main className="relative flex w-full flex-col items-center py-12 [@media(max-height:760px)]:py-10">
        <div className="mb-9 text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-violet-600 uppercase dark:text-violet-400">
            One search, thousands of shortcuts
          </p>
          <h1 className="select-none text-6xl font-semibold tracking-[-0.065em] sm:text-7xl">Gulgle</h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">Search the web faster with bangs built in.</p>
        </div>

        <SearchBar />

        <p className="mt-4 text-sm text-muted-foreground">
          Includes all of&nbsp;
          <a
            className="inline-flex items-center gap-1 font-medium text-violet-600 underline decoration-current/35 underline-offset-4 transition-colors hover:decoration-current dark:text-violet-400"
            href="https://kbe.smaertness.net/"
            rel="noopener noreferrer"
            target="_blank"
          >
            Kagi's bangs
            <ExternalLink aria-hidden="true" className="size-3.5" />
          </a>
        </p>

        <CopySearchEngine />
      </main>
    </Page>
  );
}
