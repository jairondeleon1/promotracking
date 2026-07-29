import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { Upload, CheckCircle2, AlertCircle, ArrowLeft, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";

function parseCurrency(val) {
  if (!val || val === "") return null;
  return parseFloat(String(val).replace(/[$,\s]/g, "")) || null;
}

function parsePortions(val) {
  if (!val || val === "") return null;
  const n = parseFloat(String(val).replace(/[,\s]/g, ""));
  return isNaN(n) ? null : n;
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, "").trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (vals[idx] || "").replace(/^"|"$/g, "").trim(); });
    rows.push(obj);
  }
  return rows;
}

function mapRow(row, uploadMonth, batchId) {
  const marketplace = row["MARKETPLACE+A1:M1"] || row["MARKETPLACE"] || "";
  const region = row["REGION"] || "";
  const portions = parsePortions(row["PORTIONS SOLD"]);
  if (!marketplace || marketplace === "") return null;
  return {
    marketplace,
    region,
    manager_name: row["MANAGER NAME"] || "",
    promotion: (row["PROMOTION"] || "").trim(),
    date_run: row["DATE RUN"] || "",
    day_of_week: (row["DAY OF THE WEEK RUN"] || "").trim(),
    price_sold: row["PRICE SOLD"] || "",
    portions_sold: portions,
    total_promotion_sales: parseCurrency(row["TOTAL PROMOTION SALES FOR THE DAY"]),
    total_marketplace_sales_week: parseCurrency(row["TOTAL MARKETPLACE SALES FOR THE WEEK OF PROMOTION"]),
    mobile_app: row["MOBILE APP"] || "",
    promoted_on_app: row["DID YOU PROMOTE ON THE MOBILE APP?"] || "",
    comments: row["COMMENTS"] || "",
    business_type: row["BUSINESS TYPE"] || "",
    recipe_run: row["RECIPE RUN"] || "",
    upload_month: uploadMonth,
    upload_batch_id: batchId,
  };
}

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [monthLabel, setMonthLabel] = useState("");
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState([]);
  const navigate = useNavigate();

  const isExcel = (f) => f && (f.name.endsWith(".xlsx") || f.name.endsWith(".xls"));

  const parseFile = (f) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (isExcel(f)) {
        const wb = XLSX.read(ev.target.result, { type: "array", cellDates: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
        resolve(rows);
      } else {
        resolve(parseCSV(ev.target.result));
      }
    };
    if (isExcel(f)) reader.readAsArrayBuffer(f);
    else reader.readAsText(f);
  });

  const handleFileChange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setStatus(null);
    const rows = await parseFile(f);
    setPreview(rows.slice(0, 5));
  };

  const handleUpload = async () => {
    if (!file || !monthLabel.trim()) {
      setStatus("error");
      setMessage("Please select a file and enter a month label.");
      return;
    }
    setStatus("loading");
    const rows = await parseFile(file);
    const batchId = crypto.randomUUID();
    const mapped = rows.map(r => mapRow(r, monthLabel.trim(), batchId)).filter(Boolean);
    if (mapped.length === 0) {
      setStatus("error");
      setMessage("No valid rows found. Check your file format.");
      return;
    }
    const chunkSize = 50;
    for (let i = 0; i < mapped.length; i += chunkSize) {
      await base44.entities.PromotionRecord.bulkCreate(mapped.slice(i, i + chunkSize));
    }
    setStatus("success");
    setMessage(`Successfully imported ${mapped.length} records for "${monthLabel}".`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Promotion Tracking Dashboard</h1>
            <p className="text-sm text-slate-500 mt-0.5">Monthly promotion analytics &amp; insights</p>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Button>
          </Link>
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

      <div className="max-w-2xl mx-auto px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              Upload Monthly Promotion Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Month / Year Label <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. April 2025"
                value={monthLabel}
                onChange={e => setMonthLabel(e.target.value)}
                className="max-w-xs"
              />
              <p className="text-xs text-slate-400">This label identifies the upload batch for filtering.</p>
            </div>

            <div className="space-y-2">
              <Label>CSV or Excel File <span className="text-red-500">*</span></Label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" id="csv-input" />
                <label htmlFor="csv-input" className="cursor-pointer text-sm text-blue-600 hover:underline font-medium">
                  {file ? file.name : "Click to select a CSV or Excel file"}
                </label>
                <p className="text-xs text-slate-400 mt-1">{file ? "File selected" : "Supported: .csv, .xlsx, .xls"}</p>
              </div>
            </div>

            {preview.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Preview (first 5 rows)</p>
                <div className="overflow-x-auto rounded border border-slate-200">
                  <table className="text-xs w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        {Object.keys(preview[0]).slice(0, 6).map(h => (
                          <th key={h} className="px-2 py-1.5 text-left text-slate-600 font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          {Object.values(row).slice(0, 6).map((v, j) => (
                            <td key={j} className="px-2 py-1.5 text-slate-700 whitespace-nowrap max-w-[120px] truncate">{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {message}
              </div>
            )}
            {status === "success" && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg p-3 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {message}
                <button onClick={() => navigate("/")} className="ml-auto text-blue-600 underline text-xs">View Dashboard</button>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={status === "loading" || !file || !monthLabel.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full gap-2"
            >
              {status === "loading" ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Importing...</>
              ) : (
                <><Upload className="w-4 h-4" /> Import Data</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}