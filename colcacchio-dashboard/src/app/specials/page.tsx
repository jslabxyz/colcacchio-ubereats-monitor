import { getDashboardData } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SpecialsPage() {
  const { stores } = getDashboardData();

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

  const storesWithNoSpecials = stores.filter((s) => s.specials.length === 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Specials</h1>

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
                  <Badge key={name} variant="outline" className="text-xs">{name}</Badge>
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

      {storesWithNoSpecials.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle>Stores with No Active Specials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {storesWithNoSpecials.map((s) => (
                <Badge key={s.slug} variant="destructive">{s.name}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
