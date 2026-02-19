import fs from "fs";
import path from "path";
import { DashboardData, Store } from "./types";
import { parseExtractCsv } from "./parse-csv";
import { mergeStoreUrls } from "./merge-store-urls";

let cachedData: DashboardData | null = null;

/**
 * Load and parse all dashboard data from the CSV files at build time.
 *
 * This function reads from the filesystem and is intended to run only
 * on the server (Next.js RSC / getStaticProps), never in the browser.
 *
 * Results are cached in-memory so repeated calls within the same
 * build process return the same data without re-reading files.
 */
export function getDashboardData(): DashboardData {
  if (cachedData) return cachedData;

  const extractPath = path.join(process.cwd(), "data", "extract-data.csv");
  const storesPath = path.join(process.cwd(), "data", "stores.csv");

  const extractCsv = fs.readFileSync(extractPath, "utf-8");
  const storesCsv = fs.readFileSync(storesPath, "utf-8");

  let stores = parseExtractCsv(extractCsv);
  stores = mergeStoreUrls(stores, storesCsv);
  stores.sort((a, b) => a.name.localeCompare(b.name));

  cachedData = {
    stores,
    generatedAt: new Date().toISOString(),
  };

  return cachedData;
}

export interface OverviewStats {
  totalStores: number;
  totalItems: number;
  totalSpecials: number;
  avgRating: number;
  regionCounts: Record<string, number>;
  categoryDistribution: { name: string; count: number }[];
  topStores: Store[];
  bottomStores: Store[];
}

/**
 * Compute aggregate overview statistics from an array of stores.
 *
 * - regionCounts: how many stores per region
 * - categoryDistribution: menu item counts per category, sorted descending
 * - topStores: 5 highest-rated stores
 * - bottomStores: 5 lowest-rated stores (sorted worst-first)
 */
export function getOverviewStats(stores: Store[]): OverviewStats {
  const totalStores = stores.length;
  const totalItems = stores.reduce((sum, s) => sum + s.items.length, 0);
  const totalSpecials = stores.reduce((sum, s) => sum + s.specials.length, 0);
  const avgRating =
    stores.length > 0
      ? Math.round(
          (stores.reduce((sum, s) => sum + s.rating, 0) / stores.length) * 10
        ) / 10
      : 0;

  const regionCounts: Record<string, number> = {};
  stores.forEach((s) => {
    regionCounts[s.region] = (regionCounts[s.region] || 0) + 1;
  });

  const catMap = new Map<string, number>();
  stores.forEach((s) => {
    s.items.forEach((item) => {
      catMap.set(item.category, (catMap.get(item.category) || 0) + 1);
    });
  });
  const categoryDistribution = Array.from(catMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const sorted = [...stores].sort((a, b) => b.rating - a.rating);
  const topStores = sorted.slice(0, 5);
  const bottomStores = sorted.slice(-5).reverse();

  return {
    totalStores,
    totalItems,
    totalSpecials,
    avgRating,
    regionCounts,
    categoryDistribution,
    topStores,
    bottomStores,
  };
}
