import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

export default function DrillDownModal({ open, onClose, title, records }) {
  if (!records) return null;

  const cols = [
    { key: "date_run", label: "Date" },
    { key: "promotion", label: "Promotion" },
    { key: "marketplace", label: "Marketplace" },
    { key: "region", label: "Division" },
    { key: "manager_name", label: "Manager" },
    { key: "portions_sold", label: "Portions" },
    { key: "price_sold", label: "Price" },
    { key: "mobile_app", label: "Mobile App" },
    { key: "promoted_on_app", label: "On App?" },
    { key: "day_of_week", label: "Day" },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader className="pb-2 border-b border-slate-100">
          <DialogTitle className="text-base font-semibold text-slate-800">{title}</DialogTitle>
          <p className="text-xs text-slate-400 mt-0.5">{records.length} record{records.length !== 1 ? "s" : ""}</p>
        </DialogHeader>
        <div className="overflow-auto flex-1 mt-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 sticky top-0">
                {cols.map(c => (
                  <th key={c.key} className="text-left px-3 py-2 font-medium text-slate-500 whitespace-nowrap border-b border-slate-200">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                  {cols.map(c => (
                    <td key={c.key} className="px-3 py-1.5 text-slate-700 whitespace-nowrap border-b border-slate-100">
                      {r[c.key] != null && r[c.key] !== "" ? String(r[c.key]) : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}