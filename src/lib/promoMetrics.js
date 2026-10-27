export const METRICS = {
  portions: { id: "portions", label: "Portions", noun: "Portions Sold", short: "Portions" },
  sales: { id: "sales", label: "Sales ($)", noun: "Sales ($)", short: "Sales ($)" },
};

export const metricValue = (r, metric) =>
  Number(metric === "sales" ? r.total_promotion_sales : r.portions_sold) || 0;

const compactFormat = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export function formatMetric(v, metric, { compact = false, avg = false } = {}) {
  const n = Number(v) || 0;
  const digits = avg ? (metric === "sales" ? 2 : 1) : 0;
  const body = compact ? compactFormat.format(n) : n.toLocaleString("en-US", { maximumFractionDigits: digits });
  return metric === "sales" ? `$${body}` : body;
}