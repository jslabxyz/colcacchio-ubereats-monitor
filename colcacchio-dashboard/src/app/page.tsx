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
