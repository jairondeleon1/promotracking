import { UtensilsCrossed, DollarSign, Megaphone, Store, Smartphone } from "lucide-react";
import { normKey } from "@/lib/promoAggregations";
import { formatMetric } from "@/lib/promoMetrics";

export const KPI_WIDGETS = [
  { id: "kpi_portions", label: "Total Portions Sold", icon: UtensilsCrossed, tone: "bg-chart-1/15 text-chart-1" },
  { id: "kpi_sales", label: "Total Sales", icon: DollarSign, tone: "bg-chart-2/15 text-chart-2" },
  { id: "kpi_promotions", label: "Blueprint Promotions", icon: Megaphone, tone: "bg-chart-6/15 text-chart-6" },
  { id: "kpi_marketplaces", label: "Marketplaces Active", icon: Store, tone: "bg-chart-5/15 text-chart-5" },
  { id: "kpi_app_rate", label: "App Promotion Rate", icon: Smartphone, tone: "bg-chart-4/15 text-chart-4" },
];

const distinct = (records, field) => new Set(records.map((r) => normKey(r[field])).filter(Boolean)).size;

export function computeKpis(records) {
  const runs = records.length;
  const portions = records.reduce((s, r) => s + (r.portions_sold || 0), 0);
  const sales = records.reduce((s, r) => s + (r.total_promotion_sales || 0), 0);
  const onApp = records.filter((r) => (r.promoted_on_app || "").toLowerCase() === "yes").length;
  return {
    kpi_portions: { value: formatMetric(portions, "portions"), caption: `${runs.toLocaleString()} promotion runs` },
    kpi_sales: { value: formatMetric(sales, "sales"), caption: runs ? `${formatMetric(sales / runs, "sales")} avg per run` : "No runs" },
    kpi_promotions: { value: distinct(records, "promotion").toLocaleString(), caption: "Unique promotions run" },
    kpi_marketplaces: { value: distinct(records, "marketplace").toLocaleString(), caption: `Across ${distinct(records, "region")} regions` },
    kpi_app_rate: { value: `${runs ? Math.round((onApp / runs) * 100) : 0}%`, caption: "Of runs promoted on the app" },
  };
}