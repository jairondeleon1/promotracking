import React, { useMemo, useState } from "react";
import ChartCard from "./ChartCard";
import { pairRows, normalizeApp } from "@/lib/promoAggregations";
import { METRICS, formatMetric } from "@/lib/promoMetrics";
import { cn } from "@/lib/utils";

const VIEWS = [
  { id: "promotion", label: "By Promotion & Division", cols: ["Promotion", "Division / Region"], keyA: (r) => r.promotion, keyB: (r) => r.region },
  { id: "marketplace", label: "By Marketplace & App", cols: ["Marketplace", "Mobile App"], keyA: (r) => r.marketplace, keyB: normalizeApp },
];

export default function SummaryTables({ records, metric }) {
  const [viewId, setViewId] = useState("promotion");
  const view = VIEWS.find((v) => v.id === viewId);
  const rows = useMemo(() => pairRows(records, view.keyA, view.keyB, metric), [records, view, metric]);
  const m = METRICS[metric];
  const headers = [...view.cols, `Total ${m.short}`, `Avg ${m.short}/Day`, "Days Run"];

  const toggle = (
    <div className="flex shrink-0 gap-1 rounded-lg bg-muted p-1">
      {VIEWS.map((v) => (
        <button key={v.id} onClick={() => setViewId(v.id)}
          className={cn("rounded-md px-3 py-1 text-xs font-medium transition-colors",
            viewId === v.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          {v.label}
        </button>
      ))}
    </div>
  );

  return (
    <ChartCard title="Detailed Summary Tables" description={`${rows.length} rows, sorted by total.`} badge={toggle} isEmpty={!rows.length}>
      <div className="max-h-[440px] overflow-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-muted">
            <tr>
              {headers.map((h, i) => (
                <th key={h} className={cn("whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground", i > 1 ? "text-right" : "text-left")}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={`${row.a}|${row.b}`} className="hover:bg-muted/50">
                <td className="px-4 py-2.5 font-medium">{row.a}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{row.b}</td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-accent-foreground">{formatMetric(row.total, metric)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{formatMetric(row.avg, metric, { avg: true })}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{row.days}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}