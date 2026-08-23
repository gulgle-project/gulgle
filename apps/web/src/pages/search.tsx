import { CopySearchEngine } from "@/components/search/copy-search-engine";
import { SearchBar } from "@/components/search/search-bar";
import { SearchStartPage } from "@/components/search/search-start-page";

export function SearchPage() {
  return <SearchStartPage defaultSetup={<CopySearchEngine />} search={<SearchBar />} />;
}
