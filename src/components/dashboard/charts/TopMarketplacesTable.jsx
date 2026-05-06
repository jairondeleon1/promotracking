import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TopMarketplacesTable({ records, allRecords }) {
  const [view, setView] = useState("promotion"); // "promotion" | "marketplace"

  // By promotion + division
  const byPromoDiv = {};
  records.forEach(r => {
    if (!r.promotion || !r.region) return;
    const key = `${r.promotion}||${r.region}`;
    if (!byPromoDiv[key]) byPromoDiv[key] = { promotion: r.promotion, region: r.region, total: 0, days: new Set(), records: 0 };
    byPromoDiv[key].total += r.portions_sold || 0;
    byPromoDiv[key].days.add(r.date_run);
    byPromoDiv[key].records += 1;
  });

  const promoRows = Object.values(byPromoDiv)
    .map(v => ({ ...v, avg: v.days.size > 0 ? parseFloat((v.total / v.days.size).toFixed(1)) : 0 }))
    .sort((a, b) => b.total - a.total);

  // By marketplace + app
  const byMktApp = {};
  records.forEach(r => {
    if (!r.marketplace) return;
    const app = r.mobile_app && r.mobile_app.trim() ? r.mobile_app.trim() : "No App";
    const key = `${r.marketplace}||${app}`;
    if (!byMktApp[key]) byMktApp[key] = { marketplace: r.marketplace, app, total: 0, days: new Set() };
    byMktApp[key].total += r.portions_sold || 0;
    byMktApp[key].days.add(r.date_run);
  });

  const mktRows = Object.values(byMktApp)
    .map(v => ({ ...v, avg: v.days.size > 0 ? parseFloat((v.total / v.days.size).toFixed(1)) : 0 }))
    .sort((a, b) => b.total - a.total);

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-slate-700">Detailed Summary Tables</CardTitle>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {[["promotion","By Promotion & Division"], ["marketplace","By Marketplace & App"]].map(([v, label]) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${view === v ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {view === "promotion" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Promotion","Division / Region","Total Portions","Avg Portions/Day","Days Run"].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {promoRows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-800">{row.promotion}</td>
                    <td className="px-3 py-2 text-slate-600">{row.region}</td>
                    <td className="px-3 py-2 text-right font-bold text-blue-600">{row.total.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-slate-700">{row.avg}</td>
                    <td className="px-3 py-2 text-right text-slate-500">{row.days.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Marketplace","Mobile App","Total Portions","Avg Portions/Day","Days Run"].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mktRows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-800">{row.marketplace}</td>
                    <td className="px-3 py-2 text-slate-600">{row.app}</td>
                    <td className="px-3 py-2 text-right font-bold text-blue-600">{row.total.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-slate-700">{row.avg}</td>
                    <td className="px-3 py-2 text-right text-slate-500">{row.days.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}