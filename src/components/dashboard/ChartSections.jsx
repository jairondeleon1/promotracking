import React from "react";
import { CHART_SECTIONS } from "./chartConfig";

export default function ChartSections({ hidden, records, allRecords, metric }) {
  return CHART_SECTIONS.map((section) => {
    const charts = section.charts.filter((c) => !hidden.includes(c.id));
    if (!charts.length) return null;
    return (
      <section key={section.id}>
        <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="font-heading text-lg font-semibold">{section.title}</h2>
          <p className="text-sm text-muted-foreground">{section.description}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {charts.map((c) => {
            const Component = c.Component;
            return (
              <div key={c.id} className={c.wide || charts.length === 1 ? "lg:col-span-2" : ""}>
                <Component config={c} records={records} allRecords={allRecords} metric={metric} />
              </div>
            );
          })}
        </div>
      </section>
    );
  });
}