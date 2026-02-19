# Col'Cacchio Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a static Next.js dashboard for Col'Cacchio to compare menus, track ratings, monitor promotions, and spot inconsistencies across ~25 Uber Eats stores.

**Architecture:** CSV data is parsed at build time into embedded JSON. Next.js 15 App Router generates static pages deployed to Vercel. A client-side `/import` page allows CSV re-uploads via localStorage without redeploying. changedetection.io runs independently for alerting.

**Tech Stack:** Next.js 15 (App Router, static export), shadcn/ui, Tailwind CSS, Recharts, TypeScript, Vercel

**Data Sources:**
- `/Users/jason/Downloads/CC all/extract-data-2026-02-19.csv` — 2,814 rows, 16 columns (menu items with citation URLs)
- `/Users/jason/Downloads/All Stores-Quick View (2).csv` — 25 stores with Uber Eats URLs

**Design Doc:** `docs/plans/2026-02-19-colcacchio-dashboard-design.md`

---

## Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`

**Step 1: Initialize Next.js project**

Run from the worktree root:
```bash
npx create-next-app@latest colcacchio-dashboard \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --no-turbopack
```

Expected: Project scaffolded in `colcacchio-dashboard/` directory.

**Step 2: Install dependencies**

```bash
cd colcacchio-dashboard
npm install recharts lucide-react csv-parse
npm install -D @types/node
```

Expected: Dependencies added to `package.json`.

**Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init -d
```

Expected: `components.json` created, Tailwind configured for shadcn.

**Step 4: Add shadcn components we'll need**

```bash
npx shadcn@latest add card table badge input select tabs separator button dropdown-menu
```

Expected: Components added to `src/components/ui/`.

**Step 5: Configure static export**

Edit `next.config.ts`:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

**Step 6: Verify the dev server starts**

```bash
npm run dev
```

Expected: Server starts on `http://localhost:3000` with the default Next.js page.

**Step 7: Commit**

```bash
git add colcacchio-dashboard/
git commit -m "feat: scaffold Next.js project with shadcn/ui and dependencies"
```

---

## Task 2: Copy CSV Data and Build Parser

**Files:**
- Create: `colcacchio-dashboard/data/extract-data.csv`
- Create: `colcacchio-dashboard/data/stores.csv`
- Create: `colcacchio-dashboard/src/lib/types.ts`
- Create: `colcacchio-dashboard/src/lib/parse-csv.ts`
- Create: `colcacchio-dashboard/src/lib/parse-csv.test.ts`

**Step 1: Copy CSV files into the project**

```bash
cp "/Users/jason/Downloads/CC all/extract-data-2026-02-19.csv" colcacchio-dashboard/data/extract-data.csv
cp "/Users/jason/Downloads/All Stores-Quick View (2).csv" colcacchio-dashboard/data/stores.csv
```

**Step 2: Create TypeScript types**

Create `colcacchio-dashboard/src/lib/types.ts`:
```typescript
export interface MenuItem {
  name: string;
  category: string;
  citationUrl: string;
}

export interface Special {
  name: string;
  description: string;
  citationUrl: string;
}

export interface Store {
  name: string;
  location: string;
  region: "Gauteng" | "Western Cape" | "KZN" | "Pretoria";
  rating: number;
  reviewCount: number;
  uberEatsUrl: string;
  slug: string;
  items: MenuItem[];
  specials: Special[];
}

export interface DashboardData {
  stores: Store[];
  generatedAt: string;
}
```

**Step 3: Install test runner**

```bash
cd colcacchio-dashboard
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Add to `package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

Create `colcacchio-dashboard/vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**Step 4: Write the failing test for CSV parsing**

Create `colcacchio-dashboard/src/lib/parse-csv.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { parseExtractCsv, classifyRegion, normalizeSpecialName, generateSlug } from "./parse-csv";

describe("classifyRegion", () => {
  it("classifies Gauteng addresses", () => {
    expect(classifyRegion("Shop 49, Dainfern Square, Dainfern")).toBe("Gauteng");
    expect(classifyRegion("Waterfall Corner, Waterfall City")).toBe("Gauteng");
    expect(classifyRegion("Benmore Gardens, Benmore")).toBe("Gauteng");
    expect(classifyRegion("Montecasino, Fourways")).toBe("Gauteng");
    expect(classifyRegion("Bryanston Shopping Centre")).toBe("Gauteng");
    expect(classifyRegion("Northcliff Corner")).toBe("Gauteng");
  });

  it("classifies Western Cape addresses", () => {
    expect(classifyRegion("Old Biscuit Mill, Woodstock")).toBe("Western Cape");
    expect(classifyRegion("Westlake Lifestyle Centre")).toBe("Western Cape");
    expect(classifyRegion("Camps Bay")).toBe("Western Cape");
    expect(classifyRegion("Canal Walk Shopping Centre")).toBe("Western Cape");
    expect(classifyRegion("Cavendish Square, Claremont")).toBe("Western Cape");
    expect(classifyRegion("Stellenbosch")).toBe("Western Cape");
    expect(classifyRegion("Durbanville")).toBe("Western Cape");
    expect(classifyRegion("Bloubergstrand")).toBe("Western Cape");
    expect(classifyRegion("Meadowridge")).toBe("Western Cape");
    expect(classifyRegion("Paardevlei")).toBe("Western Cape");
    expect(classifyRegion("Willowbridge")).toBe("Western Cape");
    expect(classifyRegion("Belvedere Square")).toBe("Western Cape");
    expect(classifyRegion("Haasendal")).toBe("Western Cape");
    expect(classifyRegion("Foreshore, Cape Town")).toBe("Western Cape");
  });

  it("classifies KZN addresses", () => {
    expect(classifyRegion("Hillcrest, KwaZulu-Natal")).toBe("KZN");
    expect(classifyRegion("Florida Road, Durban")).toBe("KZN");
    expect(classifyRegion("Mackeurtan Ave, Durban North")).toBe("KZN");
  });

  it("classifies Pretoria addresses", () => {
    expect(classifyRegion("Brooklyn, Pretoria")).toBe("Pretoria");
  });
});

