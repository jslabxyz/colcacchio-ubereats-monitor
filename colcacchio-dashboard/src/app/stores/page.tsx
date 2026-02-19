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
