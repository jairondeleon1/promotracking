import React from "react";
import { CalendarRange } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { BAR_BUTTON, BAR_ACTIVE } from "./barStyles";

export default function MonthSelect({ batches, value, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn(BAR_BUTTON, "w-auto min-w-[150px] focus:ring-highlight", value !== "all" && BAR_ACTIVE)}>
        <CalendarRange className="h-4 w-4 shrink-0" />
        <SelectValue placeholder="All months" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All months</SelectItem>
        {batches.map((b) => (
          <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}