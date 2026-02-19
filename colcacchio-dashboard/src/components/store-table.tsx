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
