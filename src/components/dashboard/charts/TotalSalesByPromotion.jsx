import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import DrillDownModal from "../DrillDownModal";

const COLORS = ["#16a34a","#22c55e","#4ade80","#86efac","#15803d","#059669","#10b981","#34d399","#065f46","#6ee7b7"];

const formatCurrency = (v) =>
  v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`;

export default function TotalSalesByPromotion({ records, allRecords }) {
  const [modal, setModal] = useState(null);
  const src = allRecords || records;

  const byPromo = {};
  records.forEach(r => {
    if (!r.promotion) return;
    byPromo[r.promotion] = (byPromo[r.promotion] || 0) + (r.total_promotion_sales || 0);
  });

  const data = Object.entries(byPromo)
    .map(([name, total]) => ({ name, total: parseFloat(total.toFixed(2)) }))
    .filter(d => d.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 12);

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-700">Total Sales ($) by Promotion</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={formatCurrency} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(v) => [`$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "Total Sales"]}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]} cursor="pointer"
              onClick={(d) => setModal({ title: `Promotion: ${d.name}`, rows: src.filter(r => r.promotion === d.name) })}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-400 mt-2">Shows total dollar sales generated per promotion. Click a bar to see the underlying records.</p>
      </CardContent>
      <DrillDownModal open={!!modal} onClose={() => setModal(null)} title={modal?.title} records={modal?.rows} />
    </Card>
  );
}