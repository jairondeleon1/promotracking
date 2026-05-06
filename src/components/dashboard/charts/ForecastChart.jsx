import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from "recharts";

const WEEKS_AHEAD = 6;

function getWeekLabel(date) {
  const d = new Date(date);
  const month = d.toLocaleString("default", { month: "short" });
  const day = d.getDate();
  return `${month} ${day}`;
}

function startOfWeek(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addWeeks(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n * 7);
  return d;
}

export default function ForecastChart({ records }) {
  const data = useMemo(() => {
    if (!records || records.length === 0) return [];

    // ── Historical: group portions by week ──
    const weekMap = {};
    records.forEach(r => {
      if (!r.date_run || !r.portions_sold) return;
      const weekStart = startOfWeek(r.date_run);
      const key = weekStart.toISOString();
      if (!weekMap[key]) weekMap[key] = { date: weekStart, total: 0, count: 0, promos: new Set() };
      weekMap[key].total += r.portions_sold;
      weekMap[key].count += 1;
      if (r.promotion) weekMap[key].promos.add(r.promotion);
    });

    const historicalWeeks = Object.values(weekMap)
      .sort((a, b) => a.date - b.date);

    if (historicalWeeks.length === 0) return [];

    // ── Rolling average (last 4 weeks) to smooth trend ──
    const WINDOW = 4;
    const totals = historicalWeeks.map(w => w.total);
    const rollingAvg = totals.map((_, i) => {
      const slice = totals.slice(Math.max(0, i - WINDOW + 1), i + 1);
      return slice.reduce((s, v) => s + v, 0) / slice.length;
    });

    // ── Weekly growth trend (simple linear regression on recent window) ──
    const recentWindow = Math.min(8, historicalWeeks.length);
    const recent = historicalWeeks.slice(-recentWindow);
    const n = recent.length;
    const xMean = (n - 1) / 2;
    const yMean = recent.reduce((s, w) => s + w.total, 0) / n;
    let slope = 0;
    if (n > 1) {
      const num = recent.reduce((s, w, i) => s + (i - xMean) * (w.total - yMean), 0);
      const den = recent.reduce((s, _, i) => s + Math.pow(i - xMean, 2), 0);
      slope = den !== 0 ? num / den : 0;
    }
    // Cap slope to avoid runaway projections
    const avgTotal = yMean;
    slope = Math.max(Math.min(slope, avgTotal * 0.15), -avgTotal * 0.15);

    const baseValue = recent[recent.length - 1]?.total || avgTotal;
    const lastWeekDate = historicalWeeks[historicalWeeks.length - 1].date;

    // ── Build chart data ──
    const historicalData = historicalWeeks.map((w, i) => ({
      week: getWeekLabel(w.date),
      actual: w.total,
      rollingAvg: Math.round(rollingAvg[i]),
      type: "historical",
    }));

    const forecastData = Array.from({ length: WEEKS_AHEAD }, (_, i) => {
      const forecastDate = addWeeks(lastWeekDate, i + 1);
      const projected = Math.max(0, Math.round(baseValue + slope * (i + 1)));
      return {
        week: getWeekLabel(forecastDate),
        projected,
        type: "forecast",
      };
    });

    return [...historicalData, ...forecastData];
  }, [records]);

  const splitIndex = data.findLastIndex(d => d.type === "historical");
  const splitWeek = data[splitIndex]?.week;

  if (data.length === 0) return null;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-semibold text-slate-700 mb-1">Week of {label}</p>
        {payload.map(p => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {p.value?.toLocaleString()}
          </p>
        ))}
      </div>
    );
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-700">
              Portions Sold Forecast — Next {WEEKS_AHEAD} Weeks
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Based on historical weekly performance with trend projection. Dashed line = forecast.
            </p>
          </div>
          <span className="text-xs bg-blue-50 text-blue-600 font-medium px-2 py-1 rounded-full border border-blue-100">
            AI Forecast
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 9, fill: "#64748b" }}
              angle={-40}
              textAnchor="end"
              height={70}
              interval={0}
            />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />

            {splitWeek && (
              <ReferenceLine
                x={splitWeek}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                label={{ value: "Today", position: "top", fontSize: 10, fill: "#94a3b8" }}
              />
            )}

            <Bar dataKey="actual" name="Actual Portions" fill="#2563eb" radius={[2, 2, 0, 0]} opacity={0.85} />
            <Bar dataKey="projected" name="Projected Portions" fill="#bfdbfe" radius={[2, 2, 0, 0]} opacity={0.9} />
            <Line
              dataKey="rollingAvg"
              name="4-Week Avg"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              type="monotone"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}