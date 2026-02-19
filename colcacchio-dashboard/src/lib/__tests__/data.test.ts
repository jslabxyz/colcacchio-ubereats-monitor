import { describe, it, expect } from "vitest";
import { getOverviewStats } from "../data";
import { Store } from "../types";

function makeStore(overrides: Partial<Store> = {}): Store {
  return {
    name: "Test Store",
    location: "Test Location",
    region: "Gauteng",
    rating: 4.0,
    reviewCount: 100,
    uberEatsUrl: "https://www.ubereats.com/za/store/test/abc",
    slug: "test-store",
    items: [],
    specials: [],
    ...overrides,
  };
}

describe("getOverviewStats", () => {
  it("returns correct totals for stores, items, and specials", () => {
    const stores: Store[] = [
      makeStore({
        name: "Store A",
        rating: 4.5,
        items: [
          { name: "Pizza", category: "Pizza", citationUrl: "" },
          { name: "Pasta", category: "Pasta", citationUrl: "" },
        ],
        specials: [{ name: "Deal 1", description: "Hot deal", citationUrl: "" }],
      }),
      makeStore({
        name: "Store B",
        rating: 3.5,
        items: [{ name: "Salad", category: "Salads", citationUrl: "" }],
        specials: [],
      }),
    ];

    const stats = getOverviewStats(stores);
    expect(stats.totalStores).toBe(2);
    expect(stats.totalItems).toBe(3);
    expect(stats.totalSpecials).toBe(1);
  });

  it("calculates average rating rounded to 1 decimal place", () => {
    const stores: Store[] = [
      makeStore({ rating: 4.3 }),
      makeStore({ rating: 3.7 }),
    ];

    const stats = getOverviewStats(stores);
    expect(stats.avgRating).toBe(4.0);
  });

  it("returns 0 avgRating for empty stores array", () => {
    const stats = getOverviewStats([]);
    expect(stats.avgRating).toBe(0);
    expect(stats.totalStores).toBe(0);
  });

  it("counts stores per region correctly", () => {
    const stores: Store[] = [
      makeStore({ region: "Western Cape" }),
      makeStore({ region: "Western Cape" }),
      makeStore({ region: "Gauteng" }),
      makeStore({ region: "KZN" }),
    ];

    const stats = getOverviewStats(stores);
    expect(stats.regionCounts).toEqual({
      "Western Cape": 2,
      Gauteng: 1,
      KZN: 1,
    });
  });

  it("builds category distribution sorted by count descending", () => {
    const stores: Store[] = [
      makeStore({
        items: [
          { name: "P1", category: "Pizza", citationUrl: "" },
          { name: "P2", category: "Pizza", citationUrl: "" },
          { name: "S1", category: "Salads", citationUrl: "" },
        ],
      }),
      makeStore({
        items: [
          { name: "Pa1", category: "Pasta", citationUrl: "" },
          { name: "Pa2", category: "Pasta", citationUrl: "" },
          { name: "Pa3", category: "Pasta", citationUrl: "" },
        ],
      }),
    ];

    const stats = getOverviewStats(stores);
    expect(stats.categoryDistribution[0]).toEqual({
      name: "Pasta",
      count: 3,
    });
    expect(stats.categoryDistribution[1]).toEqual({
      name: "Pizza",
      count: 2,
    });
    expect(stats.categoryDistribution[2]).toEqual({
      name: "Salads",
      count: 1,
    });
  });

  it("returns top 5 stores by rating descending", () => {
    const stores: Store[] = Array.from({ length: 8 }, (_, i) =>
      makeStore({ name: `Store ${i}`, rating: i + 1 })
    );

    const stats = getOverviewStats(stores);
    expect(stats.topStores).toHaveLength(5);
    expect(stats.topStores[0].rating).toBe(8);
    expect(stats.topStores[4].rating).toBe(4);
  });

  it("returns bottom 5 stores with worst-first ordering", () => {
    const stores: Store[] = Array.from({ length: 8 }, (_, i) =>
      makeStore({ name: `Store ${i}`, rating: i + 1 })
    );

    const stats = getOverviewStats(stores);
    expect(stats.bottomStores).toHaveLength(5);
    // bottomStores: slice(-5) gives [4,5,6,7,8] ratings, .reverse() gives [8,7,6,5,4]
    // Wait — sorted desc by rating gives [8,7,6,5,4,3,2,1], slice(-5) = [4,3,2,1], but we have 8 stores
    // sorted desc: ratings [8,7,6,5,4,3,2,1], slice(-5) = [4,3,2,1] — that's only 4?
    // No: 8 elements, slice(-5) = elements at indices [3,4,5,6,7] = ratings [5,4,3,2,1]
    // .reverse() = [1,2,3,4,5]
    expect(stats.bottomStores[0].rating).toBe(1);
    expect(stats.bottomStores[4].rating).toBe(5);
  });

  it("handles fewer than 5 stores for top/bottom", () => {
    const stores: Store[] = [
      makeStore({ name: "A", rating: 4.5 }),
      makeStore({ name: "B", rating: 3.0 }),
    ];

    const stats = getOverviewStats(stores);
    expect(stats.topStores).toHaveLength(2);
    expect(stats.bottomStores).toHaveLength(2);
  });
});
