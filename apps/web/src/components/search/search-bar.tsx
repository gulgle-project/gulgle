import { Search, X } from "lucide-react";
import { useState } from "react";
import { doRedirect } from "@/utils/redirect.utils";

export function SearchBar() {
  const [query, setQuery] = useState("");

  async function onSearch(event: React.FormEvent) {
    event.preventDefault();
    doRedirect(query);
  }

  return (
    <form
      className="flex w-full items-center gap-2 rounded-2xl border border-input bg-card p-2 shadow-[0_16px_50px_-24px_oklch(0.25_0.08_285/0.35)] transition-[border-color,box-shadow] duration-200 focus-within:border-violet-500/65 focus-within:ring-3 focus-within:ring-violet-500/10 focus-within:shadow-[0_20px_60px_-24px_oklch(0.57_0.22_285/0.32)]"
      onSubmit={onSearch}
    >
      <Search aria-hidden="true" className="ml-3 size-5 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-1 items-center">
        <input
          aria-label="Search query"
          autoComplete="off"
          className="h-12 w-full min-w-0 border-0 bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground"
          name="search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search or type a bang, like !w..."
          type="text"
          value={query}
        />
        {query && (
          <button
            aria-label="Clear search"
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => setQuery("")}
            type="button"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <button
        className="flex h-12 cursor-pointer items-center rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition-[filter,opacity] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:px-6 dark:bg-violet-500"
        disabled={!query.trim()}
        type="submit"
      >
        Search
        <span aria-hidden="true" className="ml-1 hidden rounded-md bg-white/15 px-1.5 py-0.5 text-xs sm:inline">
          ↵
        </span>
      </button>
    </form>
  );
}
