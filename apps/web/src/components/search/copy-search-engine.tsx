import { Clipboard, ClipboardCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function CopySearchEngine() {
  const [copied, setCopied] = useState(false);

  const currentOrigin = window.location.origin;
  const searchUrl = `${currentOrigin}?q=%s`;

  async function copy() {
    await navigator.clipboard.writeText(searchUrl);
    setCopied(true);
    toast.success("Copied to clipboard", { duration: 1800, id: "search-engine-url-copied" });
    setTimeout(() => setCopied(false), 1000);
  }

  return (
    <section
      aria-labelledby="search-engine-title"
      className="mt-10 w-full max-w-xl rounded-2xl border border-border/80 bg-muted/35 p-5 sm:p-6"
    >
      <div>
        <h2 className="text-sm font-semibold" id="search-engine-title">
          Make Gulgle your default
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Add this URL as a custom search engine in your browser.</p>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <input
          aria-label="Custom search engine URL"
          className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 font-mono text-xs outline-none transition-[border-color,box-shadow] focus:border-ring focus:ring-3 focus:ring-ring/20 sm:text-sm"
          onFocus={(event) => event.currentTarget.select()}
          readOnly
          type="text"
          value={searchUrl}
        />
        <button
          aria-label={copied ? "Copied" : "Copy search engine URL"}
          className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-background text-foreground transition-colors hover:bg-muted"
          onClick={copy}
          type="button"
        >
          {copied ? <ClipboardCheck className="size-4" /> : <Clipboard className="size-4" />}
        </button>
      </div>
    </section>
  );
}
