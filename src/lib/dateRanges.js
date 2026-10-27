import { subDays, subMonths, startOfYear, startOfDay, endOfDay, format } from "date-fns";

export const RANGE_PRESETS = [
  { id: "all", label: "All time" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "6m", label: "Last 6 months" },
  { id: "ytd", label: "Year to date" },
  { id: "custom", label: "Custom range" },
];

export function resolveRange(range) {
  const today = new Date();
  switch (range.preset) {
    case "30d": return { from: startOfDay(subDays(today, 29)), to: endOfDay(today) };
    case "90d": return { from: startOfDay(subDays(today, 89)), to: endOfDay(today) };
    case "6m": return { from: startOfDay(subMonths(today, 6)), to: endOfDay(today) };
    case "ytd": return { from: startOfYear(today), to: endOfDay(today) };
    case "custom": {
      if (!range.from) return { from: null, to: null };
      const from = new Date(range.from);
      return { from: startOfDay(from), to: endOfDay(range.to ? new Date(range.to) : from) };
    }
    default: return { from: null, to: null };
  }
}

export function rangeLabel(range) {
  if (range.preset === "custom" && range.from) {
    const from = new Date(range.from);
    const to = range.to ? new Date(range.to) : from;
    const sameYear = from.getFullYear() === to.getFullYear();
    return `${format(from, sameYear ? "MMM d" : "MMM d, yyyy")} – ${format(to, "MMM d, yyyy")}`;
  }
  return RANGE_PRESETS.find((p) => p.id === range.preset)?.label || "All time";
}