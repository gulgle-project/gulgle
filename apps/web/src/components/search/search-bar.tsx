import { doRedirect } from "@/utils/redirect.utils";
import { SearchForm } from "./search-form";

export function SearchBar() {
  return <SearchForm onSearch={doRedirect} />;
}
