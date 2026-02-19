import { describe, it, expect } from "vitest";
import {
  classifyRegion,
  normalizeSpecialName,
  generateSlug,
  parseExtractCsv,
} from "../parse-csv";

describe("classifyRegion", () => {
  it('classifies "Sandton, Gauteng" as Gauteng', () => {
    expect(classifyRegion("Sandton, Gauteng")).toBe("Gauteng");
  });

  it('classifies "Cape Town, Western Cape" as Western Cape', () => {
    expect(classifyRegion("Cape Town, Western Cape")).toBe("Western Cape");
  });

  it('classifies "Umhlanga, KZN" as KZN', () => {
    expect(classifyRegion("Umhlanga, KZN")).toBe("KZN");
  });

  it('classifies "Menlyn, Pretoria" as Pretoria', () => {
    expect(classifyRegion("Menlyn, Pretoria")).toBe("Pretoria");
  });

  it("defaults to Gauteng for unknown locations", () => {
    expect(classifyRegion("Unknown Place")).toBe("Gauteng");
  });
});

describe("normalizeSpecialName", () => {
  it("strips emoji decorations from special names", () => {
    expect(normalizeSpecialName("🔥 Weekly HOT Deal 🔥")).toBe(
      "Weekly HOT Deal"
    );
  });

  it("strips trailing emoji from special names", () => {
    expect(normalizeSpecialName("MSC Cruise 🚢")).toBe("MSC Cruise");
  });

  it("leaves names without emojis unchanged", () => {
    expect(normalizeSpecialName("No Emojis Here")).toBe("No Emojis Here");
  });

  it("strips star emojis from real data patterns", () => {
    expect(normalizeSpecialName("🌟WIN A MSC CRUISE🌟")).toBe(
      "WIN A MSC CRUISE"
    );
  });

  it("strips star emojis from HOT THIS WEEK pattern", () => {
    expect(normalizeSpecialName("🌟 HOT THIS WEEK 🌟")).toBe(
      "HOT THIS WEEK"
    );
  });
});

describe("generateSlug", () => {
  it("generates slug for Col'Cacchio Foreshore", () => {
    expect(generateSlug("Col'Cacchio Foreshore")).toBe(
      "colcacchio-foreshore"
    );
  });

  it("generates slug for Col'Cacchio V&A Waterfront", () => {
    expect(generateSlug("Col'Cacchio V&A Waterfront")).toBe(
      "colcacchio-va-waterfront"
    );
  });

  it("generates slug for store name with comma", () => {
    expect(generateSlug("Col'Cacchio GO, Waterfall")).toBe(
      "colcacchio-go-waterfall"
    );
  });
});

