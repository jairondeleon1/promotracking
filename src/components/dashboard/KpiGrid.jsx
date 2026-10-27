import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { KPI_WIDGETS, computeKpis } from "./kpis";
import KpiCard from "./KpiCard";

const COLS = { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5" };

export default function KpiGrid({ records, hidden }) {
  const values = useMemo(() => computeKpis(records), [records]);
  const items = KPI_WIDGETS.filter((k) => !hidden.includes(k.id));
  if (!items.length) return null;

  return (
    <div className={cn("grid grid-cols-2 gap-4 md:grid-cols-3", COLS[items.length])}>
      {items.map((k) => <KpiCard key={k.id} {...k} {...values[k.id]} />)}
    </div>
  );
}