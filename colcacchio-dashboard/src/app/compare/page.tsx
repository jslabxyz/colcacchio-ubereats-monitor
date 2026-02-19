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
