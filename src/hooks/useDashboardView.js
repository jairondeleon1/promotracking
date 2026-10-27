import { useEffect, useState } from "react";
import { DEFAULT_VIEW } from "@/lib/dashboardFilters";

// Dashboard view (filters, metric, hidden widgets) saved per user on this device.
export default function useDashboardView(userId) {
  const key = `promoview.view.${userId || "guest"}`;
  const [view, setView] = useState(() => ({ ...DEFAULT_VIEW, ...JSON.parse(localStorage.getItem(key) || "{}") }));

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(view));
  }, [key, view]);

  const updateView = (patch) => setView((v) => ({ ...v, ...patch }));
  return [view, updateView];
}