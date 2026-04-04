import { Search, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { doRedirect } from "@/utils/redirect.utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export function SearchBar() {
  const [query, setQuery] = useState("");

  async function onSearch(event: React.FormEvent) {
    event.preventDefault();
    doRedirect(query);
  }

  return (
    <form className="mb-8 w-full max-w-3xl" onSubmit={onSearch}>
      <div className="relative">
        <Input
          aria-label="Search query"
          className="h-12 rounded-full border-2 border-input bg-muted px-10 text-4xl text-foreground placeholder:text-muted-foreground focus-visible:border-accent-foreground focus-visible:ring-1 focus-visible:ring-border"
          name="search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="What are you looking for?"
          type="text"
          value={query}
        />

        <div className="absolute inset-y-0 right-4 flex items-center">
          {query && (
            <Button
              aria-label="Clear search"
              className="rounded-full text-muted-foreground"
              onClick={() => setQuery("")}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X />
            </Button>
          )}

          <Button
            aria-label="Search"
            className={cn("rounded-full", query ? "text-primary-foreground" : "text-muted-foreground")}
            size="icon"
            type="submit"
            variant={query ? "default" : "ghost"}
          >
            <Search />
          </Button>
        </div>
      </div>
    </form>
  );
}
