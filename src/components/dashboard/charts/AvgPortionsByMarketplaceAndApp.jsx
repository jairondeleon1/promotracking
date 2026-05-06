import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function AvgPortionsByMarketplaceAndApp({ records }) {
  const byMktApp = {};
  records.forEach(r => {
    if (!r.marketplace) return;
    const raw = r.mobile_app && r.mobile_app.trim() ? r.mobile_app.trim() : "No App";
    const app = raw === "No App" ? raw : raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    const key = r.marketplace;
    if (!byMktApp[key]) byMktApp[key] = {};
    if (!byMktApp[key][app]) byMktApp[key][app] = { total: 0, days: new Set() };
    byMktApp[key][app].total += r.portions_sold || 0;
    byMktApp[key][app].days.add(r.date_run);
  });

  const apps = [...new Set(records.map(r => {
    const raw = r.mobile_app && r.mobile_app.trim() ? r.mobile_app.trim() : "No App";
    return raw === "No App" ? raw : raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  }))];

  const data = Object.entries(byMktApp).map(([mkt, appData]) => {
    const row = { mkt: mkt.length > 16 ? mkt.slice(0, 14) + "…" : mkt };
    apps.forEach(a => {
      const d = appData[a];
      row[a] = d && d.days.size > 0 ? parseFloat((d.total / d.days.size).toFixed(1)) : 0;
    });
    return row;
  }).sort((a, b) => {
    const ta = apps.reduce((s, ap) => s + (a[ap] || 0), 0);
    const tb = apps.reduce((s, ap) => s + (b[ap] || 0), 0);
    return tb - ta;
  }).slice(0, 12);

  const APP_COLORS = { "Thrive": "#60a5fa", "Savour": "#4ade80", "No App": "#cbd5e1" };
  const getColor = (app, i) => APP_COLORS[app] || ["#a78bfa","#38bdf8","#fbbf24"][i % 3];

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-700">Avg Portions/Day by Marketplace &amp; Mobile App</CardTitle>
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
      <p className="text-xs text-slate-400 px-6 pb-4">Shows the average daily portions sold per marketplace, broken down by mobile app. Identifies which locations have the strongest day-to-day performance and whether app promotion makes a difference.</p>
      </CardContent>
    </Card>
  );
}