import { Store, MenuItem, Special } from "./types";

/**
 * Region classification keywords mapped to regions.
 * Order matters: more specific matches (KZN, Pretoria) checked before broader ones (Gauteng).
 */
const REGION_MAP: [string[], Store["region"]][] = [
  [
    [
      "KwaZulu",
      "KZN",
      "Umhlanga",
      "Ballito",
      "Durban",
      "Hillcrest",
      "Florida Road",
    ],
    "KZN",
  ],
  [["Pretoria", "Menlyn", "Brooklyn"], "Pretoria"],
  [
    [
      "Cape Town",
      "Western Cape",
      "Stellenbosch",
      "Paarl",
      "Foreshore",
      "Waterfront",
      "Century City",
      "Claremont",
      "Willowbridge",
      "Camps Bay",
      "Durbanville",
      "Paardevlei",
      "Blouberg",
      "Meadowridge",
      "Westlake",
      "Hans Strijdom",
      ", WC ",
      "Haasendal",
      "Old Biscuit Mill",
      "Belvedere",
      "Canal Walk",
      "Cavendish",
    ],
    "Western Cape",
  ],
  [
    [
      "Gauteng",
      "Johannesburg",
      "Sandton",
      "Rosebank",
      "Fourways",
      "Bedfordview",
      "Bryanston",
      "Greenside",
      "Parkhurst",
      "Melrose",
      "Lynnwood",
      "Dainfern",
      "Midrand",
      "Benmore",
      "Northcliff",
      "Montecasino",
    ],
    "Gauteng",
  ],
];

/**
 * Classify a store location string into one of four regions.
 * Falls back to "Gauteng" if no keyword match is found.
 */
export function classifyRegion(location: string): Store["region"] {
  const loc = location.toLowerCase();
  for (const [keywords, region] of REGION_MAP) {
    if (keywords.some((kw) => loc.includes(kw.toLowerCase()))) return region;
  }
  return "Gauteng";
}

/**
 * Strip emoji characters from a special/category name.
 * Handles Unicode emoji ranges including stars, fire, ships, etc.
 */
export function normalizeSpecialName(name: string): string {
  return name
    .replace(
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu,
      ""
    )
    .trim();
}

/**
 * Generate a URL-safe slug from a store name.
 * Removes apostrophes and ampersands, converts to lowercase,
 * replaces non-alphanumeric with hyphens.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/&/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Keywords that indicate a category is a promotional special rather than a regular menu category.
 */
const SPECIAL_CATEGORIES = [
  "hot this week",
  "weekly hot deal",
  "msc cruise",
  "summer",
  "special",
  "combo",
  "promotion",
  "giveaway",
  "win a",
];

/**
 * Determine if a category string represents a special/promotion.
 */
function isSpecialCategory(category: string): boolean {
  const lower = normalizeSpecialName(category).toLowerCase();
  return SPECIAL_CATEGORIES.some((sc) => lower.includes(sc));
}

/**
 * Parse a single CSV line respecting quoted fields (handles commas inside quotes).
 */
export function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        fields.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  fields.push(current);
  return fields;
}

/**
 * CSV column indices based on the extract-data.csv header:
 *   0: item_name
 *   1: item_name_citation
 *   2: category
 *   3: category_citation
 *   4: store_name
 *   5: store_name_citation (Uber Eats URL)
 *   6: store_location
 *   7: store_location_citation
 *   8: store_rating
 *   9: store_rating_citation
 *  10: store_review_count
 *  11: store_review_count_citation
 *  12: special_name
 *  13: special_name_citation
 *  14: special_description
 *  15: special_description_citation
 */
const COL = {
  ITEM_NAME: 0,
  ITEM_CITATION: 1,
  CATEGORY: 2,
  STORE_NAME: 4,
  STORE_URL: 5,
  LOCATION: 6,
  RATING: 8,
  REVIEW_COUNT: 10,
  SPECIAL_NAME: 12,
  SPECIAL_DESCRIPTION: 14,
} as const;

/**
 * Parse the extract-data CSV content into an array of Store objects.
 * Groups items by store, classifies regions, separates specials from regular menu items,
 * and deduplicates specials by normalized name.
 */
export function parseExtractCsv(csvContent: string): Store[] {
  const lines = csvContent.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const storeMap = new Map<string, Store>();

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < 10) continue;

    const storeName = fields[COL.STORE_NAME]?.trim();
    const location = fields[COL.LOCATION]?.trim() || "";
    const rating = parseFloat(fields[COL.RATING]) || 0;
    const reviewText = fields[COL.REVIEW_COUNT]?.trim() || "0";
    const reviewCount = parseInt(reviewText.replace(/[^0-9]/g, "")) || 0;
    const itemName = fields[COL.ITEM_NAME]?.trim();
    const category = fields[COL.CATEGORY]?.trim() || "";
    const citationUrl = fields[COL.ITEM_CITATION]?.trim() || "";
    const uberEatsUrl = fields[COL.STORE_URL]?.trim() || "";

    if (!storeName || !itemName) continue;

    if (!storeMap.has(storeName)) {
      storeMap.set(storeName, {
        name: storeName,
        location,
        region: classifyRegion(location),
        rating,
        reviewCount,
        uberEatsUrl,
        slug: generateSlug(storeName),
        items: [],
        specials: [],
      });
    }

    const store = storeMap.get(storeName)!;

    if (isSpecialCategory(category)) {
      const normalizedName = normalizeSpecialName(itemName);
      const alreadyExists = store.specials.some(
        (s) => normalizeSpecialName(s.name) === normalizedName
      );
      if (!alreadyExists) {
        store.specials.push({
          name: itemName,
          description: category,
          citationUrl,
        });
      }
    } else {
      store.items.push({
        name: itemName,
        category,
        citationUrl,
      });
    }
  }

  return Array.from(storeMap.values());
}
