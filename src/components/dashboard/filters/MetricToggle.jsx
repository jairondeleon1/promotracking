import React from "react";
import { cn } from "@/lib/utils";
import { METRICS } from "@/lib/promoMetrics";

export default function MetricToggle({ value, onChange }) {
  return (
    <div className="inline-flex h-9 items-center rounded-lg border border-hero-foreground/15 bg-hero-foreground/10 p-0.5">
      {Object.values(METRICS).map((m) => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          className={cn(
            "h-full rounded-md px-3 text-sm font-medium transition-colors",
            value === m.id ? "bg-hero-foreground text-hero shadow-sm" : "text-hero-muted hover:text-hero-foreground"
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}