describe("normalizeSpecialName", () => {
  it("strips emoji decorations", () => {
    expect(normalizeSpecialName("🌟 HOT THIS WEEK 🌟")).toBe("HOT THIS WEEK");
    expect(normalizeSpecialName("HOT THIS WEEK")).toBe("HOT THIS WEEK");
  });

  it("normalizes MSC cruise variants", () => {
    expect(normalizeSpecialName("🚢 MSC Cruise Summer Competition 🚢")).toBe("MSC Cruise Summer Competition");
    expect(normalizeSpecialName("MSC Cruise Summer Competition")).toBe("MSC Cruise Summer Competition");
  });
});

describe("generateSlug", () => {
  it("creates URL-safe slugs", () => {
    expect(generateSlug("Col'Cacchio GO Dainfern")).toBe("colcacchio-go-dainfern");
    expect(generateSlug("Col'Cacchio, Camps Bay")).toBe("colcacchio-camps-bay");
    expect(generateSlug("Col'Cacchio, Canal Walk - Halaal")).toBe("colcacchio-canal-walk-halaal");
  });
});

describe("parseExtractCsv", () => {
  it("parses a minimal CSV into Store objects", () => {
    const csv = `item_name,item_name_citation,category,category_citation,store_name,store_name_citation,store_location,store_location_citation,store_rating,store_rating_citation,store_review_count,store_review_count_citation,special_name,special_name_citation,special_description,special_description_citation
Margherita,https://example.com/1,Wood-Fired Pizza,https://example.com/2,Col'Cacchio GO Dainfern,https://example.com/3,"Shop 49, Dainfern Square, Dainfern",https://example.com/4,4.3,https://example.com/5,3000,https://example.com/6,,,,`;

    const stores = parseExtractCsv(csv);
    expect(stores).toHaveLength(1);
    expect(stores[0].name).toBe("Col'Cacchio GO Dainfern");
    expect(stores[0].region).toBe("Gauteng");
    expect(stores[0].rating).toBe(4.3);
    expect(stores[0].reviewCount).toBe(3000);
    expect(stores[0].items).toHaveLength(1);
    expect(stores[0].items[0].name).toBe("Margherita");
    expect(stores[0].items[0].category).toBe("Wood-Fired Pizza");
    expect(stores[0].specials).toHaveLength(0);
    expect(stores[0].slug).toBe("colcacchio-go-dainfern");
  });

  it("groups specials correctly", () => {
    const csv = `item_name,item_name_citation,category,category_citation,store_name,store_name_citation,store_location,store_location_citation,store_rating,store_rating_citation,store_review_count,store_review_count_citation,special_name,special_name_citation,special_description,special_description_citation
Pizza Deal,https://ex.com/1,Specials,https://ex.com/2,Test Store,https://ex.com/3,Camps Bay,https://ex.com/4,4.5,https://ex.com/5,500,https://ex.com/6,🌟 HOT THIS WEEK 🌟,https://ex.com/7,Get 2 for 1,https://ex.com/8`;

    const stores = parseExtractCsv(csv);
    expect(stores[0].specials).toHaveLength(1);
    expect(stores[0].specials[0].name).toBe("HOT THIS WEEK");
  });
});
```

**Step 5: Run tests to verify they fail**

```bash
cd colcacchio-dashboard && npm test
```

Expected: FAIL — modules not found.

**Step 6: Implement the CSV parser**

Create `colcacchio-dashboard/src/lib/parse-csv.ts`:
```typescript
import type { Store, MenuItem, Special } from "./types";

// Region keywords — order matters (more specific first)
const REGION_MAP: Array<[string[], Store["region"]]> = [
  // KZN
  [["hillcrest", "florida road", "durban", "mackeurtan", "umhlanga", "ballito", "pietermaritzburg", "kwazulu"], "KZN"],
  // Pretoria
  [["pretoria", "brooklyn", "centurion", "menlyn", "hatfield"], "Pretoria"],
  // Western Cape
  [["cape town", "foreshore", "camps bay", "canal walk", "cavendish", "claremont", "stellenbosch",
    "durbanville", "blouberg", "meadowridge", "paardevlei", "willowbridge", "belvedere",
    "haasendal", "old biscuit mill", "woodstock", "westlake", "constantia", "table view",
    "century city", "somerset west", "strand", "gordon"], "Western Cape"],
  // Gauteng (default for JHB/PTA area)
  [["dainfern", "waterfall", "fourways", "montecasino", "benmore", "bryanston", "northcliff",
    "sandton", "rosebank", "bedfordview", "greenstone", "clearwater", "randburg",
    "midrand", "johannesburg", "germiston", "boksburg"], "Gauteng"],
];

