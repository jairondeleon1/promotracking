import React from "react";

export default function ChartCard({ title, description, badge, isEmpty, children }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-heading text-sm font-semibold text-card-foreground">{title}</h3>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        {badge}
      </div>
      {isEmpty ? (
        <div className="flex flex-1 items-center justify-center py-12 text-sm text-muted-foreground">
          No data for the current filters
        </div>
      ) : children}
    </div>
  );
}