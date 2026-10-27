import React from "react";
import { formatMetric } from "@/lib/promoMetrics";

export default function ChartTooltip({ active, payload, label, metric, avg, labelPrefix = "" }) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => p.value);
  if (!rows.length) return null;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1.5 font-semibold text-popover-foreground">{labelPrefix}{label}</p>
      {rows.map((p) => (
        <div key={p.dataKey || p.name} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto pl-4 font-semibold tabular-nums text-popover-foreground">
            {formatMetric(p.value, metric, { avg })}
          </span>
        </div>
      ))}
    </div>
  );
}