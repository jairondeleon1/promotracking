import React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { KPI_WIDGETS } from "./kpis";
import { CHART_SECTIONS } from "./chartConfig";
import WidgetToggleGroup from "./WidgetToggleGroup";
import { BAR_BUTTON } from "./filters/barStyles";

export default function CustomizeViewSheet({ hidden, onChange }) {
  const toggle = (id, on) => onChange(on ? hidden.filter((h) => h !== id) : [...hidden, id]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" className={BAR_BUTTON}>
          <SlidersHorizontal /> Customize
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle className="font-heading">Customize your view</SheetTitle>
          <SheetDescription>Choose which metrics and charts appear. Your choices are saved for next time.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-5">
          <WidgetToggleGroup title="Key metrics" items={KPI_WIDGETS} hidden={hidden} onToggle={toggle} />
          {CHART_SECTIONS.map((s) => (
            <WidgetToggleGroup key={s.id} title={s.title} items={s.charts} hidden={hidden} onToggle={toggle} />
          ))}
          <Button variant="outline" className="w-full" disabled={!hidden.length} onClick={() => onChange([])}>
            Show everything
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}