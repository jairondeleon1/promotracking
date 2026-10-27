import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, Upload, FilterX, Inbox } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { exportToPptx, exportDataOnlyPptx } from "@/utils/exportToPptx";
import { getRunDate } from "@/lib/runDates";
import { normKey } from "@/lib/promoAggregations";
import { applyFilters, buildOptions, getBatches, describeView, CLEARED_FILTERS } from "@/lib/dashboardFilters";
import useDashboardView from "@/hooks/useDashboardView";
import TopBar from "@/components/layout/TopBar";
import DashboardHero from "@/components/dashboard/DashboardHero";
import FilterBar from "@/components/dashboard/FilterBar";
import ExportMenu from "@/components/dashboard/ExportMenu";
import KpiGrid from "@/components/dashboard/KpiGrid";
import ChartSections from "@/components/dashboard/ChartSections";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import EmptyState from "@/components/dashboard/EmptyState";

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedView, updateView] = useDashboardView(user?.id);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.PromotionRecord.list("-created_date", 2000);
    setRecords(data.map((r) => ({ ...r, _date: getRunDate(r) })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const batches = useMemo(() => getBatches(records), [records]);
  const options = useMemo(() => ({
    marketplaces: buildOptions(records, "marketplace"),
    regions: buildOptions(records, "region"),
    promotions: buildOptions(records, "promotion"),
  }), [records]);
  const view = useMemo(
    () => ({ ...savedView, batch: batches.some((b) => b.id === savedView.batch) ? savedView.batch : "all" }),
    [savedView, batches]
  );
  const filtered = useMemo(() => applyFilters(records, view), [records, view]);
  const valid = useMemo(() => filtered.filter((r) => r.portions_sold > 0), [filtered]);

  const marketplaceCount = new Set(valid.map((r) => normKey(r.marketplace)).filter(Boolean)).size;
  const summary = loading
    ? "Loading your latest results…"
    : `${describeView(view, batches, options, " · ") || "All time"} · ${valid.length.toLocaleString()} promotion runs across ${marketplaceCount} marketplaces`;

  const exportReport = () => exportToPptx(filtered, describeView(view, batches, options, " - ") || "all");
  const exportChefTables = () => exportDataOnlyPptx(
    records.filter((r) => {
      const p = (r.promotion || "").trim().toLowerCase();
      return p.includes("chef") && p.includes("table");
    }),
    "Chef Tables"
  );

  let body;
  if (loading) {
    body = <DashboardSkeleton />;
  } else if (!records.length) {
    body = (
      <EmptyState icon={Inbox} title="No data yet"
        description={isAdmin ? "Upload your first file to start tracking promotions." : "Promotion results will appear here once data has been published."}
        action={isAdmin && <Button asChild><Link to="/upload">Upload CSV</Link></Button>} />
    );
  } else if (!filtered.length) {
    body = (
      <EmptyState icon={FilterX} title="No promotions match these filters"
        description="Try a wider time range or clear some filters."
        action={<Button variant="outline" onClick={() => updateView(CLEARED_FILTERS)}>Reset filters</Button>} />
    );
  } else {
    body = (
      <>
        <KpiGrid records={valid} hidden={view.hidden} />
        <ChartSections records={valid} allRecords={filtered} metric={view.metric} hidden={view.hidden} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar isAdmin={isAdmin}>
        <Button variant="ghost" size="icon" onClick={load} disabled={loading} aria-label="Refresh data"
          className="text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground">
          <RefreshCw className={loading ? "animate-spin" : ""} />
        </Button>
        <ExportMenu disabled={loading || !records.length} onExportReport={exportReport} onExportChefTables={exportChefTables} />
        {isAdmin && (
          <Button asChild className="hidden bg-highlight text-highlight-foreground hover:bg-highlight/90 sm:inline-flex">
            <Link to="/upload"><Upload /> Upload CSV</Link>
          </Button>
        )}
      </TopBar>
      <DashboardHero user={user} summary={summary} />
      <FilterBar view={view} batches={batches} options={options} onChange={updateView} onClear={() => updateView(CLEARED_FILTERS)} />
      <main className="mx-auto max-w-screen-xl space-y-10 px-4 py-8 sm:px-6">{body}</main>
    </div>
  );
}