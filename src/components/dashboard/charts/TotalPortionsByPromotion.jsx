import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import DrillDownModal from "../DrillDownModal";

const COLORS = ["#2563eb","#3b82f6","#60a5fa","#93c5fd","#1d4ed8","#4f46e5","#6366f1","#818cf8","#0ea5e9","#38bdf8"];

export default function TotalPortionsByPromotion({ records, allRecords }) {
  const [modal, setModal] = useState(null);
  const src = allRecords || records;
  const byPromo = {};
  records.forEach(r => {
    if (!r.promotion) return;
    if (!byPromo[r.promotion]) byPromo[r.promotion] = { total: 0, regions: new Set() };
    byPromo[r.promotion].total += r.portions_sold || 0;
    byPromo[r.promotion].regions.add(r.region || "Unknown");
  });

  const data = Object.entries(byPromo)
    .map(([name, v]) => ({ name, total: v.total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 12);

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-700">Total Portions Sold by Promotion</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [v, "Portions"]} />
            <Bar dataKey="total" radius={[4, 4, 0, 0]} cursor="pointer"
              onClick={(d) => setModal({ title: `Promotion: ${d.name}`, rows: src.filter(r => r.promotion === d.name) })}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
      <p className="text-xs text-slate-400 px-6 pb-4">Shows which promotions drove the highest total volume of portions sold. Click a bar to see the underlying records.</p>
      <DrillDownModal open={!!modal} onClose={() => setModal(null)} title={modal?.title} records={modal?.rows} />
    </Card>
  );
}