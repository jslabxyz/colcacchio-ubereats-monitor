# Col'Cacchio Store Dashboard — Design Document

**Date:** 2026-02-19
**Status:** Approved

## Problem

Col'Cacchio has ~25 stores on Uber Eats across South Africa. They need a single tool to compare menus, track ratings, monitor promotions, and spot inconsistencies across all stores. The data comes from scraped Uber Eats CSVs (2,814 menu items, 24 stores, 19 categories).

## Solution

A Next.js static dashboard deployed on Vercel that parses CSV data at build time. changedetection.io continues to handle change alerting independently.

## Architecture

```
CSV files → build-time parsing → static JSON → Next.js pages → Vercel
changedetection.io (Docker) → email alerts (independent)
```

- No database. CSV data is embedded as JSON at build time.
- `/import` page allows browser-side CSV uploads (localStorage) for quick updates without redeploying.
- changedetection.io remains the alerting layer; the dashboard is the analysis layer.

## Pages

### Overview (`/`)
- KPI cards: total stores, total items, average rating, active specials count
- Regional breakdown chart (Gauteng, Western Cape, KZN, Pretoria)
- Top/bottom 5 stores by rating
- Category distribution chart

### Store List (`/stores`)
- Sortable/filterable table: name, location, rating, review count, item count, specials count
- Search by name or region
- Color-coded ratings (green/amber/red)
- Click row → store detail

### Store Detail (`/stores/[slug]`)
- Header with store metadata + Uber Eats link
- Menu breakdown by category (collapsible)
- Active specials highlighted
- Searchable item list

### Compare (`/compare`)
- Select 2-4 stores via dropdowns
- Side-by-side: item counts per category, ratings, reviews, specials
- Highlight differences (missing promotions, item count gaps)

### Specials (`/specials`)
- All active specials grouped by name
- Which stores have each special
- Flag stores missing promotions others have

### Import (`/import`)
- Drag-and-drop CSV upload
- Preview parsed data
- localStorage persistence
- Reset to built-in dataset

## Data Model

```typescript
interface Store {
  name: string;
  location: string;
  region: string; // Gauteng | Western Cape | KZN | Pretoria
  rating: number;
  reviewCount: number;
  uberEatsUrl: string;
  slug: string;
  items: MenuItem[];
  specials: Special[];
}

interface MenuItem {
  name: string;
  category: string;
  citationUrl: string;
}

interface Special {
  name: string;
  description: string;
  citationUrl: string;
}
```

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router, static export) |
| UI | shadcn/ui + Tailwind CSS |
| Charts | Recharts |
| Data | CSV → JSON at build time |
| Client state | React state + localStorage |
| Deploy | Vercel (free tier) |

## Data Sources

- **Main data:** `/extract-data-2026-02-19.csv` — 2,814 rows, 16 columns with citation URLs
- **Store directory:** `/All Stores-Quick View (2).csv` — 25 stores with Uber Eats URLs
- **Data freshness:** Manual CSV re-import + changedetection.io alerts

## Non-Goals

- No real-time scraping from the dashboard itself
- No user authentication (internal tool)
- No price tracking (prices not in current CSV data)
