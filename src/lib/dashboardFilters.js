import { normKey } from "@/lib/promoAggregations";
import { resolveRange, rangeLabel } from "@/lib/dateRanges";

export const CLEARED_FILTERS = {
  range: { preset: "all", from: null, to: null },
  batch: "all",
  marketplaces: [],
  regions: [],
  promotions: [],
};

export const DEFAULT_VIEW = { ...CLEARED_FILTERS, metric: "portions", hidden: [] };

export const hasActiveFilters = (v) =>
  v.range.preset !== "all" || v.batch !== "all" || v.marketplaces.length > 0 || v.regions.length > 0 || v.promotions.length > 0;

// Case-insensitive option list for a field, labelled with the most common spelling.
export function buildOptions(records, field) {
  const groups = new Map();
  records.forEach((r) => {
    const label = String(r[field] ?? "").trim();
    if (!label) return;
    const key = label.toLowerCase();
    if (!groups.has(key)) groups.set(key, { value: key, count: 0, labels: new Map() });
    const g = groups.get(key);
    g.count += 1;
    g.labels.set(label, (g.labels.get(label) || 0) + 1);
  });
  return [...groups.values()]
    .map((g) => ({ value: g.value, count: g.count, label: [...g.labels].sort((a, b) => b[1] - a[1])[0][0] }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

// Unique upload batches, newest first (records arrive sorted by -created_date).
export function getBatches(records) {
  const seen = new Set();
  const list = [];
  records.forEach((r) => {
    if (r.upload_batch_id && !seen.has(r.upload_batch_id)) {
      seen.add(r.upload_batch_id);
      list.push({ id: r.upload_batch_id, label: r.upload_month || r.upload_batch_id });
    }
  });
  return list;
}

export function applyFilters(records, view) {
  const { from, to } = resolveRange(view.range);
  const sets = { marketplace: new Set(view.marketplaces), region: new Set(view.regions), promotion: new Set(view.promotions) };
  return records.filter((r) => {
    if (view.batch !== "all" && r.upload_batch_id !== view.batch) return false;
    if (from && !(r._date && r._date >= from)) return false;
    if (to && !(r._date && r._date <= to)) return false;
    return Object.entries(sets).every(([field, set]) => !set.size || set.has(normKey(r[field])));
  });
}

const pick = (selected, opts, word) => {
  if (!selected.length) return null;
  if (selected.length === 1) return opts.find((o) => o.value === selected[0])?.label || `1 ${word}`;
  return `${selected.length} ${word}s`;
};

export function describeView(view, batches, options, separator) {
  return [
    view.range.preset !== "all" ? rangeLabel(view.range) : null,
    view.batch !== "all" ? batches.find((b) => b.id === view.batch)?.label : null,
    pick(view.marketplaces, options.marketplaces, "marketplace"),
    pick(view.regions, options.regions, "region"),
    pick(view.promotions, options.promotions, "promotion"),
  ].filter(Boolean).join(separator);
}