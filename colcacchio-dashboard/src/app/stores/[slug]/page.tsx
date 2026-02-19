import { notFound } from "next/navigation";
import Link from "next/link";
import { getDashboardData } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
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
            &larr; Back to stores
          </Link>
          <h1 className="mt-2 text-3xl font-bold">{store.name}</h1>
          <p className="text-muted-foreground">{store.location}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={cn("text-lg px-3 py-1", ratingColor(store.rating))}>
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
          View on Uber Eats &rarr;
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
