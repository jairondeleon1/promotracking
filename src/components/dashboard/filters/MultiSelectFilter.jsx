import React from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { BAR_BUTTON, BAR_ACTIVE } from "./barStyles";

export default function MultiSelectFilter({ label, icon: Icon, options, selected, onChange }) {
  const toggle = (v) => onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  const summary = selected.length === 0
    ? label
    : selected.length === 1
      ? options.find((o) => o.value === selected[0])?.label || label
      : `${label} · ${selected.length}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className={cn(BAR_BUTTON, selected.length > 0 && BAR_ACTIVE)}>
          <Icon /> <span className="max-w-[140px] truncate">{summary}</span> <ChevronDown className="opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <Command>
          <CommandInput placeholder={`Search ${label.toLowerCase()}…`} />
          <CommandList>
            <CommandEmpty>No matches.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => {
                const on = selected.includes(o.value);
                return (
                  <CommandItem key={o.value} value={o.label} onSelect={() => toggle(o.value)}>
                    <span className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border border-primary",
                      on ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                    )}>
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="flex-1 truncate">{o.label}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">{o.count}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
          {selected.length > 0 && (
            <div className="border-t border-border p-1">
              <Button variant="ghost" size="sm" className="w-full" onClick={() => onChange([])}>Clear selection</Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}