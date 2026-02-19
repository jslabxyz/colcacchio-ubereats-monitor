"use client";

import { useState } from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
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

  const allCategories = new Set<string>();
  const allSpecials = new Set<string>();
  selectedStores.forEach((s) => {
    s.items.forEach((i) => allCategories.add(i.category));
    s.specials.forEach((sp) => allSpecials.add(sp.name));
  });

  return (
    <div className="space-y-6">
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

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedStores.map((store) => (
            <Badge key={store.slug} variant="outline"
              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => removeStore(store.slug)}>
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
          {/* Overview Comparison table */}
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

          {/* Category Comparison with red gap highlighting */}
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
                            <td key={selectedStores[idx].slug}
                              className={`py-2 text-right ${count === 0 && max > 0 ? "text-red-500 font-medium" : ""}`}>
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

          {/* Specials Coverage with checkmarks */}
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
