import React from "react";
import { Switch } from "@/components/ui/switch";

export default function WidgetToggleGroup({ title, items, hidden, onToggle }) {
  return (
    <div className="space-y-2">
      <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="divide-y divide-border rounded-xl border border-border">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
            <span>{item.label}</span>
            <Switch checked={!hidden.includes(item.id)} onCheckedChange={(on) => onToggle(item.id, on)} />
          </div>
        ))}
      </div>
    </div>
  );
}