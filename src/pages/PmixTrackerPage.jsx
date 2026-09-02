import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  BarChart2, Upload, Table2, RefreshCw,
  PackageSearch, Plus, Trash2, ChevronDown, ChevronRight,
  CheckCircle2, XCircle, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import PdfCatalogUpload from "../components/pmix/PdfCatalogUpload";
import PmixUploadPanel from "../components/pmix/PmixUploadPanel";
import { reMatchRecords } from "@/utils/pmixMatch";

// ─── Sub-components ──────────────────────────────────────────────────────────

function AccountCard({ account, pmixBatches, catalogItems, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState("all");

  const batches = pmixBatches.filter(b => b.account_name === account.account_name);
  const batchCount = batches.length;

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.ProductMixRecord.filter({ account_name: account.account_name });
    setRecords(reMatchRecords(data, catalogItems));
    setLoading(false);
  };

  useEffect(() => {
    if (expanded) load();
  }, [expanded, batchCount, catalogItems]);

  const filtered = selectedBatch === "all" ? records : records.filter(r => r.upload_batch_id === selectedBatch);

  // Promotion matching stats
  const promoItems = filtered.filter(r => r.matched_promotion);
  const unmatched = filtered.filter(r => !r.matched_promotion);
  const totalQty = filtered.reduce((s, r) => s + (r.quantity_sold || 0), 0);
  const promoQty = promoItems.reduce((s, r) => s + (r.quantity_sold || 0), 0);
  const matchRate = totalQty > 0 ? Math.round((promoQty / totalQty) * 100) : 0;

  // By promotion breakdown
  const byPromo = {};
  promoItems.forEach(r => {
    if (!byPromo[r.matched_promotion]) byPromo[r.matched_promotion] = { qty: 0, sales: 0, items: 0 };
    byPromo[r.matched_promotion].qty += r.quantity_sold || 0;
    byPromo[r.matched_promotion].sales += r.total_sales || 0;
    byPromo[r.matched_promotion].items += 1;
  });

  return (
    <Card className="border-slate-200">
      <CardContent className="p-0">
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-800">{account.account_name}</p>
              <p className="text-xs text-slate-500">
                {account.region && `${account.region} · `}
                {account.manager_name && `${account.manager_name} · `}
                {batches.length} upload{batches.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {records.length > 0 && (
              <Badge variant="outline" className={`text-xs ${matchRate >= 50 ? "border-green-300 text-green-700" : "border-amber-300 text-amber-700"}`}>
                {matchRate}% promo match
              </Badge>
            )}
            {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </div>
        </button>

        {expanded && (
          <div className="px-5 pb-5 border-t border-slate-100 mt-0 space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No PMix data uploaded yet for this account.</p>
            ) : (
              <>
                {/* Batch selector */}
                {batches.length > 1 && (
                  <div className="flex items-center gap-2 pt-3">
                    <span className="text-xs text-slate-500">Sell Period:</span>
                    <select
                      value={selectedBatch}
                      onChange={e => setSelectedBatch(e.target.value)}
                      className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                    >
                      <option value="all">All Periods</option>
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* KPI row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                  {[
                    { label: "Total Items", value: filtered.length.toLocaleString(), color: "text-slate-700" },
                    { label: "Promo Items", value: promoItems.length.toLocaleString(), color: "text-green-700" },
                    { label: "Promo Match Rate", value: `${matchRate}%`, color: matchRate >= 50 ? "text-green-700" : "text-amber-700" },
                    { label: "Total Sales", value: `$${filtered.reduce((s, r) => s + (r.total_sales || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: "text-blue-700" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-slate-50 rounded-lg p-3 text-center">
                      <p className={`text-xl font-bold ${color}`}>{value}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Promotion breakdown */}
                {Object.keys(byPromo).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Selling by Promotion</p>
                    <div className="space-y-1.5">
                      {Object.entries(byPromo)
                        .sort((a, b) => b[1].qty - a[1].qty)
                        .map(([promo, stats]) => (
                          <div key={promo} className="flex items-center justify-between bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                              <span className="text-sm text-slate-700 font-medium">{promo}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span>{stats.items} items</span>
                              <span className="font-semibold text-slate-700">{stats.qty.toLocaleString()} units</span>
                              <span className="text-green-700">${stats.sales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Matched items detail */}
                {promoItems.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Matched Items ({promoItems.length} items)
                    </p>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {promoItems.slice(0, 50).map((r, i) => (
                        <div key={i} className="flex items-center justify-between bg-green-50 border border-green-100 rounded px-3 py-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-slate-700 truncate max-w-[260px]">{r.item_description || r.item_number}</p>
                              <p className="text-[10px] text-slate-400">#{r.item_number || "—"} · {r.brand || ""}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs whitespace-nowrap ml-2">
                            <Badge variant="outline" className="text-[10px] border-green-200 text-green-700">{r.matched_promotion}</Badge>
                            <span className="text-slate-500">{r.quantity_sold} units</span>
                            <span className="text-green-700">${(r.total_sales || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                      ))}
                      {promoItems.length > 50 && (
                        <p className="text-xs text-slate-400 text-center py-1">+{promoItems.length - 50} more items</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Not matched / not selling */}
                {unmatched.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Not Matching Active Promotions ({unmatched.length} items)
                    </p>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {unmatched.slice(0, 30).map((r, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded px-3 py-1.5">
                          <div className="flex items-center gap-2">
                            <XCircle className="w-3 h-3 text-slate-300 shrink-0" />
                            <span className="text-xs text-slate-600 truncate max-w-[280px]">{r.item_description || r.item_number}</span>
                          </div>
                          <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{r.quantity_sold} units</span>
                        </div>
                      ))}
                      {unmatched.length > 30 && (
                        <p className="text-xs text-slate-400 text-center py-1">+{unmatched.length - 30} more items</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Add Account Panel ───────────────────────────────────────────────────────
function AddAccountPanel({ onAdded }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [manager, setManager] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await base44.entities.TrackedAccount.create({ account_name: name.trim(), region, manager_name: manager, email, active: true });
    setSaving(false);
    setName(""); setRegion(""); setManager(""); setEmail("");
    setOpen(false);
    onAdded();
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <Plus className="w-4 h-4" /> Add Account
      </Button>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardContent className="p-4 space-y-3">
        <p className="text-sm font-semibold text-slate-700">New Tracked Account</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">Account Name *</Label><Input placeholder="Nike - NALC Victory" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="space-y-1"><Label className="text-xs">Region</Label><Input placeholder="e.g. Mid-Atlantic" value={region} onChange={e => setRegion(e.target.value)} /></div>
          <div className="space-y-1"><Label className="text-xs">Manager</Label><Input placeholder="Manager name" value={manager} onChange={e => setManager(e.target.value)} /></div>
          <div className="space-y-1"><Label className="text-xs">Email (for reports)</Label><Input placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={!name.trim() || saving} className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? "Saving..." : "Save Account"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function PmixTrackerPage() {
  const [accounts, setAccounts] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);
  const [pmixBatches, setPmixBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("accounts"); // "accounts" | "upload" | "catalog"

  const load = async () => {
    setLoading(true);
    const [accts, catalog, pmixSample] = await Promise.all([
      base44.entities.TrackedAccount.list(),
      base44.entities.PromotionCatalog.list("-created_date", 500),
      base44.entities.ProductMixRecord.list("-created_date", 2000),
    ]);
    setAccounts(accts);
    setCatalogItems(catalog);
    // Build batch list
    const seen = new Set();
    const batchList = [];
    pmixSample.forEach(r => {
      if (r.upload_batch_id && !seen.has(r.upload_batch_id)) {
        seen.add(r.upload_batch_id);
        batchList.push({ id: r.upload_batch_id, label: r.sell_period || r.upload_batch_id, account_name: r.account_name });
      }
    });
    setPmixBatches(batchList);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const navLinks = [
    { label: "Overview", icon: BarChart2, to: "/" },
    { label: "Upload Data", icon: Upload, to: "/upload" },
    { label: "Data Table", icon: Table2, to: "/data-table" },
    { label: "PMix Tracker", icon: PackageSearch, to: "/pmix-tracker" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">PMix Tracker</h1>
            <p className="text-sm text-slate-500 mt-0.5">Track what accounts are selling vs. your active promotions</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-2 text-slate-600">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* Nav */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-screen-xl mx-auto flex gap-1">
          {navLinks.map(({ label, icon: Icon, to }) => (
            <Link key={to} to={to}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                window.location.pathname === to
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}>
              <Icon className="w-4 h-4" />{label}
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-6">
        {/* Sub-tabs */}
        <div className="flex gap-2 border-b border-slate-200">
          {[
            { key: "accounts", label: "Accounts & Performance" },
            { key: "upload", label: "Upload PMix File" },
            { key: "catalog", label: "Promotion Catalog" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === key ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Accounts Tab */}
            {activeTab === "accounts" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-700">{accounts.length} Tracked Account{accounts.length !== 1 ? "s" : ""}</h2>
                  <AddAccountPanel onAdded={load} />
                </div>

                {accounts.length === 0 ? (
                  <Card className="border-dashed border-slate-300">
                    <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                      <Building2 className="w-10 h-10 text-slate-300 mb-3" />
                      <p className="text-slate-600 font-medium mb-1">No accounts tracked yet</p>
                      <p className="text-sm text-slate-400">Add accounts to start tracking their PMix against promotions.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {accounts.map(account => (
                      <AccountCard
                        key={account.id}
                        account={account}
                        pmixBatches={pmixBatches}
                        catalogItems={catalogItems}
                        onDelete={load}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Upload Tab */}
            {activeTab === "upload" && (
              <div className="max-w-2xl">
                <PmixUploadPanel
                  accounts={accounts}
                  catalogItems={catalogItems}
                  onUploaded={(batchId, accountName, sellPeriod) => {
                    setPmixBatches(prev => [{ id: batchId, label: sellPeriod, account_name: accountName }, ...prev]);
                    load();
                    setActiveTab("accounts");
                  }}
                />
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  <strong>Tip:</strong> Upload a PMix export from your distributor (Sysco, GFS, Vistar). The system will automatically match items by DIN/item number against your Promotion Catalog and show what's selling vs. not.
                </div>
              </div>
            )}

            {/* Catalog Tab */}
            {activeTab === "catalog" && (
              <PromotionCatalogPanel catalogItems={catalogItems} onRefresh={load} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Promotion Catalog Panel ─────────────────────────────────────────────────
function PromotionCatalogPanel({ catalogItems, onRefresh }) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [sellPeriod, setSellPeriod] = useState("");
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [manualForm, setManualForm] = useState({ din: "", brand: "", description: "", promotion_name: "", promotion_category: "", price: "", pack_size: "", sell_period: "" });
  const [addingManual, setAddingManual] = useState(false);

  // Group by sell period
  const bySellPeriod = {};
  catalogItems.forEach(c => {
    const sp = c.sell_period || "Unknown";
    if (!bySellPeriod[sp]) bySellPeriod[sp] = [];
    bySellPeriod[sp].push(c);
  });

  const handleManualAdd = async () => {
    if (!manualForm.din && !manualForm.description) return;
    setAddingManual(true);
    await base44.entities.PromotionCatalog.create({ ...manualForm });
    setAddingManual(false);
    setManualForm({ din: "", brand: "", description: "", promotion_name: "", promotion_category: "", price: "", pack_size: "", sell_period: "" });
    onRefresh();
  };

  const handleDelete = async (id) => {
    await base44.entities.PromotionCatalog.delete(id);
    onRefresh();
  };

  return (
    <div className="space-y-5">
    <div className="flex items-center justify-between">
      <h2 className="text-base font-semibold text-slate-700">
        Promotion Catalog — {catalogItems.length} items
      </h2>
    </div>

    <PdfCatalogUpload onExtracted={onRefresh} />

      {/* Manual add form */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-700">Add Item Manually</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><Label className="text-xs">Sell Period</Label><Input placeholder="July 2026" value={manualForm.sell_period} onChange={e => setManualForm(p => ({ ...p, sell_period: e.target.value }))} /></div>
            <div><Label className="text-xs">Promotion Category</Label><Input placeholder="BOH BROADLINE" value={manualForm.promotion_category} onChange={e => setManualForm(p => ({ ...p, promotion_category: e.target.value }))} /></div>
            <div><Label className="text-xs">DIN / Item #</Label><Input placeholder="e.g. 4201285" value={manualForm.din} onChange={e => setManualForm(p => ({ ...p, din: e.target.value }))} /></div>
            <div><Label className="text-xs">Brand</Label><Input placeholder="Brand name" value={manualForm.brand} onChange={e => setManualForm(p => ({ ...p, brand: e.target.value }))} /></div>
            <div className="col-span-2"><Label className="text-xs">Description</Label><Input placeholder="Item description" value={manualForm.description} onChange={e => setManualForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div><Label className="text-xs">Promotion Name</Label><Input placeholder="e.g. Grilling Month" value={manualForm.promotion_name} onChange={e => setManualForm(p => ({ ...p, promotion_name: e.target.value }))} /></div>
            <div><Label className="text-xs">Price</Label><Input placeholder="$83.27" value={manualForm.price} onChange={e => setManualForm(p => ({ ...p, price: e.target.value }))} /></div>
          </div>
          <Button size="sm" onClick={handleManualAdd} disabled={addingManual || (!manualForm.din && !manualForm.description)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus className="w-4 h-4" /> {addingManual ? "Adding..." : "Add to Catalog"}
          </Button>
        </CardContent>
      </Card>

      {/* Catalog list */}
      {Object.keys(bySellPeriod).length === 0 ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <PackageSearch className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium mb-1">No catalog items yet</p>
            <p className="text-sm text-slate-400">Add promotion items manually or import them from a file.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(bySellPeriod).map(([sp, items]) => (
          <div key={sp}>
            <h3 className="text-sm font-semibold text-slate-600 mb-2">{sp} — {items.length} items</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {["Category", "DIN", "Brand", "Description", "Promotion", "Price", ""].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{item.promotion_category || "—"}</td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap font-mono">{item.din || "—"}</td>
                      <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{item.brand || "—"}</td>
                      <td className="px-3 py-2 text-slate-700 max-w-[240px] truncate">{item.description || "—"}</td>
                      <td className="px-3 py-2"><Badge variant="outline" className="text-xs border-blue-200 text-blue-700">{item.promotion_name || "—"}</Badge></td>
                      <td className="px-3 py-2 text-slate-600">{item.price || "—"}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}