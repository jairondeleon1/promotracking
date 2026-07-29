import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import DrillDownModal from "../DrillDownModal";

export default function PortionsByBusinessType({ records, allRecords }) {
  const [modal, setModal] = useState(null);
  const src = allRecords || records;
  const byType = {};

  records.forEach(r => {
    const type = (r.business_type || "").trim();
    if (!type || !r.portions_sold) return;
    byType[type] = (byType[type] || 0) + r.portions_sold;
  });

  const data = Object.entries(byType)
    .map(([type, total]) => ({ type, total }))
    .sort((a, b) => b.total - a.total);

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-700">Total Portions Sold by Business Type</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="type" tick={{ fontSize: 11, fill: "#64748b" }} interval={0} angle={-15} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [v, "Portions"]} />
            <Bar dataKey="total" radius={[4, 4, 0, 0]} cursor="pointer"
              onClick={(d) => {
                setModal({ title: `Business Type: ${d.type}`, rows: src.filter(r => (r.business_type || "").trim() === d.type) });
              }}>
              {data.map((_, i) => (
                <Cell key={i} fill={i === data.reduce((mi, d, di) => d.total > data[mi].total ? di : mi, 0) ? "#2563eb" : "#93c5fd"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-400 px-6 pb-4">Shows which business types generate the most portions sold. Click a bar to see records.</p>
      </CardContent>
      <DrillDownModal open={!!modal} onClose={() => setModal(null)} title={modal?.title} records={modal?.rows} />
    </Card>
  );
}