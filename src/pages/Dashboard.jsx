import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { BarChart2, Upload, Table2, TrendingUp, RefreshCw, Download } from "lucide-react";
import { exportToPptx } from "../utils/exportToPptx";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import StatsOverview from "../components/dashboard/StatsOverview";
import MonthFilter from "../components/dashboard/MonthFilter";

export default function Dashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [months, setMonths] = useState([]);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    const filtered = selectedMonth === "all" ? records : records.filter(r => r.upload_month === selectedMonth);
    await exportToPptx(filtered, selectedMonth);
    setExporting(false);
  };

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.PromotionRecord.list("-created_date", 2000);
    setRecords(data);
    const uniqueMonths = [...new Set(data.map(r => r.upload_month).filter(Boolean))].sort();
    setMonths(uniqueMonths);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = selectedMonth === "all" ? records : records.filter(r => r.upload_month === selectedMonth);
  const validRecords = filtered.filter(r => r.portions_sold > 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Promotion Tracking Dashboard</h1>
            <p className="text-sm text-slate-500 mt-0.5">Monthly promotion analytics &amp; insights</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={load} className="gap-2 text-slate-600">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting || records.length === 0} className="gap-2 text-slate-600">
              {exporting ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
              Export PPTX
            </Button>
            <Link to="/upload">
              <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                <Upload className="w-4 h-4" /> Upload CSV
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-screen-xl mx-auto flex gap-1">
          {[
            { label: "Overview", icon: BarChart2, to: "/" },
            { label: "Upload Data", icon: Upload, to: "/upload" },
            { label: "Data Table", icon: Table2, to: "/data-table" },
          ].map(({ label, icon: Icon, to }) => (
            <Link key={to} to={to}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                (to === "/" ? window.location.pathname === "/" || window.location.pathname === "" : window.location.pathname === to)
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}>
              <Icon className="w-4 h-4" />{label}
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-6">
        <MonthFilter months={months} selected={selectedMonth} onChange={setSelectedMonth} />
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Upload className="w-12 h-12 text-slate-300 mb-4" />
              <h2 className="text-lg font-semibold text-slate-700 mb-2">No data yet</h2>
              <p className="text-slate-500 mb-4">Upload your first CSV file to start tracking promotions.</p>
              <Link to="/upload">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Upload CSV</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <StatsOverview records={validRecords} allRecords={filtered} />
        )}
      </div>
    </div>
  );
}