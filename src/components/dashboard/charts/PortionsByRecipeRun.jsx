import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import DrillDownModal from "../DrillDownModal";

export default function PortionsByRecipeRun({ records, allRecords }) {
  const [modal, setModal] = useState(null);
  const src = allRecords || records;
  const byRecipe = {};

  records.forEach(r => {
    const recipe = (r.recipe_run || "").trim();
    if (!recipe || !r.portions_sold) return;
    byRecipe[recipe] = (byRecipe[recipe] || 0) + r.portions_sold;
  });

  const data = Object.entries(byRecipe)
    .map(([recipe, total]) => ({ recipe, total }))
    .sort((a, b) => b.total - a.total);

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-700">Total Portions Sold by Recipe Run</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="recipe" tick={{ fontSize: 10, fill: "#64748b" }} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [v, "Portions"]} />
            <Bar dataKey="total" radius={[4, 4, 0, 0]} cursor="pointer"
              onClick={(d) => {
                setModal({ title: `Recipe Run: ${d.recipe}`, rows: src.filter(r => (r.recipe_run || "").trim() === d.recipe) });
              }}>
              {data.map((_, i) => (
                <Cell key={i} fill={i === data.reduce((mi, d, di) => d.total > data[mi].total ? di : mi, 0) ? "#7c3aed" : "#c4b5fd"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-400 px-6 pb-4">Shows which recipe runs generate the most portions sold. Click a bar to see records.</p>
      </CardContent>
      <DrillDownModal open={!!modal} onClose={() => setModal(null)} title={modal?.title} records={modal?.rows} />
    </Card>
  );
}