import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Search, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import MonthFilter from "../components/dashboard/MonthFilter";

export default function DataTablePage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [filterBatches, setFilterBatches] = useState([]);
  const [search, setSearch] = useState("");
  const [deletingBatch, setDeletingBatch] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.PromotionRecord.list("-created_date", 2000);
    setRecords(data);
    const seen = new Set();
    const batchList = [];
    data.forEach(r => {
      if (r.upload_batch_id && !seen.has(r.upload_batch_id)) {
        seen.add(r.upload_batch_id);
        batchList.push({ id: r.upload_batch_id, label: r.upload_month || r.upload_batch_id });
      }
    });
    setFilterBatches(batchList);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = records
    .filter(r => selectedBatch === "all" || r.upload_batch_id === selectedBatch)
    .filter(r => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (r.marketplace || "").toLowerCase().includes(q)
        || (r.promotion || "").toLowerCase().includes(q)
        || (r.manager_name || "").toLowerCase().includes(q)
        || (r.region || "").toLowerCase().includes(q);
    });

  const handleDeleteBatch = async (batchId) => {
    if (!window.confirm("Delete all records from this upload batch?")) return;
    setDeletingBatch(batchId);
    const toDelete = records.filter(r => r.upload_batch_id === batchId);
    for (const r of toDelete) {
      await base44.entities.PromotionRecord.delete(r.id);
    }
    setDeletingBatch(null);
    load();
  };

  const batches = [...new Map(records.map(r => [r.upload_batch_id, { id: r.upload_batch_id, month: r.upload_month, count: records.filter(x => x.upload_batch_id === r.upload_batch_id).length }])).values()];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Promotion Tracking Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Monthly promotion analytics &amp; insights</p>
        </div>
      </div>
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-screen-xl mx-auto flex gap-1">
          {[
            { label: "Overview", to: "/" },
            { label: "Upload Data", to: "/upload" },
            { label: "Data Table", to: "/data-table" },
          ].map(({ label, to }) => (
            <Link key={to} to={to}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                window.location.pathname === to
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}>
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-6">
        {/* Upload batches */}
        {batches.length > 0 && (
          <Card className="p-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">Upload Batches</p>
            <div className="flex flex-wrap gap-2">
              {batches.map(b => (
                <div key={b.id} className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5 text-sm">
                  <span className="text-slate-700 font-medium">{b.month}</span>
                  <span className="text-slate-400">({b.count} rows)</span>
                  <button
                    onClick={() => handleDeleteBatch(b.id)}
                    disabled={deletingBatch === b.id}
                    className="text-red-400 hover:text-red-600 transition-colors ml-1"
                  >
                    {deletingBatch === b.id ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="flex items-center gap-3">
          <MonthFilter batches={filterBatches} selected={selectedBatch} onChange={setSelectedBatch} />
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search marketplace, promotion..." className="pl-9" />
          </div>
          <span className="text-sm text-slate-400">{filtered.length} records</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["Month","Marketplace","Business Type","Region","Manager","Promotion","Recipe Run","Date","Day","Portions","Promo Sales","App","App Promoted?"].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={13} className="text-center py-10 text-slate-400"><AlertCircle className="w-5 h-5 mx-auto mb-1" />No records found</td></tr>
                  ) : filtered.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{r.upload_month}</td>
                      <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap max-w-[160px] truncate">{r.marketplace}</td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{r.business_type || "—"}</td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{r.region}</td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{r.manager_name}</td>
                      <td className="px-3 py-2 text-slate-800 whitespace-nowrap">{r.promotion}</td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{r.recipe_run || "—"}</td>
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{r.date_run}</td>
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{r.day_of_week}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-800">{r.portions_sold ?? "—"}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{r.total_promotion_sales != null ? `$${r.total_promotion_sales.toFixed(2)}` : "—"}</td>
                      <td className="px-3 py-2 text-slate-500">{r.mobile_app}</td>
                      <td className="px-3 py-2 text-slate-500">{r.promoted_on_app}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}