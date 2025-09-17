import { getAllBangs,getDefaultBangOrStore } from "./bang-manager";

function replaceUrlTemplate(template: string, query: string): string {
  if (template.includes("%s")) {
    template = template.replace("%s", encodeURIComponent(query).replace(/%2F/g, "/"));
  } else if (template.includes("{{{s}}}")) {
    template = template.replace("{{{s}}}", encodeURIComponent(query).replace(/%2F/g, "/"));
  }

  return template;
}

async function getBangRedirectUrl(): Promise<string | null> {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim() ?? "";
  
  if (!query) {
    return null;
  }

  const match = query.match(/!(\S+)/i);
  const bangCandidate = match?.[1]?.toLowerCase();

  if (!bangCandidate) {
    return replaceUrlTemplate(getDefaultBangOrStore().u, query);
  }
  
  // Check custom bangs first, then default bangs
  const allBangs = await getAllBangs();
  const selectedBang = allBangs.find((b) => b.t === bangCandidate);

  // If we have a bang candidate but no matching bang found, use default search with full query
  if (!selectedBang) {
    return replaceUrlTemplate(getDefaultBangOrStore().u, query);
  }

  // Remove the first bang from the query
  const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

  // Smart redirect logic: handle both direct URLs and search templates
  let searchUrl = selectedBang.u;
  
  // Check if the URL contains search placeholders
  const hasSearchPlaceholder = searchUrl.includes("%s") || searchUrl.includes("{{{s}}}");
  
  if (hasSearchPlaceholder) {
    // This is a search template URL
    if (cleanQuery === "") {
      // If no search term provided, go to the domain homepage
      return `https://${selectedBang.d}`;
    } else {
      // Replace the search placeholder with the actual query
      return replaceUrlTemplate(searchUrl, cleanQuery)
    }
  } else {
    // This is a direct URL (no search placeholder)
    // Always go to the exact URL regardless of whether there's a search term
    return searchUrl;
  }
}

export async function doRedirect(): Promise<boolean> {
  const searchUrl = await getBangRedirectUrl();
  
  if (!searchUrl) {
    return false;
  }

  window.location.replace(searchUrl);
  return true;
}