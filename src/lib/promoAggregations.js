import { metricValue } from "@/lib/promoMetrics";

export const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const normKey = (v) => String(v ?? "").trim().toLowerCase();

export function normalizeDay(r) {
  const day = (r.day_of_week || "").trim().split(/\s*&\s*/)[0].trim().toLowerCase();
  return DAY_ORDER.find((d) => d.toLowerCase() === day) || "";
}

export function normalizeApp(r) {
  const raw = (r.mobile_app || "").trim();
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase() : "No App";
}

const round1 = (v) => Math.round(v * 10) / 10;
const bump = (map, label) => map.set(label, (map.get(label) || 0) + 1);
const topLabel = (map) => [...map.entries()].sort((a, b) => b[1] - a[1])[0][0];
const measure = (cell, mode) => (mode === "avg" ? (cell.days.size ? cell.total / cell.days.size : 0) : cell.total);
const sortRows = (rows, order, valueKey) =>
  order ? rows.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name)) : rows.sort((a, b) => b[valueKey] - a[valueKey]);

function addTo(map, key, r, metric) {
  if (!map.has(key)) map.set(key, { total: 0, days: new Set() });
  const cell = map.get(key);
  cell.total += metricValue(r, metric);
  if (r.date_run) cell.days.add(r.date_run);
}

function addLabel(map, key, label) {
  if (!map.has(key)) map.set(key, new Map());
  bump(map.get(key), label);
}

// Single-series ranking. Groups case-insensitively; "avg" = total / distinct days run.
export function rankBy(records, keyFn, metric, { mode, limit, order } = {}) {
  const cells = new Map();
  const labels = new Map();
  records.forEach((r) => {
    const label = String(keyFn(r) ?? "").trim();
    if (!label) return;
    const gk = label.toLowerCase();
    addTo(cells, gk, r, metric);
    addLabel(labels, gk, label);
  });
  const rows = [...cells]
    .map(([gk, c]) => ({ gk, name: topLabel(labels.get(gk)), value: round1(measure(c, mode)) }))
    .filter((d) => d.value > 0);
  const sorted = sortRows(rows, order, "value");
  return limit ? sorted.slice(0, limit) : sorted;
}

// Multi-series breakdown (one row per group, one column per series).
export function breakdownBy(records, keyFn, seriesFn, metric, { mode, limit, order, seriesLimit } = {}) {
  const cells = new Map();
  const groupLabels = new Map();
  const seriesLabels = new Map();
  const seriesTotals = new Map();
  records.forEach((r) => {
    const label = String(keyFn(r) ?? "").trim();
    const sLabel = String(seriesFn(r) ?? "").trim();
    if (!label || !sLabel) return;
    const gk = label.toLowerCase();
    const sk = sLabel.toLowerCase();
    addTo(cells, `${gk}||${sk}`, r, metric);
    addLabel(groupLabels, gk, label);
    addLabel(seriesLabels, sk, sLabel);
    seriesTotals.set(sk, (seriesTotals.get(sk) || 0) + metricValue(r, metric));
  });
  const series = [...seriesTotals.keys()]
    .sort((a, b) => seriesTotals.get(b) - seriesTotals.get(a))
    .slice(0, seriesLimit || undefined)
    .map((key, i) => ({ key, dataKey: `s${i}`, name: topLabel(seriesLabels.get(key)) }));
  const rows = [...groupLabels.keys()]
    .map((gk) => {
      const row = { gk, name: topLabel(groupLabels.get(gk)), total: 0 };
      series.forEach((s) => {
        const c = cells.get(`${gk}||${s.key}`);
        row[s.dataKey] = c ? round1(measure(c, mode)) : 0;
        row.total += row[s.dataKey];
      });
      return row;
    })
    .filter((row) => row.total > 0);
  const sorted = sortRows(rows, order, "total");
  return { data: limit ? sorted.slice(0, limit) : sorted, series };
}

// Long-form rows for summary tables: one row per (A, B) pair.
export function pairRows(records, keyA, keyB, metric) {
  const map = new Map();
  records.forEach((r) => {
    const a = String(keyA(r) ?? "").trim();
    const b = String(keyB(r) ?? "").trim();
    if (!a || !b) return;
    const k = `${a.toLowerCase()}||${b.toLowerCase()}`;
    if (!map.has(k)) map.set(k, { a, b, total: 0, days: new Set() });
    const row = map.get(k);
    row.total += metricValue(r, metric);
    if (r.date_run) row.days.add(r.date_run);
  });
  return [...map.values()]
    .map((r) => ({ ...r, days: r.days.size, avg: r.days.size ? r.total / r.days.size : 0 }))
    .sort((x, y) => y.total - x.total);
}