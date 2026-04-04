import { Clipboard, ClipboardCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export function CopySearchEngine() {
  const [copied, setCopied] = useState(false);

  const currentOrigin = window.location.origin;
  const searchUrl = `${currentOrigin}?q=%s`;

  async function copy() {
    await navigator.clipboard.writeText(searchUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add as default search engine:</span>
      </div>
      <div className="flex h-14 items-center rounded-2xl border px-4 text-gray-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-sm transition-all duration-200 focus-within:border-gray-500 dark:border-white/45 dark:bg-white/[0.035] dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(255,255,255,0.04)] dark:focus-within:border-white/70 dark:focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_18px_rgba(255,255,255,0.08)]">
        <Input
          className="h-10 flex-1 border-none bg-transparent px-2 py-0 text-base font-medium text-gray-800 shadow-none focus:ring-0 focus-visible:border-none focus-visible:ring-0 dark:bg-transparent dark:text-white/90"
          readOnly
          type="text"
          value={searchUrl}
        />
        <Button
          className="ml-2 h-9 w-9 flex-shrink-0 rounded-full border border-gray-300 bg-transparent p-0 text-gray-700 transition-colors hover:bg-gray-200/70 hover:text-gray-900 dark:border-white/30 dark:text-white/80 dark:hover:bg-white/12 dark:hover:text-white"
          onClick={copy}
          size="sm"
          variant="ghost"
        >
          {copied ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
        </Button>
      </div>
      <div className="mt-2 h-5">
        {copied && <span className="text-sm text-emerald-600 dark:text-emerald-400">Copied to clipboard!</span>}
      </div>
    </div>
  );
}