export function classifyRegion(location: string): Store["region"] {
  const lower = location.toLowerCase();
  for (const [keywords, region] of REGION_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return region;
    }
  }
  return "Gauteng"; // default fallback
}

export function normalizeSpecialName(name: string): string {
  // Strip common emoji decorations and trim
  return name
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    .trim();
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface CsvRow {
  item_name: string;
  item_name_citation: string;
  category: string;
  category_citation: string;
  store_name: string;
  store_name_citation: string;
  store_location: string;
  store_location_citation: string;
  store_rating: string;
  store_rating_citation: string;
  store_review_count: string;
  store_review_count_citation: string;
  special_name: string;
  special_name_citation: string;
  special_description: string;
  special_description_citation: string;
}

export function parseExtractCsv(csvContent: string): Store[] {
  const lines = csvContent.trim().split("\n");
  const headers = parseCSVLine(lines[0]);

  const storeMap = new Map<string, {
    name: string;
    location: string;
    rating: number;
    reviewCount: number;
    uberEatsUrl: string;
    items: MenuItem[];
    specialsMap: Map<string, Special>;
  }>();

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (values[idx] || "").trim();
    });

    const storeName = row.store_name;
    if (!storeName) continue;

    if (!storeMap.has(storeName)) {
      storeMap.set(storeName, {
        name: storeName,
        location: row.store_location || "",
        rating: parseFloat(row.store_rating) || 0,
        reviewCount: parseInt(row.store_review_count) || 0,
        uberEatsUrl: row.store_name_citation || "",
        items: [],
        specialsMap: new Map(),
      });
    }

    const store = storeMap.get(storeName)!;

    // Add menu item
    if (row.item_name) {
      store.items.push({
        name: row.item_name,
        category: row.category || "Uncategorized",
        citationUrl: row.item_name_citation || "",
      });
    }

    // Add special (deduplicated by normalized name)
    if (row.special_name) {
      const normalizedName = normalizeSpecialName(row.special_name);
      if (normalizedName && !store.specialsMap.has(normalizedName)) {
        store.specialsMap.set(normalizedName, {
          name: normalizedName,
          description: row.special_description || "",
          citationUrl: row.special_name_citation || "",
        });
      }
    }
  }

  return Array.from(storeMap.values()).map((s) => ({
    name: s.name,
    location: s.location,
    region: classifyRegion(s.location),
    rating: s.rating,
    reviewCount: s.reviewCount,
    uberEatsUrl: s.uberEatsUrl,
    slug: generateSlug(s.name),
    items: s.items,
    specials: Array.from(s.specialsMap.values()),
  }));
}

/** Simple CSV line parser that handles quoted fields */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
```

**Step 7: Run tests to verify they pass**

```bash
cd colcacchio-dashboard && npm test
```

Expected: All tests PASS.

**Step 8: Commit**

```bash
git add colcacchio-dashboard/data/ colcacchio-dashboard/src/lib/
git commit -m "feat: add CSV parser with region classification and special normalization"
```

---

## Task 3: Build-Time Data Generation

**Files:**
- Create: `colcacchio-dashboard/src/lib/data.ts`
- Create: `colcacchio-dashboard/src/lib/merge-store-urls.ts`
- Create: `colcacchio-dashboard/src/lib/merge-store-urls.test.ts`

**Step 1: Write failing test for URL merging**

Create `colcacchio-dashboard/src/lib/merge-store-urls.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { mergeStoreUrls } from "./merge-store-urls";
import type { Store } from "./types";

