import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";

const REGION_COLORS = {
  "DVR": "#2563eb",
  "NE": "#16a34a",
  "J&J/Kenvue": "#d97706",
  "SE": "#dc2626",
  "MW": "#7c3aed",
  "SW": "#0891b2",
  "Unknown": "#94a3b8",
};

function getColor(region) {
  return REGION_COLORS[region] || "#94a3b8";
}

export default function AvgPortionsByPromotion({ records }) {
  // Group by promotion + region, count unique days
  const byPromoRegion = {};
  records.forEach(r => {
    const key = `${r.promotion}||${r.region || "Unknown"}`;
    if (!byPromoRegion[key]) byPromoRegion[key] = { promo: r.promotion, region: r.region || "Unknown", total: 0, days: new Set() };
    byPromoRegion[key].total += r.portions_sold || 0;
    byPromoRegion[key].days.add(r.date_run);
  });

  const regions = [...new Set(Object.values(byPromoRegion).map(v => v.region))];
  const promos = [...new Set(Object.values(byPromoRegion).map(v => v.promo))];

  const data = promos.map(promo => {
    const row = { name: promo };
    regions.forEach(region => {
      const key = `${promo}||${region}`;
      const entry = byPromoRegion[key];
      if (entry && entry.days.size > 0) {
        row[region] = parseFloat((entry.total / entry.days.size).toFixed(1));
      } else {
        row[region] = 0;
      }
    });
    return row;
  }).sort((a, b) => {
    const totalA = regions.reduce((s, r) => s + (a[r] || 0), 0);
    const totalB = regions.reduce((s, r) => s + (b[r] || 0), 0);
    return totalB - totalA;
  }).slice(0, 10);

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-700">Avg Portions/Day by Promotion &amp; Division</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
            {regions.map(region => (
              <Bar key={region} dataKey={region} fill={getColor(region)} radius={[3, 3, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}