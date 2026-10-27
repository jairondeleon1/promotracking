import React, { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import ChartCard from "./ChartCard";
import ChartTooltip from "./ChartTooltip";
import DrillDownModal from "../DrillDownModal";
import { breakdownBy, normKey } from "@/lib/promoAggregations";
import { METRICS, formatMetric } from "@/lib/promoMetrics";
import { AXIS_TICK, GRID_STROKE, CURSOR, seriesColor, truncate } from "./chartTheme";

export default function BreakdownChart({ config, records, allRecords, metric }) {
  const [drill, setDrill] = useState(null);
  const { data, series } = useMemo(
    () => breakdownBy(records, config.groupBy, config.seriesBy, metric, config),
    [records, metric, config]
  );
  const horizontal = config.layout !== "vertical";
  const avg = config.mode === "avg";
  const valueTick = (v) => formatMetric(v, metric, { compact: true });

  const open = (row, s) => {
    const filter = config.drillFilter
      ? config.drillFilter(row.gk, s.key)
      : (r) => normKey(config.groupBy(r)) === row.gk;
    setDrill({ title: config.drillTitle(row.name, s.name), rows: allRecords.filter(filter) });
  };

  return (
    <ChartCard title={config.title(METRICS[metric])} description={config.description} isEmpty={!data.length}>
      <ResponsiveContainer width="100%" height={horizontal ? data.length * 30 + 110 : 320}>
        <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" horizontal={!horizontal} vertical={horizontal} />
          <XAxis
            type={horizontal ? "number" : "category"} dataKey={horizontal ? undefined : "name"}
            tick={AXIS_TICK} tickLine={false} axisLine={false}
            tickFormatter={horizontal ? valueTick : config.tickFormatter}
          />
          <YAxis
            type={horizontal ? "category" : "number"} dataKey={horizontal ? "name" : undefined}
            tick={AXIS_TICK} tickLine={false} axisLine={false} width={horizontal ? 140 : 52}
            interval={horizontal ? 0 : "preserveEnd"}
            tickFormatter={horizontal ? (v) => truncate(v) : valueTick}
          />
          <Tooltip cursor={CURSOR} content={<ChartTooltip metric={metric} avg={avg} />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
          {series.map((s, i) => (
            <Bar
              key={s.key} dataKey={s.dataKey} name={s.name} fill={seriesColor(s.key, i)}
              stackId={config.stacked ? "stack" : undefined} maxBarSize={36} cursor="pointer"
              onClick={(d) => open(d.payload || d, s)}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <DrillDownModal open={!!drill} onClose={() => setDrill(null)} title={drill?.title} records={drill?.rows} />
    </ChartCard>
  );
}