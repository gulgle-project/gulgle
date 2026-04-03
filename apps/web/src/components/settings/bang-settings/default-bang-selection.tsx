import type { Bang } from "gulgle-shared";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useBangManager } from "@/hooks/use-bang-manager.hook";
import { cn } from "@/lib/utils";
import { score } from "@/utils/search.utils";

export function DefaultBangSelection() {
  const { defaultBang, customBangs, setDefaultBang, getAllBangs } = useBangManager();

  const [bangs, setBangs] = useState<Array<Bang>>([]);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

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

  // Filter and sort bangs based on search input
  const filteredBangs = bangs
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
    })
    .slice(0, 20);

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

        <Popover onOpenChange={setOpen} open={open}>
          <PopoverTrigger>
            <Button
              aria-expanded={open}
              className="w-full justify-between"
              id="default-engine"
              role="combobox"
              variant="outline"
            >
              {defaultBang ? `!${defaultBang.t} - ${defaultBang.s}` : "Select default search engine"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
            <Command>
              <CommandInput onValueChange={setSearchValue} placeholder="Search search engines..." value={searchValue} />
              <CommandList>
                <CommandEmpty>No search engine found.</CommandEmpty>
                <CommandGroup>
                  {filteredBangs.map((bang) => (
                    <CommandItem
                      key={bang.t}
                      onSelect={() => {
                        setDefaultBang(bang);
                        setOpen(false);
                      }}
                      value={`!${bang.t} ${bang.s} ${bang.ts?.join(" ") || ""}`}
                    >
                      <Check className={cn("mr-2 h-4 w-4", defaultBang?.t === bang.t ? "opacity-100" : "opacity-0")} />!
                      {bang.t} - {bang.s} {bang.ts?.length && `[${bang.ts?.join(", ")}]`}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </section>
  );
}
