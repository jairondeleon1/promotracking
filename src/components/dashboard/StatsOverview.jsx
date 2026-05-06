import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, ShoppingBag, BarChart2, Smartphone } from "lucide-react";
import TotalPortionsByPromotion from "./charts/TotalPortionsByPromotion";
import AvgPortionsByPromotion from "./charts/AvgPortionsByPromotion";
import PortionsByDayOfWeek from "./charts/PortionsByDayOfWeek";
import PortionsByDayAndPromotion from "./charts/PortionsByDayAndPromotion";
import PortionsByMarketplaceAndApp from "./charts/PortionsByMarketplaceAndApp";
import AvgPortionsByMarketplaceAndApp from "./charts/AvgPortionsByMarketplaceAndApp";
import TopMarketplacesTable from "./charts/TopMarketplacesTable";

export default function StatsOverview({ records, allRecords }) {
  const totalPortions = records.reduce((s, r) => s + (r.portions_sold || 0), 0);
  const uniquePromos = new Set(records.map(r => r.promotion)).size;
  const uniqueMarketplaces = new Set(records.map(r => r.marketplace)).size;
  const appPromoRate = records.length > 0
    ? Math.round((records.filter(r => (r.promoted_on_app || "").toLowerCase() === "yes").length / records.length) * 100)
    : 0;

  const stats = [
    { label: "Total Portions Sold", value: totalPortions.toLocaleString(), icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Unique Promotions", value: uniquePromos, icon: ShoppingBag, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Marketplaces Active", value: uniqueMarketplaces, icon: BarChart2, color: "text-slate-600", bg: "bg-slate-100" },
    { label: "App Promotion Rate", value: `${appPromoRate}%`, icon: Smartphone, color: "text-cyan-600", bg: "bg-cyan-50" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-slate-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-2.5 rounded-xl ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TotalPortionsByPromotion records={records} />
        <AvgPortionsByPromotion records={records} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PortionsByDayOfWeek records={records} />
        <PortionsByDayAndPromotion records={records} />
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PortionsByMarketplaceAndApp records={records} />
        <AvgPortionsByMarketplaceAndApp records={records} />
      </div>

      {/* Table */}
      <TopMarketplacesTable records={records} allRecords={allRecords} />
    </div>
  );
}