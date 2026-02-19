import { describe, it, expect } from "vitest";
import { mergeStoreUrls } from "../merge-store-urls";
import { Store } from "../types";

function makeStore(overrides: Partial<Store> = {}): Store {
  return {
    name: "Test Store",
    location: "Test Location",
    region: "Gauteng",
    rating: 4.0,
    reviewCount: 100,
    uberEatsUrl: "https://www.ubereats.com/za/store/colcacchio-test/abc123",
    slug: "test-store",
    items: [],
    specials: [],
    ...overrides,
  };
}

describe("mergeStoreUrls", () => {
  it("updates store URL when slug matches between CSVs", () => {
    const stores: Store[] = [
      makeStore({
        name: "Col'Cacchio GO Dainfern",
        uberEatsUrl:
          "https://www.ubereats.com/za/store/colcacchio-go-dainfern/oVpo3Z9cSx-Di-_4XestLg",
      }),
    ];

    const storesCsv = [
      "Store Name,Uber Eats url",
      "Col'Cacchio - DAINFERN SQUARE,https://www.ubereats.com/za/store/colcacchio-go-dainfern/oVpo3Z9cSx-Di-_4XestLg",
    ].join("\n");

    const result = mergeStoreUrls(stores, storesCsv);
    expect(result[0].uberEatsUrl).toBe(
      "https://www.ubereats.com/za/store/colcacchio-go-dainfern/oVpo3Z9cSx-Di-_4XestLg"
    );
  });

  it("keeps original URL when no slug match is found", () => {
    const originalUrl =
      "https://www.ubereats.com/za/store/colcacchio-unknown/xyz789";
    const stores: Store[] = [
      makeStore({
        name: "Col'Cacchio Unknown",
        uberEatsUrl: originalUrl,
      }),
    ];

    const storesCsv = [
      "Store Name,Uber Eats url",
      "Col'Cacchio - Waterfall,https://www.ubereats.com/za/store/colcacchio-go-waterfall/xZURGPcfS6qBmWNfPbuvgQ",
    ].join("\n");

    const result = mergeStoreUrls(stores, storesCsv);
    expect(result[0].uberEatsUrl).toBe(originalUrl);
  });

  it("handles stores.csv with quoted fields containing commas", () => {
    const stores: Store[] = [
      makeStore({
        name: "Col'Cacchio Brooklyn",
        uberEatsUrl:
          "https://www.ubereats.com/za/store/colcacchio-brooklyn/f_h2d3VPU1KtD2CgkSo4wg",
      }),
    ];

    const storesCsv = [
      "Store Name,Uber Eats url",
      '"Col\'Cacchio, Brooklyn",https://www.ubereats.com/za/store/colcacchio-brooklyn/f_h2d3VPU1KtD2CgkSo4wg',
    ].join("\n");

    const result = mergeStoreUrls(stores, storesCsv);
    expect(result[0].uberEatsUrl).toBe(
      "https://www.ubereats.com/za/store/colcacchio-brooklyn/f_h2d3VPU1KtD2CgkSo4wg"
    );
  });

  it("matches multiple stores correctly from a multi-line stores.csv", () => {
    const stores: Store[] = [
      makeStore({
        name: "Col'Cacchio GO Dainfern",
        uberEatsUrl:
          "https://www.ubereats.com/za/store/colcacchio-go-dainfern/oVpo3Z9cSx-Di-_4XestLg",
      }),
      makeStore({
        name: "Col'Cacchio Foreshore",
        uberEatsUrl:
          "https://www.ubereats.com/za/store/colcacchio-foreshore/QL1PW9InT-enavj08xZb0Q",
      }),
      makeStore({
        name: "Col'Cacchio NoMatch",
        uberEatsUrl:
          "https://www.ubereats.com/za/store/colcacchio-nomatch/zzzzzz",
      }),
    ];

    const storesCsv = [
      "Store Name,Uber Eats url",
      "Col'Cacchio - DAINFERN SQUARE,https://www.ubereats.com/za/store/colcacchio-go-dainfern/oVpo3Z9cSx-Di-_4XestLg",
      '"Col\'Cacchio, Foreshore",https://www.ubereats.com/za/store/colcacchio-foreshore/QL1PW9InT-enavj08xZb0Q',
    ].join("\n");

    const result = mergeStoreUrls(stores, storesCsv);

    expect(result[0].uberEatsUrl).toBe(
      "https://www.ubereats.com/za/store/colcacchio-go-dainfern/oVpo3Z9cSx-Di-_4XestLg"
    );
    expect(result[1].uberEatsUrl).toBe(
      "https://www.ubereats.com/za/store/colcacchio-foreshore/QL1PW9InT-enavj08xZb0Q"
    );
    // No match - keeps original
    expect(result[2].uberEatsUrl).toBe(
      "https://www.ubereats.com/za/store/colcacchio-nomatch/zzzzzz"
    );
  });

  it("returns stores unchanged when storesCsv has no data rows", () => {
    const stores: Store[] = [makeStore()];
    const storesCsv = "Store Name,Uber Eats url\n";

    const result = mergeStoreUrls(stores, storesCsv);
    expect(result).toEqual(stores);
  });

  it("returns stores unchanged when storesCsv is empty", () => {
    const stores: Store[] = [makeStore()];
    const result = mergeStoreUrls(stores, "");
    expect(result).toEqual(stores);
  });

  it("does not mutate original store objects", () => {
    const original: Store = makeStore({
      name: "Col'Cacchio GO Dainfern",
      uberEatsUrl:
        "https://www.ubereats.com/za/store/colcacchio-go-dainfern/old-hash",
    });
    const stores: Store[] = [original];

    const storesCsv = [
      "Store Name,Uber Eats url",
      "Col'Cacchio - DAINFERN SQUARE,https://www.ubereats.com/za/store/colcacchio-go-dainfern/oVpo3Z9cSx-Di-_4XestLg",
    ].join("\n");

    const result = mergeStoreUrls(stores, storesCsv);

    // Original should be untouched
    expect(original.uberEatsUrl).toBe(
      "https://www.ubereats.com/za/store/colcacchio-go-dainfern/old-hash"
    );
    // Result should have the new URL
    expect(result[0].uberEatsUrl).toBe(
      "https://www.ubereats.com/za/store/colcacchio-go-dainfern/oVpo3Z9cSx-Di-_4XestLg"
    );
  });
});
