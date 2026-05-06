import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function PortionsByMarketplaceAndApp({ records }) {
  const byMktApp = {};
  records.forEach(r => {
    if (!r.marketplace) return;
    const raw = r.mobile_app && r.mobile_app.trim() ? r.mobile_app.trim() : "No App";
    const app = raw === "No App" ? raw : raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    const key = r.marketplace;
    if (!byMktApp[key]) byMktApp[key] = {};
    byMktApp[key][app] = (byMktApp[key][app] || 0) + (r.portions_sold || 0);
  });

  const apps = [...new Set(records.map(r => {
    const raw = r.mobile_app && r.mobile_app.trim() ? r.mobile_app.trim() : "No App";
    return raw === "No App" ? raw : raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  }))];
  const data = Object.entries(byMktApp)
    .map(([mkt, appData]) => {
      const row = { mkt: mkt.length > 16 ? mkt.slice(0, 14) + "…" : mkt };
      apps.forEach(a => { row[a] = appData[a] || 0; });
      return row;
    })
    .sort((a, b) => {
      const ta = apps.reduce((s, ap) => s + (a[ap] || 0), 0);
      const tb = apps.reduce((s, ap) => s + (b[ap] || 0), 0);
      return tb - ta;
    })
    .slice(0, 12);

  const APP_COLORS = { "Thrive": "#2563eb", "Savour": "#16a34a", "No App": "#94a3b8" };
  const getColor = (app, i) => APP_COLORS[app] || ["#4f46e5","#0891b2","#d97706"][i % 3];

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-700">Total Portions by Marketplace &amp; Mobile App</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 100 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="mkt" tick={{ fontSize: 9, fill: "#64748b" }} angle={-45} textAnchor="end" interval={0} height={100} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {apps.map((app, i) => (
              <Bar key={app} dataKey={app} fill={getColor(app, i)} radius={[2, 2, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}