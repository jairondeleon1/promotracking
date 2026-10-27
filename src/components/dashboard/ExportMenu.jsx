import React, { useState } from "react";
import { Download, ChevronDown, Loader2, Presentation, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BAR_BUTTON } from "./filters/barStyles";

export default function ExportMenu({ disabled, onExportReport, onExportChefTables }) {
  const [busy, setBusy] = useState(false);
  const run = async (fn) => {
    setBusy(true);
    await fn();
    setBusy(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" disabled={disabled || busy} className={BAR_BUTTON}>
          {busy ? <Loader2 className="animate-spin" /> : <Download />}
          <span className="hidden sm:inline">Export</span>
          <ChevronDown className="opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem onSelect={() => run(onExportReport)} className="items-start gap-3 py-2">
          <Presentation className="mt-0.5 h-4 w-4" />
          <div>
            <p className="font-medium">Full report (PPTX)</p>
            <p className="text-xs text-muted-foreground">Matches your current filters</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run(onExportChefTables)} className="items-start gap-3 py-2">
          <ChefHat className="mt-0.5 h-4 w-4" />
          <div>
            <p className="font-medium">Chef Tables data (PPTX)</p>
            <p className="text-xs text-muted-foreground">All Chef Table promotions</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}