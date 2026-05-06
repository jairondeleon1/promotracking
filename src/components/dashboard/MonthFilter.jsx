import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";

export default function MonthFilter({ months, selected, onChange }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Calendar className="w-4 h-4 text-slate-400" />
      <Select value={selected} onValueChange={onChange}>
        <SelectTrigger className="w-48 bg-white border-slate-200">
          <SelectValue placeholder="All months" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Months</SelectItem>
          {months.map(m => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}