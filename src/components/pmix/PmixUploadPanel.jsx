import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Sparkles, Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";

const EXTRACT_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          item_number: { type: "string", description: "Distributor item number / DIN" },
          item_description: { type: "string" },
          brand: { type: "string" },
          category: { type: "string" },
          quantity_sold: { type: "number" },
          unit_price: { type: "number" },
          total_sales: { type: "number" },
          upc: { type: "string" },
          order_number: { type: "string" },
          order_date: { type: "string" },
        },
      },
    },
  },
  required: ["items"],
};

function parseFileLocal(f) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: "array", cellDates: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false, header: 1 });

        // Determine the max number of non-empty columns across all rows
        let maxCols = 0;
        for (const r of raw) {
          let lastNonEmpty = 0;
          for (let c = 0; c < r.length; c++) {
            if (r[c] !== "" && r[c] != null) lastNonEmpty = c + 1;
          }
          if (lastNonEmpty > maxCols) maxCols = lastNonEmpty;
        }

        // Stacked format: 1-2 columns with all data stacked vertically as label/value pairs
        const isStacked = maxCols <= 2;

        if (isStacked) {
          // Flatten all non-empty cell values into a single ordered list
          const flatValues = [];
          for (const r of raw) {
            const cellVal = String(r[0] ?? "").trim();
            if (cellVal !== "") flatValues.push(cellVal);
          }
          resolve({ isStacked: true, flatValues, headers: [], rows: [] });
          return;
        }

        // Normal tabular format — find header row and map rows to objects
        let headerIdx = 0;
        for (let i = 0; i < Math.min(10, raw.length); i++) {
          const rowStr = raw[i].join(" ").toLowerCase();
          if (rowStr.includes("item") || rowStr.includes("order") || rowStr.includes("quantity") || rowStr.includes("description") || rowStr.includes("product")) {
            headerIdx = i;
            break;
          }
        }
        const headers = raw[headerIdx].map(h => String(h).trim());
        const rows = [];
        for (let i = headerIdx + 1; i < raw.length; i++) {
          if (!raw[i].some(v => v !== "" && v != null)) continue;
          const obj = {};
          headers.forEach((h, idx) => { obj[h] = String(raw[i][idx] ?? "").trim(); });
          rows.push(obj);
        }
        resolve({ isStacked: false, headers, rows, flatValues: [], rawRows: raw });
      } catch (e) { reject(e); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(f);
  });
}

function matchToCatalog(item, catalogItems) {
  const itemNum = (item.item_number || "").trim();
  const upc = (item.upc || "").trim();
  if (itemNum) {
    const hit = catalogItems.find(c =>
      (c.din && c.din.trim() === itemNum) ||
      (c.manufacturer_min && c.manufacturer_min.trim() === itemNum) ||
      (c.upc && c.upc.trim() === upc && upc)
    );
    if (hit) return { matched_promotion: hit.promotion_name || hit.promotion_category || "", matched_category: hit.promotion_category || "" };
  }
  return { matched_promotion: "", matched_category: "" };
}

