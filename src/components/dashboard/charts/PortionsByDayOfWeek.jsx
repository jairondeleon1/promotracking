import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const DAY_ORDER = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

export default function PortionsByDayOfWeek({ records }) {
  const byDay = {};
  DAY_ORDER.forEach(d => { byDay[d] = 0; });

  records.forEach(r => {
    if (!r.day_of_week || !r.portions_sold) return;
    const day = r.day_of_week.trim().split(/\s*&\s*/)[0].trim();
    const normalized = DAY_ORDER.find(d => d.toLowerCase() === day.toLowerCase());
    if (normalized) byDay[normalized] += r.portions_sold || 0;
  });

  const data = DAY_ORDER.map(day => ({ day: day.slice(0, 3), total: byDay[day] })).filter(d => d.total > 0);

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-700">Total Portions Sold by Day of Week</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748b" }} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [v, "Portions"]} />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={i === data.reduce((mi, d, di) => d.total > data[mi].total ? di : mi, 0) ? "#2563eb" : "#93c5fd"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}