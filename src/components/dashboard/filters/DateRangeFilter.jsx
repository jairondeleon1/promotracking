import React, { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { RANGE_PRESETS, rangeLabel } from "@/lib/dateRanges";
import { BAR_BUTTON, BAR_ACTIVE } from "./barStyles";

export default function DateRangeFilter({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = value.preset === "custom" && value.from
    ? { from: new Date(value.from), to: value.to ? new Date(value.to) : undefined }
    : undefined;

  const pickPreset = (id) => {
    onChange({ preset: id, from: null, to: null });
    if (id !== "custom") setOpen(false);
  };
  const pickDays = (range) =>
    onChange({ preset: "custom", from: range?.from?.toISOString() || null, to: range?.to?.toISOString() || null });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className={cn(BAR_BUTTON, value.preset !== "all" && BAR_ACTIVE)}>
          <CalendarDays /> {rangeLabel(value)} <ChevronDown className="opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="flex flex-col gap-0.5 border-b border-border p-2 sm:w-44 sm:border-b-0 sm:border-r">
            {RANGE_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => pickPreset(p.id)}
                className={cn(
                  "rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                  value.preset === p.id && "bg-accent font-semibold text-accent-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={selected}
            defaultMonth={selected?.from || subMonths(new Date(), 1)}
            onSelect={pickDays}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}