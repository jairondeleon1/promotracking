import React, { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import ChartCard from "./ChartCard";
import ChartTooltip from "./ChartTooltip";
import DrillDownModal from "../DrillDownModal";
import { rankBy, normKey } from "@/lib/promoAggregations";
import { METRICS, formatMetric } from "@/lib/promoMetrics";
import { AXIS_TICK, GRID_STROKE, CURSOR, truncate } from "./chartTheme";

export default function RankedChart({ config, records, allRecords, metric }) {
  const [drill, setDrill] = useState(null);
  const data = useMemo(() => rankBy(records, config.groupBy, metric, config), [records, metric, config]);
  const horizontal = config.layout !== "vertical";
  const avg = config.mode === "avg";
  const top = Math.max(0, ...data.map((d) => d.value));
  const valueTick = (v) => formatMetric(v, metric, { compact: true });

  const open = (row) =>
    setDrill({ title: config.drillTitle(row.name), rows: allRecords.filter((r) => normKey(config.groupBy(r)) === row.gk) });

  return (
    <ChartCard title={config.title(METRICS[metric])} description={config.description} isEmpty={!data.length}>
      <ResponsiveContainer width="100%" height={horizontal ? Math.max(140, data.length * 30 + 30) : 260}>
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
          <Bar
            dataKey="value" name={avg ? "Avg per day" : METRICS[metric].short} fill={config.color}
            radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]} maxBarSize={36} cursor="pointer"
            onClick={(d) => open(d.payload || d)}
          >
            {data.map((d) => (
              <Cell key={d.gk} fill={config.color} fillOpacity={config.highlightTop && d.value !== top ? 0.4 : 1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <DrillDownModal open={!!drill} onClose={() => setDrill(null)} title={drill?.title} records={drill?.rows} />
    </ChartCard>
  );
}