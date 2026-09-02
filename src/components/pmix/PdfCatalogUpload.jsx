import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, FileText, CheckCircle2, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// JSON schema the LLM must return: a list of promotion catalog items
const EXTRACT_SCHEMA = {
  type: "object",
  properties: {
    sell_period: { type: "string", description: "The sell period shown on the sheet, e.g. July 2026" },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          promotion_category: { type: "string" },
          din: { type: "string" },
          manufacturer_min: { type: "string" },
          brand: { type: "string" },
          description: { type: "string" },
          pack_size: { type: "string" },
          promotion_name: { type: "string" },
          price: { type: "string" },
          est_delivery: { type: "string" },
          upc: { type: "string" },
          srp: { type: "string" },
          notes: { type: "string" },
        },
      },
    },
  },
  required: ["items"],
};

export default function PdfCatalogUpload({ sellPeriod, onExtracted }) {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [status, setStatus] = useState(null); // null | "uploading" | "extracting" | "preview" | "saving" | "success" | "error"
  const [message, setMessage] = useState("");
  const [extracted, setExtracted] = useState(null); // { sell_period, items }
  const [overridePeriod, setOverridePeriod] = useState("");

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setStatus(null);
    setExtracted(null);
    setFileUrl("");
  };

  const handleExtract = async () => {
    if (!file) return;
    setStatus("uploading");
    setMessage("Uploading PDF...");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFileUrl(file_url);

      setStatus("extracting");
      setMessage("Reading the PDF with AI — this can take 20-40 seconds...");
      const prompt = `You are analyzing a foodservice promotion "Opt-In" sheet (PDF). Extract every promoted item listed on the sheet.
For each item capture: promotion category (e.g. BOH BROADLINE, BEVERAGE BUMPER), DIN / distributor item number, manufacturer MIN, brand, item description, pack size, promotion name (e.g. Grilling Month, Seasonal Cookie), promotion price, estimated delivery, UPC, suggested retail price (SRP), and any notes.
Also capture the overall sell period shown on the sheet (e.g. "July 2026").
Return ALL items on the sheet — do not summarize or truncate. If a field is missing for an item, leave it empty string. Do not invent values.`;
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [file_url],
        response_json_schema: EXTRACT_SCHEMA,
      });
      const items = (res && res.items) || [];
      if (items.length === 0) {
        setStatus("error");
        setMessage("No items could be extracted from this PDF. Try a clearer scan or a different file.");
        return;
      }
      setExtracted({ sell_period: res.sell_period || "", items });
      setOverridePeriod(res.sell_period || sellPeriod || "");
      setStatus("preview");
      setMessage(`Extracted ${items.length} items.`);
    } catch (err) {
      setStatus("error");
      setMessage("Extraction failed: " + (err?.message || "unknown error"));
    }
  };

  const handleSave = async () => {
    if (!extracted) return;
    setStatus("saving");
    const period = (overridePeriod || sellPeriod || extracted.sell_period || "").trim();
    const records = extracted.items.map(it => ({
      sell_period: period,
      promotion_category: it.promotion_category || "",
      din: it.din || "",
      manufacturer_min: it.manufacturer_min || "",
      brand: it.brand || "",
      description: it.description || "",
      pack_size: it.pack_size || "",
      promotion_name: it.promotion_name || "",
      price: it.price || "",
      est_delivery: it.est_delivery || "",
      upc: it.upc || "",
      srp: it.srp || "",
      notes: it.notes || "",
    }));
    try {
      const chunkSize = 50;
      for (let i = 0; i < records.length; i += chunkSize) {
        await base44.entities.PromotionCatalog.bulkCreate(records.slice(i, i + chunkSize));
      }
      setStatus("success");
      setMessage(`Saved ${records.length} items to the catalog for "${period}".`);
      onExtracted();
      setFile(null);
      setExtracted(null);
      setFileUrl("");
    } catch (err) {
      setStatus("error");
      setMessage("Save failed: " + (err?.message || "unknown error"));
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
          <Sparkles className="w-4 h-4 text-blue-600" /> Import from Opt-In PDF
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Opt-In Sheet (PDF)</Label>
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-5 text-center hover:border-blue-400 transition-colors">
            <FileText className="w-6 h-6 text-slate-300 mx-auto mb-1" />
            <input type="file" accept=".pdf" onChange={handleFile} className="hidden" id="pdf-input" />
            <label htmlFor="pdf-input" className="cursor-pointer text-sm text-blue-600 hover:underline font-medium">
              {file ? file.name : "Click to select an Opt-In PDF"}
            </label>
            <p className="text-xs text-slate-400 mt-1">AI reads the sheet and extracts every promoted item</p>
          </div>
        </div>

        {status === "preview" && extracted && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle2 className="w-4 h-4" /> {message}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Sell Period (edit if wrong)</Label>
              <Input value={overridePeriod} onChange={e => setOverridePeriod(e.target.value)} className="max-w-xs" />
            </div>
            <div className="overflow-x-auto rounded border border-slate-200 max-h-64">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    {["Category", "DIN", "Brand", "Description", "Promotion", "Price"].map(h => (
                      <th key={h} className="px-2 py-1.5 text-left text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {extracted.items.slice(0, 50).map((it, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="px-2 py-1.5 text-slate-600 whitespace-nowrap">{it.promotion_category || "—"}</td>
                      <td className="px-2 py-1.5 text-slate-600 font-mono whitespace-nowrap">{it.din || "—"}</td>
                      <td className="px-2 py-1.5 text-slate-700 whitespace-nowrap">{it.brand || "—"}</td>
                      <td className="px-2 py-1.5 text-slate-700 max-w-[220px] truncate">{it.description || "—"}</td>
                      <td className="px-2 py-1.5 text-slate-600 whitespace-nowrap">{it.promotion_name || "—"}</td>
                      <td className="px-2 py-1.5 text-slate-600">{it.price || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {extracted.items.length > 50 && (
                <p className="text-xs text-slate-400 text-center py-1">+{extracted.items.length - 50} more items</p>
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
            <Button onClick={handleExtract} disabled={!file || status === "uploading" || status === "extracting"} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              {status === "uploading" || status === "extracting" ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {status === "uploading" ? "Uploading..." : "Extracting..."}</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Extract Items</>
              )}
            </Button>
          )}
          {status === "preview" && (
            <Button onClick={handleSave} disabled={status === "saving"} className="bg-green-600 hover:bg-green-700 text-white gap-2">
              {status === "saving" ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Upload className="w-4 h-4" /> Save {extracted.items.length} items to Catalog</>}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}