describe("parseExtractCsv", () => {
  const HEADER =
    "item_name,item_name_citation,category,category_citation,store_name,store_name_citation,store_location,store_location_citation,store_rating,store_rating_citation,store_review_count,store_review_count_citation,special_name,special_name_citation,special_description,special_description_citation";

  it("parses minimal CSV with header + 2 rows into Store[] with correct fields", () => {
    const csv = [
      HEADER,
      'Margherita Pizza,https://example.com/cite,Wood-Fired Pizza,https://example.com/cat,Col\'Cacchio Foreshore,https://example.com/store,"123 Main Rd, Cape Town, Western Cape",https://example.com/loc,4.5,https://example.com/rate,2000,https://example.com/rev,,,,',
      'Pepperoni Pizza,https://example.com/cite2,Wood-Fired Pizza,https://example.com/cat2,Col\'Cacchio Foreshore,https://example.com/store,"123 Main Rd, Cape Town, Western Cape",https://example.com/loc,4.5,https://example.com/rate,2000,https://example.com/rev,,,,',
    ].join("\n");

    const stores = parseExtractCsv(csv);
    expect(stores).toHaveLength(1);

    const store = stores[0];
    expect(store.name).toBe("Col'Cacchio Foreshore");
    expect(store.location).toBe("123 Main Rd, Cape Town, Western Cape");
    expect(store.region).toBe("Western Cape");
    expect(store.rating).toBe(4.5);
    expect(store.reviewCount).toBe(2000);
    expect(store.slug).toBe("colcacchio-foreshore");
    expect(store.items).toHaveLength(2);
    expect(store.items[0].name).toBe("Margherita Pizza");
    expect(store.items[0].category).toBe("Wood-Fired Pizza");
    expect(store.items[1].name).toBe("Pepperoni Pizza");
  });

  it("classifies special categories as specials not regular menu items", () => {
    const csv = [
      HEADER,
      'Margherita Pizza,https://example.com/cite,Wood-Fired Pizza,https://example.com/cat,Test Store,https://example.com/store,"Sandton, Gauteng",https://example.com/loc,4.0,https://example.com/rate,1000,https://example.com/rev,,,,',
      'Special Pizza,https://example.com/cite2,\u{1F31F}WIN A MSC CRUISE\u{1F31F},https://example.com/cat2,Test Store,https://example.com/store,"Sandton, Gauteng",https://example.com/loc,4.0,https://example.com/rate,1000,https://example.com/rev,\u{1F31F}WIN A MSC CRUISE\u{1F31F},https://example.com/cite3,Win a cruise!,https://example.com/desc',
    ].join("\n");

    const stores = parseExtractCsv(csv);
    expect(stores).toHaveLength(1);

    const store = stores[0];
    expect(store.items).toHaveLength(1);
    expect(store.items[0].name).toBe("Margherita Pizza");
    expect(store.specials).toHaveLength(1);
    expect(store.specials[0].name).toBe("Special Pizza");
  });

  it("deduplicates specials: same special after normalization only appears once per store", () => {
    const csv = [
      HEADER,
      'Special Pizza A,https://example.com/cite1,\u{1F31F}WIN A MSC CRUISE\u{1F31F},https://example.com/cat,Test Store,https://example.com/store,"Sandton, Gauteng",https://example.com/loc,4.0,https://example.com/rate,1000,https://example.com/rev,\u{1F31F}WIN A MSC CRUISE\u{1F31F},https://example.com/sn,Win a cruise!,https://example.com/sd',
      'Special Pizza A,https://example.com/cite2,\u{1F31F}WIN A MSC CRUISE\u{1F31F},https://example.com/cat,Test Store,https://example.com/store,"Sandton, Gauteng",https://example.com/loc,4.0,https://example.com/rate,1000,https://example.com/rev,\u{1F31F}WIN A MSC CRUISE\u{1F31F},https://example.com/sn,Win a cruise!,https://example.com/sd',
      'Special Pizza B,https://example.com/cite3,\u{1F31F}WIN A MSC CRUISE\u{1F31F},https://example.com/cat,Test Store,https://example.com/store,"Sandton, Gauteng",https://example.com/loc,4.0,https://example.com/rate,1000,https://example.com/rev,\u{1F31F}WIN A MSC CRUISE\u{1F31F},https://example.com/sn,Win a cruise!,https://example.com/sd',
    ].join("\n");

    const stores = parseExtractCsv(csv);
    expect(stores).toHaveLength(1);

    const store = stores[0];
    // "Special Pizza A" appears twice but should be deduplicated to 1
    // "Special Pizza B" is different, so it should appear as a second special
    expect(store.specials).toHaveLength(2);
    expect(store.specials[0].name).toBe("Special Pizza A");
    expect(store.specials[1].name).toBe("Special Pizza B");
  });

  it("returns empty array for empty CSV", () => {
    expect(parseExtractCsv("")).toEqual([]);
    expect(parseExtractCsv(HEADER)).toEqual([]);
  });

  it("handles multiple stores from the same CSV", () => {
    const csv = [
      HEADER,
      'Pizza A,https://example.com/cite,Pizza,https://example.com/cat,Store One,https://example.com/s1,"Cape Town, Western Cape",https://example.com/loc,4.2,https://example.com/rate,500,https://example.com/rev,,,,',
      'Pizza B,https://example.com/cite,Pasta,https://example.com/cat,Store Two,https://example.com/s2,"Sandton, Gauteng",https://example.com/loc,4.8,https://example.com/rate,3000,https://example.com/rev,,,,',
    ].join("\n");

    const stores = parseExtractCsv(csv);
    expect(stores).toHaveLength(2);
    expect(stores[0].name).toBe("Store One");
    expect(stores[0].region).toBe("Western Cape");
    expect(stores[1].name).toBe("Store Two");
    expect(stores[1].region).toBe("Gauteng");
  });
});
