import { Clipboard, ClipboardCheck, Search } from "lucide-react";
import { useState } from "react";
import { Page } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { doRedirect } from "@/utils/redirect.utils";

export function SearchPage() {
  const [copied, setCopied] = useState(false);
  const currentOrigin = window.location.origin;
  const searchUrl = `${currentOrigin}?q=%s`;

  async function copy() {
    await navigator.clipboard.writeText(searchUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  async function onSearch(event: React.FormEvent) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const input = form.elements.namedItem("search") as HTMLInputElement;
    doRedirect(input.value);
  }

  return (
    <Page centered>
      <h1 className="text-6xl md:text-7xl font-light mb-16 text-gray-800 dark:text-gray-100 select-none tracking-wide">
        Gulgle
      </h1>

      <form className="w-full max-w-xl mb-8" onSubmit={onSearch}>
        <div className="flex items-center h-14 border-2 border-neutral-200 dark:border-neutral-400 bg-transparent dark:bg-input/30 text-black dark:text-white px-4 focus-within:border-black dark:focus-within:border-white transition-colors duration-200 rounded-md">
          <Input
            className="flex-1 text-lg border-none bg-none dark:bg-none shadow-none focus:ring-0 p-2 h-8"
            name="search"
            placeholder="Search..."
            type="text"
          />
          <Button
            className="h-8 w-8 p-0 ml-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
            size="sm"
            type="submit"
            variant="ghost"
          >
            <Search />
          </Button>
        </div>
      </form>

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

      <div className="w-full max-w-xl">
        <div className="mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Add as default search engine:</span>
        </div>
        <div className="flex items-center h-14 border-2 border-neutral-200 dark:border-neutral-400 bg-transparent dark:bg-input/30 text-black dark:text-white px-4 focus-within:border-black dark:focus-within:border-white transition-colors duration-200 rounded-md">
          <Input
            className="flex-1 text-lg border-none bg-none dark:bg-none shadow-none focus:ring-0 p-2 h-8"
            readOnly
            type="text"
            value={searchUrl}
          />
          <Button
            className="h-8 w-8 p-0 ml-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
            onClick={copy}
            size="sm"
            variant="ghost"
          >
            {copied ? <ClipboardCheck /> : <Clipboard />}
          </Button>
        </div>
        <div className="mt-2 h-5">
          {copied && <span className="text-sm text-green-600 dark:text-green-400">Copied to clipboard!</span>}
        </div>
      </div>
    </Page>
  );
}
