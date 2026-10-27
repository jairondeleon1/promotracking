import React, { useMemo } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { startOfWeek, addWeeks, format } from "date-fns";
import ChartCard from "./ChartCard";
import ChartTooltip from "./ChartTooltip";
import { METRICS, metricValue, formatMetric } from "@/lib/promoMetrics";
import { AXIS_TICK, GRID_STROKE, CURSOR } from "./chartTheme";

const WEEKS_AHEAD = 6;

// Weekly actuals, 4-week rolling average, and a capped linear trend projection.
function buildForecast(records, metric) {
  const weeks = new Map();
  records.forEach((r) => {
    const v = metricValue(r, metric);
    if (!r._date || !v) return;
    const key = startOfWeek(r._date, { weekStartsOn: 1 }).getTime();
    weeks.set(key, (weeks.get(key) || 0) + v);
  });
  const hist = [...weeks].sort((a, b) => a[0] - b[0]).map(([t, total]) => ({ date: new Date(t), total }));
  if (!hist.length) return [];

  const totals = hist.map((w) => w.total);
  const rolling = totals.map((_, i) => {
    const slice = totals.slice(Math.max(0, i - 3), i + 1);
    return slice.reduce((s, v) => s + v, 0) / slice.length;
  });
  const recent = hist.slice(-Math.min(8, hist.length));
  const n = recent.length;
  const xMean = (n - 1) / 2;
  const yMean = recent.reduce((s, w) => s + w.total, 0) / n;
  let slope = 0;
  if (n > 1) {
    const num = recent.reduce((s, w, i) => s + (i - xMean) * (w.total - yMean), 0);
    const den = recent.reduce((s, _, i) => s + (i - xMean) ** 2, 0);
    slope = den ? num / den : 0;
  }
  slope = Math.max(Math.min(slope, yMean * 0.15), -yMean * 0.15);
  const base = recent[n - 1].total || yMean;
  const last = hist[hist.length - 1].date;

  return [
    ...hist.map((w, i) => ({ week: format(w.date, "MMM d"), actual: Math.round(w.total), rollingAvg: Math.round(rolling[i]) })),
    ...Array.from({ length: WEEKS_AHEAD }, (_, i) => ({
      week: format(addWeeks(last, i + 1), "MMM d"),
      projected: Math.max(0, Math.round(base + slope * (i + 1))),
    })),
  ];
}

export default function ForecastChart({ records, metric }) {
  const data = useMemo(() => buildForecast(records, metric), [records, metric]);
  const m = METRICS[metric];
  const split = data.filter((d) => d.actual != null).pop()?.week;
  const badge = (
    <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">AI Forecast</span>
  );

  return (
    <ChartCard
      title={`${m.noun} Forecast — Next ${WEEKS_AHEAD} Weeks`}
      description="Weekly results with a trend projection. Faded bars are the forecast."
      badge={badge}
      isEmpty={!data.length}
    >
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="week" tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={56}
            tickFormatter={(v) => formatMetric(v, metric, { compact: true })} />
          <Tooltip cursor={CURSOR} content={<ChartTooltip metric={metric} labelPrefix="Week of " />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          {split && (
            <ReferenceLine x={split} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4"
              label={{ value: "Latest", position: "top", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          )}
          <Bar dataKey="actual" name={`Actual ${m.short}`} stackId="week" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="projected" name={`Projected ${m.short}`} stackId="week" fill="hsl(var(--chart-1))" fillOpacity={0.3} radius={[4, 4, 0, 0]} />
          <Line dataKey="rollingAvg" name="4-Week Avg" stroke="hsl(var(--chart-2))" strokeWidth={2.5} dot={false} type="monotone" />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}