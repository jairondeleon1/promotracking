import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";

export default function MonthFilter({ batches, selected, onChange }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Calendar className="w-4 h-4 text-slate-400" />
      <Select value={selected} onValueChange={onChange}>
        <SelectTrigger className="w-56 bg-white border-slate-200">
          <SelectValue placeholder="All uploads" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Uploads</SelectItem>
          {batches.map(b => (
            <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}