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
