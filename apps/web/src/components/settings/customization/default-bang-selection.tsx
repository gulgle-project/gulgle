import type { Bang } from "gulgle-shared";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { useBangManager } from "@/hooks/use-bang-manager.hook";
import { cn } from "@/lib/utils";
import { score } from "@/utils/search.utils";

const WINDOW_SIZE = 100;

export function DefaultBangSelection() {
  const { defaultBang, customBangs, setDefaultBang, getAllBangs } = useBangManager();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [bangs, setBangs] = useState<Array<Bang>>([]);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [visibleCount, setVisibleCount] = useState(WINDOW_SIZE);

  // biome-ignore lint/correctness/useExhaustiveDependencies: workaround because of non-react state
  useEffect(() => {
    async function fetchBangs() {
      try {
        const allBangs = await getAllBangs();
        setBangs(allBangs);
      } catch (_error) {}
    }
    fetchBangs();
  }, [customBangs]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current) {
        return;
      }

      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Filter and sort bangs based on search input
  const filteredBangs = useMemo(
    () =>
      bangs
        .filter((bang) => {
          if (!searchValue) {
            return true;
          }

          const lowerSearch = searchValue.toLowerCase();
          // Clean value for filtering by trigger (remove ! prefix)
          const cleanLowerSearch = lowerSearch.replace(/^!/, "");

          return (
            bang.t.toLowerCase().includes(cleanLowerSearch) ||
            bang.s.toLowerCase().includes(lowerSearch) ||
            bang.ts?.some((trigger) => trigger.toLowerCase().includes(cleanLowerSearch))
          );
        })
        .sort((a, b) => {
          if (!searchValue) {
            return a.t.localeCompare(b.t);
          }

          return score(a, searchValue) - score(b, searchValue);
        }),
    [bangs, searchValue],
  );

  const visibleBangs = useMemo(() => filteredBangs.slice(0, visibleCount), [filteredBangs, visibleCount]);

  function onOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    setVisibleCount(WINDOW_SIZE);
  }

  function onSearchValueChange(value: string) {
    setSearchValue(value);
    setVisibleCount(WINDOW_SIZE);
  }

  function onListScroll(event: React.UIEvent<HTMLDivElement>) {
    const element = event.currentTarget;
    const remainingScroll = element.scrollHeight - element.scrollTop - element.clientHeight;

    if (remainingScroll < 80) {
      setVisibleCount((current) => Math.min(current + WINDOW_SIZE, filteredBangs.length));
    }
  }

  return (
    <section className="rounded-xl bg-card p-6 text-card-foreground shadow-xs ring-1 ring-foreground/10">
      <div className="space-y-3">
        <div>
          <Label className="text-lg font-semibold" htmlFor="default-engine">
            Default Search Engine
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Choose the search engine to use when no bang is specified
          </p>
        </div>

        <div className="relative" ref={containerRef}>
          <Button
            aria-expanded={open}
            aria-haspopup="listbox"
            className="w-full justify-between"
            id="default-engine"
            onClick={() => onOpenChange(!open)}
            role="combobox"
            variant="outline"
          >
            {defaultBang ? `!${defaultBang.t} - ${defaultBang.s}` : "Select default search engine"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>

          {open && (
            <div className="absolute top-full z-50 mt-1 w-full animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150">
              <div className="overflow-hidden rounded-md bg-popover p-0 text-popover-foreground shadow-md ring-1 ring-foreground/10">
                <Command>
                  <CommandInput
                    autoFocus
                    onValueChange={onSearchValueChange}
                    placeholder="Search search engines..."
                    value={searchValue}
                  />
                  <CommandList onScroll={onListScroll}>
                    <CommandEmpty>No search engine found.</CommandEmpty>
                    <CommandGroup>
                      {visibleBangs.map((bang) => (
                        <CommandItem
                          key={bang.t}
                          onSelect={() => {
                            setDefaultBang(bang);
                            setOpen(false);
                          }}
                          value={`!${bang.t} ${bang.s} ${bang.ts?.join(" ") || ""}`}
                        >
                          <Check
                            className={cn("mr-2 h-4 w-4", defaultBang?.t === bang.t ? "opacity-100" : "opacity-0")}
                          />
                          !{bang.t} - {bang.s} {bang.ts?.length && `[${bang.ts?.join(", ")}]`}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