export default function PmixUploadPanel({ accounts, catalogItems, onUploaded }) {
  const [file, setFile] = useState(null);
  const [accountName, setAccountName] = useState("");
  const [sellPeriod, setSellPeriod] = useState("");
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState([]);
  const [extracted, setExtracted] = useState(null);

  const handleFileChange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setStatus(null);
    setExtracted(null);
    setPreview([]);
    try {
      const parsed = await parseFileLocal(f);
      if (parsed.isStacked) {
        setPreview(parsed.flatValues.slice(0, 5).map(v => ({ "Column A": v })));
      } else {
        setPreview(parsed.rows.slice(0, 3));
        if (parsed.rows.length === 0) {
          setStatus("error");
          setMessage("The file appears to be empty or has no data rows.");
        }
      }
    } catch (err) {
      setStatus("error");
      setMessage("Could not read this file. Make sure it's a valid .xlsx or .csv.");
    }
  };

  const handleExtract = async () => {
    if (!file) return;
    setStatus("extracting");
    setMessage("Reading the PMix file with AI — this can take 20-40 seconds...");
    try {
      const parsed = await parseFileLocal(file);

      let prompt;
      if (parsed.isStacked) {
        // Stacked format: all values are in a single column, alternating labels and values
        const sample = parsed.flatValues.slice(0, 600);
        prompt = `You are analyzing a product mix (PMix) export from a foodservice distributor. The file is in a STACKED / vertical format: all data is in a single column where field labels and field values alternate down the rows. Each order/item record is represented by a sequence of label-value pairs before the next record begins.

Here are the raw cell values from column A, in order (first ${sample.length} of ${parsed.flatValues.length}):
${JSON.stringify(sample)}

Reconstruct the individual item records from this stacked label-value stream. Common field labels you will encounter include: Order Number, Order Date, Item Number, Item Description (or Description), Brand, Category (or Class), Quantity (or Qty Sold), Unit Price (or Price), Total Sales (or Extended Amount), UPC. 
- Group consecutive label-value pairs into records — a new record typically starts when you see "Order Number" or "Item Number" again after a complete set of fields.
- Convert quantity and price values to numbers (strip $ and commas).
- If a field is missing for a record, use empty string for text or 0 for numbers.
- Return ALL item records you can reconstruct from the sample; do not summarize or skip any.`;
      } else {
        if (parsed.rows.length === 0) {
          setStatus("error");
          setMessage("No data rows found in the file.");
          return;
        }
        const sample = parsed.rows.slice(0, 400);
        prompt = `You are analyzing a product mix (PMix) export from a foodservice distributor. The data below is from an Excel/CSV file.
The column headers are: ${JSON.stringify(parsed.headers)}
The data rows (as JSON objects, keyed by those headers) are:
${JSON.stringify(sample)}

Extract every row into a clean structured list. For each row capture: item_number (the distributor item number / DIN), item_description, brand, category, quantity_sold (numeric), unit_price (numeric), total_sales (numeric), upc, order_number, and order_date.
- Convert quantity and price values to numbers (strip $ and commas).
- If a field is missing, use empty string for text or 0 for numbers.
- Return ALL rows; do not summarize or skip any.
- Map the file's columns to these fields intelligently regardless of the exact column names used.`;
      }

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: EXTRACT_SCHEMA,
      });
      const items = (res && res.items) || [];
      if (items.length === 0) {
        setStatus("error");
        setMessage("No items could be extracted from this file.");
        return;
      }
      setExtracted(items);
      setStatus("preview");
      setMessage(`Extracted ${items.length} items. Review and click Import to save.`);
    } catch (err) {
      setStatus("error");
      setMessage("Extraction failed: " + (err?.message || "unknown error"));
    }
  };

  const handleImport = async () => {
    if (!extracted) return;
    setStatus("saving");
    const batchId = crypto.randomUUID();
    const records = extracted
      .map(it => {
        if (!it.item_description && !it.item_number) return null;
        const m = matchToCatalog(it, catalogItems);
        return {
          account_name: accountName.trim(),
          sell_period: sellPeriod.trim(),
          upload_batch_id: batchId,
          order_number: it.order_number || "",
          order_date: it.order_date || "",
          item_number: it.item_number || "",
          item_description: it.item_description || "",
          brand: it.brand || "",
          category: it.category || "",
          quantity_sold: Number(it.quantity_sold) || 0,
          unit_price: Number(it.unit_price) || 0,
          total_sales: Number(it.total_sales) || 0,
          upc: it.upc || "",
          matched_promotion: m.matched_promotion,
          matched_category: m.matched_category,
        };
      })
      .filter(Boolean);

    if (records.length === 0) {
      setStatus("error");
      setMessage("No valid rows to import.");
      return;
    }
    try {
      const chunkSize = 50;
      for (let i = 0; i < records.length; i += chunkSize) {
        await base44.entities.ProductMixRecord.bulkCreate(records.slice(i, i + chunkSize));
      }
      const matched = records.filter(r => r.matched_promotion).length;
      setStatus("success");
      setMessage(`Imported ${records.length} items for "${accountName}" — ${matched} matched to active promotions.`);
      onUploaded(batchId, accountName, sellPeriod);
      setFile(null);
      setPreview([]);
      setExtracted(null);
    } catch (err) {
      setStatus("error");
      setMessage("Save failed: " + (err?.message || "unknown error"));
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Upload Product Mix (PMix)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Account Name <span className="text-red-500">*</span></Label>
            <Input
              placeholder="e.g. Nike - NALC Victory"
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
              list="account-suggestions"
            />
            <datalist id="account-suggestions">
              {accounts.map(a => <option key={a.id} value={a.account_name} />)}
            </datalist>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Sell Period <span className="text-red-500">*</span></Label>
            <Input
              placeholder="e.g. July 2026"
              value={sellPeriod}
              onChange={e => setSellPeriod(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">PMix File (.xlsx / .xls / .csv) <span className="text-red-500">*</span></Label>
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-5 text-center hover:border-blue-400 transition-colors">
            <Upload className="w-6 h-6 text-slate-300 mx-auto mb-1" />
            <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" id="pmix-input" />
            <label htmlFor="pmix-input" className="cursor-pointer text-sm text-blue-600 hover:underline font-medium">
              {file ? file.name : "Click to select PMix file"}
            </label>
            <p className="text-xs text-slate-400 mt-1">AI reads any distributor's column format automatically</p>
          </div>
        </div>

        {preview.length > 0 && (
          <div className="overflow-x-auto rounded border border-slate-100 text-xs">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>{Object.keys(preview[0]).slice(0, 7).map(h => (
                  <th key={h} className="px-2 py-1.5 text-left text-slate-500 font-medium whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {Object.values(row).slice(0, 7).map((v, j) => (
                      <td key={j} className="px-2 py-1.5 text-slate-600 whitespace-nowrap max-w-[140px] truncate">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {status === "preview" && extracted && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle2 className="w-4 h-4" /> {message}
            </div>
            <div className="overflow-x-auto rounded border border-slate-200 max-h-64">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    {["Item #", "Description", "Brand", "Qty", "Unit Price", "Total"].map(h => (
                      <th key={h} className="px-2 py-1.5 text-left text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {extracted.slice(0, 50).map((it, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="px-2 py-1.5 text-slate-600 font-mono whitespace-nowrap">{it.item_number || "—"}</td>
                      <td className="px-2 py-1.5 text-slate-700 max-w-[220px] truncate">{it.item_description || "—"}</td>
                      <td className="px-2 py-1.5 text-slate-600 whitespace-nowrap">{it.brand || "—"}</td>
                      <td className="px-2 py-1.5 text-slate-700">{it.quantity_sold || 0}</td>
                      <td className="px-2 py-1.5 text-slate-600">${(it.unit_price || 0).toFixed(2)}</td>
                      <td className="px-2 py-1.5 text-slate-700">${(it.total_sales || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {extracted.length > 50 && (
                <p className="text-xs text-slate-400 text-center py-1">+{extracted.length - 50} more items</p>
              )}
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
          </div>
        )}

        <div className="flex gap-2">
          {status !== "preview" && (
            <Button
              onClick={handleExtract}
              disabled={!file || !accountName.trim() || !sellPeriod.trim() || status === "extracting"}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {status === "extracting"
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Reading file...</>
                : <><Sparkles className="w-4 h-4" /> Extract Items</>}
            </Button>
          )}
          {status === "preview" && (
            <Button
              onClick={handleImport}
              disabled={status === "saving"}
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              {status === "saving"
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                : <><Upload className="w-4 h-4" /> Import {extracted.length} items</>}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}