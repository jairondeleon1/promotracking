import React from "react";
import { cn } from "@/lib/utils";

export default function KpiCard({ label, icon: Icon, tone, value, caption }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("rounded-lg p-2", tone)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 font-heading text-2xl font-bold tracking-tight tabular-nums text-card-foreground xl:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}