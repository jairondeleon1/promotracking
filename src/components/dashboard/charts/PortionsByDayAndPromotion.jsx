import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const DAY_ORDER = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const COLORS = ["#2563eb","#16a34a","#d97706","#dc2626","#7c3aed","#0891b2","#db2777","#0d9488","#b45309","#1e40af"];

export default function PortionsByDayAndPromotion({ records }) {
  const promos = [...new Set(records.map(r => r.promotion).filter(Boolean))].slice(0, 8);
  const byDayPromo = {};
  DAY_ORDER.forEach(d => { byDayPromo[d] = {}; promos.forEach(p => { byDayPromo[d][p] = 0; }); });

  records.forEach(r => {
    if (!r.day_of_week || !r.portions_sold || !r.promotion) return;
    const day = r.day_of_week.trim().split(/\s*&\s*/)[0].trim();
    const normalized = DAY_ORDER.find(d => d.toLowerCase() === day.toLowerCase());
    if (normalized && promos.includes(r.promotion)) {
      byDayPromo[normalized][r.promotion] += r.portions_sold || 0;
    }
  });

  const data = DAY_ORDER.map(day => {
    const row = { day: day.slice(0, 3) };
    promos.forEach(p => { row[p] = byDayPromo[day][p] || 0; });
    return row;
  }).filter(d => promos.some(p => d[p] > 0));

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-700">Total Portions by Day of Week &amp; Promotion</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748b" }} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {promos.map((p, i) => (
              <Bar key={p} dataKey={p} fill={COLORS[i % COLORS.length]} radius={[2, 2, 0, 0]} stackId="a" />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}