import { Store } from "./types";
import { parseCSVLine } from "./parse-csv";

/**
 * Merge store URLs from the master stores.csv directory into parsed Store objects.
 *
 * The stores.csv contains authoritative Uber Eats URLs for each store.
 * Matching is performed by extracting the URL slug (the path segment after /store/)
 * from both the parsed store data and the directory CSV, then replacing the
 * parsed store's URL with the directory's URL when slugs match.
 */
export function mergeStoreUrls(
  stores: Store[],
  storesCsvContent: string
): Store[] {
  const lines = storesCsvContent.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return stores;

  // Build a map of URL slug -> full URL from stores.csv
  const slugToUrl = new Map<string, string>();

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    // Find the column with the Uber Eats URL
    for (const field of fields) {
      const match = field.match(/ubereats\.com\/(?:za\/)?store\/([^/]+)/);
      if (match) {
        slugToUrl.set(match[1], field.trim());
        break;
      }
    }
  }

  // Match parsed stores to directory by extracting slug from their URLs
  return stores.map((store) => {
    const storeSlugMatch = store.uberEatsUrl.match(
      /ubereats\.com\/(?:za\/)?store\/([^/]+)/
    );
    if (storeSlugMatch) {
      const slug = storeSlugMatch[1];
      const fullUrl = slugToUrl.get(slug);
      if (fullUrl) {
        return { ...store, uberEatsUrl: fullUrl };
      }
    }
    return store;
  });
}
