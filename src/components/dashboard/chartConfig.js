import RankedChart from "./charts/RankedChart";
import BreakdownChart from "./charts/BreakdownChart";
import ForecastChart from "./charts/ForecastChart";
import SummaryTables from "./charts/SummaryTables";
import { DAY_ORDER, normalizeDay, normalizeApp, normKey } from "@/lib/promoAggregations";

const color = (n) => `hsl(var(--chart-${n}))`;
const shortDay = (d) => d.slice(0, 3);

export const CHART_SECTIONS = [
  {
    id: "promotions", title: "Promotions", description: "Which promotions are driving results",
    charts: [
      {
        id: "promo_totals", label: "Totals by promotion", Component: RankedChart,
        title: (m) => `Total ${m.noun} by Promotion`, description: "Top 12 promotions. Click a bar to see its records.",
        groupBy: (r) => r.promotion, limit: 12, color: color(1), drillTitle: (g) => `Promotion: ${g}`,
      },
      {
        id: "promo_division", label: "Avg per day by promotion & division", Component: BreakdownChart,
        title: (m) => `Avg ${m.short}/Day by Promotion & Division`, description: "Average per day each promotion ran, split by division.",
        groupBy: (r) => r.promotion, seriesBy: (r) => r.region, mode: "avg", stacked: true, limit: 12,
        drillTitle: (g) => `Promotion: ${g}`,
      },
    ],
  },
  {
    id: "timing", title: "Timing", description: "When promotions perform best",
    charts: [
      {
        id: "day_totals", label: "Totals by day of week", Component: RankedChart,
        title: (m) => `Total ${m.noun} by Day of Week`, description: "The strongest day is highlighted.",
        groupBy: normalizeDay, order: DAY_ORDER, layout: "vertical", highlightTop: true, color: color(4),
        tickFormatter: shortDay, drillTitle: (g) => `Day: ${g}`,
      },
      {
        id: "day_promotion", label: "Day of week by promotion", Component: BreakdownChart,
        title: (m) => `Total ${m.short} by Day of Week & Promotion`, description: "How the top 8 promotions perform across the week.",
        groupBy: normalizeDay, seriesBy: (r) => r.promotion, order: DAY_ORDER, seriesLimit: 8, stacked: true,
        layout: "vertical", tickFormatter: shortDay,
        drillTitle: (g, s) => `${s} — ${g}`,
        drillFilter: (g, s) => (r) => normKey(normalizeDay(r)) === g && normKey(r.promotion) === s,
      },
    ],
  },
  {
    id: "marketplaces", title: "Marketplaces", description: "Where promotions sell, by mobile app",
    charts: [
      {
        id: "mkt_totals", label: "Totals by marketplace & app", Component: BreakdownChart,
        title: (m) => `Total ${m.short} by Marketplace & Mobile App`, description: "Top 12 marketplaces. Click a bar to see its records.",
        groupBy: (r) => r.marketplace, seriesBy: normalizeApp, stacked: true, limit: 12,
        drillTitle: (g) => `Marketplace: ${g}`,
      },
      {
        id: "mkt_avg", label: "Avg per day by marketplace & app", Component: BreakdownChart,
        title: (m) => `Avg ${m.short}/Day by Marketplace & Mobile App`, description: "Average per promotion day, top 12 marketplaces.",
        groupBy: (r) => r.marketplace, seriesBy: normalizeApp, mode: "avg", stacked: true, limit: 12,
        drillTitle: (g) => `Marketplace: ${g}`,
      },
    ],
  },
  {
    id: "segments", title: "Segments", description: "Performance by business type and recipe",
    charts: [
      {
        id: "business_type", label: "Totals by business type", Component: RankedChart,
        title: (m) => `Total ${m.noun} by Business Type`, description: "The top business type is highlighted.",
        groupBy: (r) => r.business_type, highlightTop: true, color: color(2), drillTitle: (g) => `Business Type: ${g}`,
      },
      {
        id: "recipe_run", label: "Totals by recipe run", Component: RankedChart,
        title: (m) => `Total ${m.noun} by Recipe Run`, description: "Top 12 recipe runs.",
        groupBy: (r) => r.recipe_run, limit: 12, highlightTop: true, color: color(5), drillTitle: (g) => `Recipe Run: ${g}`,
      },
    ],
  },
  {
    id: "outlook", title: "Outlook", description: "Where the trend is heading",
    charts: [{ id: "forecast", label: "Forecast", Component: ForecastChart, wide: true }],
  },
  {
    id: "details", title: "Details", description: "Full breakdown tables",
    charts: [{ id: "summary_tables", label: "Summary tables", Component: SummaryTables, wide: true }],
  },
];