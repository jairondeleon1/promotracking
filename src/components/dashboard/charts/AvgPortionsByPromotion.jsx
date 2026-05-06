import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const PALETTE = [
  "#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed",
  "#0891b2", "#db2777", "#65a30d", "#9333ea", "#0d9488",
];

export default function AvgPortionsByPromotion({ records }) {
  // Group by promotion + region, count unique days per (promo+region) combo
  const byPromoRegion = {};
  records.forEach(r => {
    const promo = r.promotion || "Unknown";
    const region = r.region || "Unknown";
    const key = `${promo}||${region}`;
    if (!byPromoRegion[key]) {
      byPromoRegion[key] = { promo, region, total: 0, days: new Set() };
    }
    byPromoRegion[key].total += r.portions_sold || 0;
    if (r.date_run) byPromoRegion[key].days.add(r.date_run);
  });

  const regions = [...new Set(Object.values(byPromoRegion).map(v => v.region))].sort();
  const promos = [...new Set(Object.values(byPromoRegion).map(v => v.promo))];

  const data = promos.map(promo => {
    const row = { name: promo };
    regions.forEach(region => {
      const entry = byPromoRegion[`${promo}||${region}`];
      row[region] = entry && entry.days.size > 0
        ? parseFloat((entry.total / entry.days.size).toFixed(1))
        : 0;
    });
    return row;
  }).sort((a, b) => {
    const sumA = regions.reduce((s, r) => s + (a[r] || 0), 0);
    const sumB = regions.reduce((s, r) => s + (b[r] || 0), 0);
    return sumB - sumA;
  }).slice(0, 12);

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-700">Avg Portions/Day by Promotion &amp; Division</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 100 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fill: "#64748b" }}
              angle={-45}
              textAnchor="end"
              interval={0}
              height={100}
            />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            {regions.map((region, i) => (
              <Bar
                key={region}
                dataKey={region}
                stackId="a"
                fill={PALETTE[i % PALETTE.length]}
                radius={i === regions.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}