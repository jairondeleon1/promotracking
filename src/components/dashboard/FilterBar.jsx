import React from "react";
import { Store, MapPin, Megaphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasActiveFilters } from "@/lib/dashboardFilters";
import DateRangeFilter from "./filters/DateRangeFilter";
import MonthSelect from "./filters/MonthSelect";
import MultiSelectFilter from "./filters/MultiSelectFilter";
import MetricToggle from "./filters/MetricToggle";
import CustomizeViewSheet from "./CustomizeViewSheet";

export default function FilterBar({ view, batches, options, onChange, onClear }) {
  return (
    <div className="sticky top-0 z-30 border-y border-hero-foreground/10 bg-hero/95 backdrop-blur">
      <div className="mx-auto flex max-w-screen-xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
        <DateRangeFilter value={view.range} onChange={(range) => onChange({ range })} />
        <MonthSelect batches={batches} value={view.batch} onChange={(batch) => onChange({ batch })} />
        <MultiSelectFilter label="Marketplace" icon={Store} options={options.marketplaces}
          selected={view.marketplaces} onChange={(marketplaces) => onChange({ marketplaces })} />
        <MultiSelectFilter label="Region" icon={MapPin} options={options.regions}
          selected={view.regions} onChange={(regions) => onChange({ regions })} />
        <MultiSelectFilter label="Promotion" icon={Megaphone} options={options.promotions}
          selected={view.promotions} onChange={(promotions) => onChange({ promotions })} />
        {hasActiveFilters(view) && (
          <Button variant="ghost" size="sm" onClick={onClear}
            className="text-hero-muted hover:bg-transparent hover:text-hero-foreground">
            <X /> Reset
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <MetricToggle value={view.metric} onChange={(metric) => onChange({ metric })} />
          <CustomizeViewSheet hidden={view.hidden} onChange={(hidden) => onChange({ hidden })} />
        </div>
      </div>
    </div>
  );
}