describe("mergeStoreUrls", () => {
  it("matches stores by URL slug similarity", () => {
    const stores: Store[] = [
      {
        name: "Col'Cacchio GO Dainfern",
        location: "Dainfern Square",
        region: "Gauteng",
        rating: 4.3,
        reviewCount: 3000,
        uberEatsUrl: "https://www.ubereats.com/za/store/colcacchio-go-dainfern/oVpo3Z9cSx",
        slug: "colcacchio-go-dainfern",
        items: [],
        specials: [],
      },
    ];

    const storesCsv = `Store Name,Uber Eats url
Col'Cacchio - DAINFERN SQUARE,https://www.ubereats.com/za/store/colcacchio-go-dainfern/oVpo3Z9cSx-Di-_4XestLg`;

    const merged = mergeStoreUrls(stores, storesCsv);
    expect(merged[0].uberEatsUrl).toBe(
      "https://www.ubereats.com/za/store/colcacchio-go-dainfern/oVpo3Z9cSx-Di-_4XestLg"
    );
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd colcacchio-dashboard && npm test
```

Expected: FAIL — module not found.

**Step 3: Implement URL merger**

Create `colcacchio-dashboard/src/lib/merge-store-urls.ts`:
```typescript
import type { Store } from "./types";

/**
 * Merge full Uber Eats URLs from the store directory CSV into parsed stores.
 * Matches by extracting the store slug from URLs since names differ between CSVs.
 */
export function mergeStoreUrls(stores: Store[], storesCsvContent: string): Store[] {
  const lines = storesCsvContent.trim().split("\n");
  // Build a map of URL slug -> full URL
  const urlMap = new Map<string, string>();
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    const url = parts[parts.length - 1].trim();
    // Extract slug from URL: /za/store/{slug}/{id}
    const match = url.match(/\/store\/([^/]+)\//);
    if (match) {
      urlMap.set(match[1], url);
    }
  }

  return stores.map((store) => {
    // Try to match by extracting slug from the store's citation URL
    const storeMatch = store.uberEatsUrl.match(/\/store\/([^/]+)\//);
    if (storeMatch && urlMap.has(storeMatch[1])) {
      return { ...store, uberEatsUrl: urlMap.get(storeMatch[1])! };
    }
    return store;
  });
}
```

**Step 4: Run tests**

```bash
cd colcacchio-dashboard && npm test
```

Expected: All tests PASS.

**Step 5: Create the data loader**

Create `colcacchio-dashboard/src/lib/data.ts`:
```typescript
import { readFileSync } from "fs";
import { join } from "path";
import { parseExtractCsv } from "./parse-csv";
import { mergeStoreUrls } from "./merge-store-urls";
import type { DashboardData, Store } from "./types";

let cachedData: DashboardData | null = null;

export function getDashboardData(): DashboardData {
  if (cachedData) return cachedData;

  const dataDir = join(process.cwd(), "data");

  const extractCsv = readFileSync(join(dataDir, "extract-data.csv"), "utf-8");
  const storesCsv = readFileSync(join(dataDir, "stores.csv"), "utf-8");

  let stores = parseExtractCsv(extractCsv);
  stores = mergeStoreUrls(stores, storesCsv);

  // Sort by name for consistent ordering
  stores.sort((a, b) => a.name.localeCompare(b.name));

  cachedData = {
    stores,
    generatedAt: new Date().toISOString(),
  };

  return cachedData;
}

/** Derived stats for the overview page */
export function getOverviewStats(stores: Store[]) {
  const totalItems = stores.reduce((sum, s) => sum + s.items.length, 0);
  const totalSpecials = stores.reduce((sum, s) => sum + s.specials.length, 0);
  const avgRating =
    stores.reduce((sum, s) => sum + s.rating, 0) / stores.length;

  const regionCounts = stores.reduce(
    (acc, s) => {
      acc[s.region] = (acc[s.region] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const categoryDistribution = stores
    .flatMap((s) => s.items)
    .reduce(
      (acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

  return {
    totalStores: stores.length,
    totalItems,
    totalSpecials,
    avgRating: Math.round(avgRating * 10) / 10,
    regionCounts,
    categoryDistribution,
    topStores: [...stores].sort((a, b) => b.rating - a.rating).slice(0, 5),
    bottomStores: [...stores].sort((a, b) => a.rating - b.rating).slice(0, 5),
  };
}
```

**Step 6: Commit**

```bash
git add colcacchio-dashboard/src/lib/
git commit -m "feat: add build-time data loader with URL merging and overview stats"
```

---

## Task 4: App Shell and Navigation

**Files:**
- Modify: `colcacchio-dashboard/src/app/layout.tsx`
- Create: `colcacchio-dashboard/src/components/nav.tsx`

**Step 1: Create the navigation component**

Create `colcacchio-dashboard/src/components/nav.tsx`:
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Overview" },
  { href: "/stores", label: "Stores" },
  { href: "/compare", label: "Compare" },
  { href: "/specials", label: "Specials" },
  { href: "/import", label: "Import" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">Col&apos;Cacchio</span>
            <span className="text-sm text-muted-foreground">Dashboard</span>
          </div>
          <div className="flex gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === link.href ||
                    (link.href !== "/" && pathname.startsWith(link.href))
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
```

**Step 2: Update the root layout**

Replace `colcacchio-dashboard/src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Col'Cacchio Dashboard",
  description: "Uber Eats store monitoring dashboard for Col'Cacchio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Nav />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
```

**Step 3: Verify the app renders with navigation**

```bash
cd colcacchio-dashboard && npm run dev
```

Expected: App shows "Col'Cacchio Dashboard" header with navigation links.

**Step 4: Commit**

```bash
git add colcacchio-dashboard/src/
git commit -m "feat: add app shell with navigation bar"
```

---

## Task 5: Overview Page (`/`)

**Files:**
- Modify: `colcacchio-dashboard/src/app/page.tsx`
- Create: `colcacchio-dashboard/src/components/kpi-card.tsx`
- Create: `colcacchio-dashboard/src/components/charts/region-chart.tsx`
- Create: `colcacchio-dashboard/src/components/charts/category-chart.tsx`
- Create: `colcacchio-dashboard/src/components/store-rating-list.tsx`

**Step 1: Create KPI card component**

Create `colcacchio-dashboard/src/components/kpi-card.tsx`:
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
}

export function KpiCard({ title, value, description }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 2: Create region bar chart**

Create `colcacchio-dashboard/src/components/charts/region-chart.tsx`:
```tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RegionChartProps {
  data: Record<string, number>;
}

export function RegionChart({ data }: RegionChartProps) {
  const chartData = Object.entries(data).map(([name, count]) => ({
    name,
    count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stores by Region</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

**Step 3: Create category distribution chart**

Create `colcacchio-dashboard/src/components/charts/category-chart.tsx`:
```tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CategoryChartProps {
  data: Record<string, number>;
}

export function CategoryChart({ data }: CategoryChartProps) {
  const chartData = Object.entries(data)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12); // top 12 categories

  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu Items by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 120 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

**Step 4: Create store rating list component**

Create `colcacchio-dashboard/src/components/store-rating-list.tsx`:
```tsx
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Store } from "@/lib/types";

function ratingColor(rating: number) {
  if (rating >= 4.5) return "bg-green-500";
  if (rating >= 4.0) return "bg-amber-500";
  return "bg-red-500";
}

interface StoreRatingListProps {
  title: string;
  stores: Store[];
}

export function StoreRatingList({ title, stores }: StoreRatingListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stores.map((store) => (
          <div key={store.slug} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{store.name}</p>
              <p className="text-xs text-muted-foreground">{store.region}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{store.reviewCount.toLocaleString()} reviews</Badge>
              <Badge className={ratingColor(store.rating)}>{store.rating}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

**Step 5: Build the overview page**

Replace `colcacchio-dashboard/src/app/page.tsx`:
```tsx
import { getDashboardData, getOverviewStats } from "@/lib/data";
import { KpiCard } from "@/components/kpi-card";
import { RegionChart } from "@/components/charts/region-chart";
import { CategoryChart } from "@/components/charts/category-chart";
import { StoreRatingList } from "@/components/store-rating-list";

export default function OverviewPage() {
  const { stores } = getDashboardData();
  const stats = getOverviewStats(stores);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Overview</h1>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard title="Total Stores" value={stats.totalStores} />
        <KpiCard title="Total Menu Items" value={stats.totalItems.toLocaleString()} />
        <KpiCard title="Avg Rating" value={stats.avgRating} />
        <KpiCard title="Active Specials" value={stats.totalSpecials} />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RegionChart data={stats.regionCounts} />
        <CategoryChart data={stats.categoryDistribution} />
      </div>

      {/* Top/Bottom Stores */}
      <div className="grid gap-6 lg:grid-cols-2">
        <StoreRatingList title="Top 5 Stores by Rating" stores={stats.topStores} />
        <StoreRatingList title="Bottom 5 Stores by Rating" stores={stats.bottomStores} />
      </div>
    </div>
  );
}
```

**Step 6: Verify the overview page renders**

```bash
cd colcacchio-dashboard && npm run dev
```

Expected: Overview page shows KPI cards, charts, and store rating lists with real data.

**Step 7: Commit**

```bash
git add colcacchio-dashboard/src/
git commit -m "feat: add overview page with KPI cards, region chart, category chart, and rating lists"
```

---

## Task 6: Store List Page (`/stores`)

**Files:**
- Create: `colcacchio-dashboard/src/app/stores/page.tsx`
- Create: `colcacchio-dashboard/src/components/store-table.tsx`

**Step 1: Create the store table component**

Create `colcacchio-dashboard/src/components/store-table.tsx`:
```tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Store } from "@/lib/types";

function ratingBadge(rating: number) {
  if (rating >= 4.5) return <Badge className="bg-green-500">{rating}</Badge>;
  if (rating >= 4.0) return <Badge className="bg-amber-500">{rating}</Badge>;
  return <Badge className="bg-red-500">{rating}</Badge>;
}

type SortKey = "name" | "region" | "rating" | "reviewCount" | "items" | "specials";
type SortDir = "asc" | "desc";

export function StoreTable({ stores }: { stores: Store[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    const lower = search.toLowerCase();
    let result = stores.filter(
      (s) =>
        s.name.toLowerCase().includes(lower) ||
        s.region.toLowerCase().includes(lower) ||
        s.location.toLowerCase().includes(lower)
    );

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "region": cmp = a.region.localeCompare(b.region); break;
        case "rating": cmp = a.rating - b.rating; break;
        case "reviewCount": cmp = a.reviewCount - b.reviewCount; break;
        case "items": cmp = a.items.length - b.items.length; break;
        case "specials": cmp = a.specials.length - b.specials.length; break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [stores, search, sortKey, sortDir]);

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by name, location, or region..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("name")}>
                Store{sortIndicator("name")}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("region")}>
                Region{sortIndicator("region")}
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("rating")}>
                Rating{sortIndicator("rating")}
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("reviewCount")}>
                Reviews{sortIndicator("reviewCount")}
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("items")}>
                Items{sortIndicator("items")}
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("specials")}>
                Specials{sortIndicator("specials")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((store) => (
              <TableRow key={store.slug}>
                <TableCell>
                  <Link
                    href={`/stores/${store.slug}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {store.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{store.location}</p>
                </TableCell>
                <TableCell>{store.region}</TableCell>
                <TableCell className="text-right">{ratingBadge(store.rating)}</TableCell>
                <TableCell className="text-right">{store.reviewCount.toLocaleString()}</TableCell>
                <TableCell className="text-right">{store.items.length}</TableCell>
                <TableCell className="text-right">{store.specials.length}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} of {stores.length} stores
      </p>
    </div>
  );
}
```

**Step 2: Create the stores page**

Create `colcacchio-dashboard/src/app/stores/page.tsx`:
```tsx
import { getDashboardData } from "@/lib/data";
import { StoreTable } from "@/components/store-table";

export default function StoresPage() {
  const { stores } = getDashboardData();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Stores</h1>
      <StoreTable stores={stores} />
    </div>
  );
}
```

**Step 3: Verify**

```bash
cd colcacchio-dashboard && npm run dev
```

Navigate to `/stores`. Expected: Sortable, filterable table with all 24 stores.

**Step 4: Commit**

```bash
git add colcacchio-dashboard/src/
git commit -m "feat: add store list page with sortable/filterable table"
```

---

## Task 7: Store Detail Page (`/stores/[slug]`)

**Files:**
- Create: `colcacchio-dashboard/src/app/stores/[slug]/page.tsx`

**Step 1: Create the store detail page**

Create `colcacchio-dashboard/src/app/stores/[slug]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getDashboardData } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Store } from "@/lib/types";

export function generateStaticParams() {
  const { stores } = getDashboardData();
  return stores.map((s) => ({ slug: s.slug }));
}

function ratingColor(rating: number) {
  if (rating >= 4.5) return "bg-green-500";
  if (rating >= 4.0) return "bg-amber-500";
  return "bg-red-500";
}

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { stores } = getDashboardData();
  const store = stores.find((s) => s.slug === slug);
  if (!store) notFound();

  // Group items by category
  const categories = store.items.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, Store["items"]>
  );

  const sortedCategories = Object.entries(categories).sort(
    (a, b) => b[1].length - a[1].length
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/stores" className="text-sm text-muted-foreground hover:underline">
            ← Back to stores
          </Link>
          <h1 className="mt-2 text-3xl font-bold">{store.name}</h1>
          <p className="text-muted-foreground">{store.location}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={ratingColor(store.rating)} className="text-lg px-3 py-1">
            {store.rating}
          </Badge>
          <div className="text-right">
            <p className="text-sm font-medium">{store.reviewCount.toLocaleString()} reviews</p>
            <p className="text-xs text-muted-foreground">{store.region}</p>
          </div>
        </div>
      </div>

      {store.uberEatsUrl && (
        <a
          href={store.uberEatsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-primary hover:underline"
        >
          View on Uber Eats →
        </a>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{store.items.length}</p>
            <p className="text-sm text-muted-foreground">Menu Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{Object.keys(categories).length}</p>
            <p className="text-sm text-muted-foreground">Categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{store.specials.length}</p>
            <p className="text-sm text-muted-foreground">Active Specials</p>
          </CardContent>
        </Card>
      </div>

      {/* Specials */}
      {store.specials.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle>Active Specials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {store.specials.map((special) => (
              <div key={special.name}>
                <p className="font-medium">{special.name}</p>
                {special.description && (
                  <p className="text-sm text-muted-foreground">{special.description}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Menu by Category */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Menu</h2>
        {sortedCategories.map(([category, items]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                {category}
                <Badge variant="secondary">{items.length} items</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item, idx) => (
                  <p key={idx} className="text-sm">
                    {item.name}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

**Note:** There's a duplicate `className` prop on the Badge — the implementer should merge them into `className={cn("text-lg px-3 py-1", ratingColor(store.rating))}` with the `cn` utility imported from `@/lib/utils`.

**Step 2: Verify**

```bash
cd colcacchio-dashboard && npm run dev
```

Navigate to `/stores`, click any store. Expected: Detail page with header, stats, specials, and categorized menu.

**Step 3: Commit**

```bash
git add colcacchio-dashboard/src/app/stores/
git commit -m "feat: add store detail page with menu breakdown and specials"
```

---

## Task 8: Compare Page (`/compare`)

**Files:**
- Create: `colcacchio-dashboard/src/app/compare/page.tsx`
- Create: `colcacchio-dashboard/src/components/compare-view.tsx`

**Step 1: Create the compare view component**

Create `colcacchio-dashboard/src/components/compare-view.tsx`:
```tsx
"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Store } from "@/lib/types";

function getCategoryCounts(store: Store) {
  return store.items.reduce(
    (acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
}

export function CompareView({ stores }: { stores: Store[] }) {
  const [selected, setSelected] = useState<string[]>([]);

  const addStore = (slug: string) => {
    if (selected.length < 4 && !selected.includes(slug)) {
      setSelected([...selected, slug]);
    }
  };

  const removeStore = (slug: string) => {
    setSelected(selected.filter((s) => s !== slug));
  };

  const selectedStores = selected
    .map((slug) => stores.find((s) => s.slug === slug))
    .filter(Boolean) as Store[];

  // Collect all categories across selected stores
  const allCategories = new Set<string>();
  const allSpecials = new Set<string>();
  selectedStores.forEach((s) => {
    s.items.forEach((i) => allCategories.add(i.category));
    s.specials.forEach((sp) => allSpecials.add(sp.name));
  });

  return (
    <div className="space-y-6">
      {/* Store Selector */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select onValueChange={addStore}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Add a store to compare..." />
          </SelectTrigger>
          <SelectContent>
            {stores
              .filter((s) => !selected.includes(s.slug))
              .map((store) => (
                <SelectItem key={store.slug} value={store.slug}>
                  {store.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {selected.length}/4 stores selected
        </p>
      </div>

      {/* Selected store badges */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedStores.map((store) => (
            <Badge
              key={store.slug}
              variant="outline"
              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => removeStore(store.slug)}
            >
              {store.name} ✕
            </Badge>
          ))}
        </div>
      )}

      {selectedStores.length < 2 && (
        <p className="text-muted-foreground">Select at least 2 stores to compare.</p>
      )}

      {selectedStores.length >= 2 && (
        <>
          {/* Overview Comparison */}
          <Card>
            <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left font-medium">Metric</th>
                      {selectedStores.map((s) => (
                        <th key={s.slug} className="py-2 text-right font-medium">{s.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">Rating</td>
                      {selectedStores.map((s) => (
                        <td key={s.slug} className="py-2 text-right">{s.rating}</td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Reviews</td>
                      {selectedStores.map((s) => (
                        <td key={s.slug} className="py-2 text-right">{s.reviewCount.toLocaleString()}</td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Total Items</td>
                      {selectedStores.map((s) => (
                        <td key={s.slug} className="py-2 text-right">{s.items.length}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2">Specials</td>
                      {selectedStores.map((s) => (
                        <td key={s.slug} className="py-2 text-right">{s.specials.length}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Category Comparison */}
          <Card>
            <CardHeader><CardTitle>Items by Category</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left font-medium">Category</th>
                      {selectedStores.map((s) => (
                        <th key={s.slug} className="py-2 text-right font-medium">{s.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(allCategories).sort().map((cat) => {
                      const counts = selectedStores.map((s) => getCategoryCounts(s)[cat] || 0);
                      const max = Math.max(...counts);
                      const hasGap = max > 0 && counts.some((c) => c === 0);
                      return (
                        <tr key={cat} className={`border-b ${hasGap ? "bg-red-50" : ""}`}>
                          <td className="py-2">{cat}</td>
                          {counts.map((count, idx) => (
                            <td
                              key={selectedStores[idx].slug}
                              className={`py-2 text-right ${count === 0 && max > 0 ? "text-red-500 font-medium" : ""}`}
                            >
                              {count || "—"}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Specials Comparison */}
          {allSpecials.size > 0 && (
            <Card>
              <CardHeader><CardTitle>Specials Coverage</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left font-medium">Special</th>
                        {selectedStores.map((s) => (
                          <th key={s.slug} className="py-2 text-center font-medium">{s.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from(allSpecials).sort().map((special) => (
                        <tr key={special} className="border-b">
                          <td className="py-2">{special}</td>
                          {selectedStores.map((s) => {
                            const has = s.specials.some((sp) => sp.name === special);
                            return (
                              <td key={s.slug} className="py-2 text-center">
                                {has ? "✓" : <span className="text-red-500">✗</span>}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
```

**Step 2: Create the compare page**

Create `colcacchio-dashboard/src/app/compare/page.tsx`:
```tsx
import { getDashboardData } from "@/lib/data";
import { CompareView } from "@/components/compare-view";

export default function ComparePage() {
  const { stores } = getDashboardData();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Compare Stores</h1>
      <CompareView stores={stores} />
    </div>
  );
}
```

**Step 3: Verify**

```bash
cd colcacchio-dashboard && npm run dev
```

Navigate to `/compare`, select 2+ stores. Expected: Side-by-side comparison tables with red highlighting for gaps.

**Step 4: Commit**

```bash
git add colcacchio-dashboard/src/
git commit -m "feat: add compare page with side-by-side store comparison"
```

---

## Task 9: Specials Page (`/specials`)

**Files:**
- Create: `colcacchio-dashboard/src/app/specials/page.tsx`

**Step 1: Create the specials page**

Create `colcacchio-dashboard/src/app/specials/page.tsx`:
```tsx
import { getDashboardData } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SpecialsPage() {
  const { stores } = getDashboardData();

  // Group all specials across stores
  const specialMap = new Map<string, { description: string; stores: string[] }>();

  stores.forEach((store) => {
    store.specials.forEach((special) => {
      if (!specialMap.has(special.name)) {
        specialMap.set(special.name, { description: special.description, stores: [] });
      }
      specialMap.get(special.name)!.stores.push(store.name);
    });
  });

  const specials = Array.from(specialMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.stores.length - a.stores.length);

  // Find stores missing specials that others have
  const storesWithNoSpecials = stores.filter((s) => s.specials.length === 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Specials</h1>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{specials.length}</p>
            <p className="text-sm text-muted-foreground">Unique Specials</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">
              {stores.filter((s) => s.specials.length > 0).length}
            </p>
            <p className="text-sm text-muted-foreground">Stores with Specials</p>
          </CardContent>
        </Card>
        <Card className={storesWithNoSpecials.length > 0 ? "border-red-200" : ""}>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-red-500">{storesWithNoSpecials.length}</p>
            <p className="text-sm text-muted-foreground">Stores Missing All Specials</p>
          </CardContent>
        </Card>
      </div>

      {/* Each Special */}
      {specials.map((special) => (
        <Card key={special.name}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {special.name}
              <Badge variant="secondary">
                {special.stores.length} of {stores.length} stores
              </Badge>
            </CardTitle>
            {special.description && (
              <p className="text-sm text-muted-foreground">{special.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-600">Stores with this special:</p>
              <div className="flex flex-wrap gap-1">
                {special.stores.map((name) => (
                  <Badge key={name} variant="outline" className="text-xs">
                    {name}
                  </Badge>
                ))}
              </div>
              {stores.length - special.stores.length > 0 && (
                <>
                  <p className="mt-3 text-sm font-medium text-red-600">Missing from:</p>
                  <div className="flex flex-wrap gap-1">
                    {stores
                      .filter((s) => !special.stores.includes(s.name))
                      .map((s) => (
                        <Badge key={s.slug} variant="outline" className="text-xs text-red-500 border-red-200">
                          {s.name}
                        </Badge>
                      ))}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Stores with no specials at all */}
      {storesWithNoSpecials.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle>Stores with No Active Specials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {storesWithNoSpecials.map((s) => (
                <Badge key={s.slug} variant="destructive">
                  {s.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

**Step 2: Verify**

```bash
cd colcacchio-dashboard && npm run dev
```

Navigate to `/specials`. Expected: Specials grouped by name, showing which stores have/miss each special.

**Step 3: Commit**

```bash
git add colcacchio-dashboard/src/app/specials/
git commit -m "feat: add specials page with cross-store promotion tracking"
```

---

## Task 10: Import Page (`/import`)

**Files:**
- Create: `colcacchio-dashboard/src/app/import/page.tsx`
- Create: `colcacchio-dashboard/src/components/csv-importer.tsx`

**Step 1: Create the CSV importer component**

Create `colcacchio-dashboard/src/components/csv-importer.tsx`:
```tsx
"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function CsvImporter() {
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<"idle" | "preview" | "saved">("idle");
  const [preview, setPreview] = useState<{ rows: number; stores: number } | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.trim().split("\n");
      const storeNames = new Set<string>();
      for (let i = 1; i < lines.length; i++) {
        // Extract store_name (5th column, 0-indexed: 4)
        const parts = lines[i].split(",");
        if (parts[4]) storeNames.add(parts[4].replace(/"/g, ""));
      }
      setPreview({ rows: lines.length - 1, stores: storeNames.size });
      setStatus("preview");

      // Store in localStorage
      localStorage.setItem("colcacchio-csv-data", text);
      localStorage.setItem("colcacchio-csv-date", new Date().toISOString());
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const handleReset = () => {
    localStorage.removeItem("colcacchio-csv-data");
    localStorage.removeItem("colcacchio-csv-date");
    setStatus("idle");
    setPreview(null);
    setFileName("");
  };

  const savedDate = typeof window !== "undefined"
    ? localStorage.getItem("colcacchio-csv-date")
    : null;

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-muted"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-lg font-medium">
            {dragActive ? "Drop CSV file here" : "Drag & drop a CSV file"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Or click to browse
          </p>
          <input
            type="file"
            accept=".csv"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
          />
        </CardContent>
      </Card>

      {/* Preview */}
      {status === "preview" && preview && (
        <Card>
          <CardHeader>
            <CardTitle>Import Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              File: <span className="font-medium">{fileName}</span>
            </p>
            <div className="flex gap-4">
              <Badge variant="secondary">{preview.rows} rows</Badge>
              <Badge variant="secondary">{preview.stores} stores</Badge>
            </div>
            <p className="text-sm text-green-600">
              Data saved to browser storage. Reload the page to use the new data.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Saved data info */}
      {savedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Stored Data
              <Button variant="destructive" size="sm" onClick={handleReset}>
                Reset to Built-in Data
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Last imported: {new Date(savedDate).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>CSV Format</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>The CSV should match the Uber Eats extract format with these columns:</p>
          <code className="block rounded bg-muted p-3 text-xs">
            item_name, item_name_citation, category, category_citation, store_name,
            store_name_citation, store_location, store_location_citation, store_rating,
            store_rating_citation, store_review_count, store_review_count_citation,
            special_name, special_name_citation, special_description, special_description_citation
          </code>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Create the import page**

Create `colcacchio-dashboard/src/app/import/page.tsx`:
```tsx
import { CsvImporter } from "@/components/csv-importer";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Import Data</h1>
      <p className="text-muted-foreground">
        Upload a new CSV export to update the dashboard data without redeploying.
        Data is stored in your browser&apos;s localStorage.
      </p>
      <CsvImporter />
    </div>
  );
}
```

**Step 3: Verify**

```bash
cd colcacchio-dashboard && npm run dev
```

Navigate to `/import`. Expected: Drag-and-drop upload area with CSV format documentation.

**Step 4: Commit**

```bash
git add colcacchio-dashboard/src/
git commit -m "feat: add import page with drag-and-drop CSV upload and localStorage persistence"
```

---

## Task 11: Build and Verify Static Export

**Step 1: Run the production build**

```bash
cd colcacchio-dashboard && npm run build
```

Expected: Build completes successfully with all pages statically generated.

**Step 2: Test the static export locally**

```bash
npx serve@latest out
```

Expected: All pages work at `http://localhost:3000`, navigation functions, charts render.

**Step 3: Run all tests**

```bash
cd colcacchio-dashboard && npm test
```

Expected: All tests pass.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: verify build and static export"
```

---

## Task 12: Deploy to Vercel

**Step 1: Initialize Vercel project**

```bash
cd colcacchio-dashboard && npx vercel --yes
```

Expected: Project linked to Vercel account.

**Step 2: Deploy**

```bash
npx vercel --prod
```

Expected: Production deployment URL returned.

**Step 3: Verify the live deployment**

Open the deployment URL and check:
- Overview page loads with charts and KPIs
- Store list is sortable and filterable
- Store detail pages load with menu breakdowns
- Compare page allows multi-store comparison
- Specials page shows cross-store promotion coverage
- Import page has drag-and-drop functionality

**Step 4: Commit deployment config**

```bash
git add .vercel/ vercel.json 2>/dev/null; git commit -m "chore: add Vercel deployment configuration" || echo "nothing to commit"
```

---

## Summary

| Task | Description | Estimated Commits |
|------|-------------|-------------------|
| 1 | Scaffold Next.js + shadcn/ui | 1 |
| 2 | CSV parser + types + tests | 1 |
| 3 | Build-time data loader + URL merging | 1 |
| 4 | App shell + navigation | 1 |
| 5 | Overview page (KPIs, charts, ratings) | 1 |
| 6 | Store list page (table) | 1 |
| 7 | Store detail page (menu breakdown) | 1 |
| 8 | Compare page (side-by-side) | 1 |
| 9 | Specials page (promotion tracking) | 1 |
| 10 | Import page (CSV upload + localStorage) | 1 |
| 11 | Build verification | 1 |
| 12 | Vercel deployment | 1 |

**Total: 12 tasks, ~12 commits**
