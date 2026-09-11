export function exportToCsv(records, stationLabel) {
  const headers = [
    "Marketplace",
    "Location (Region)",
    "Promotion",
    "Business Type",
    "Date Run",
    "Day of Week",
    "Mobile App",
    "Promoted on App",
    "Portions Sold",
    "Total Promotion Sales",
  ];

  const rows = records.map(r => [
    r.marketplace || "",
    r.region || "",
    r.promotion || "",
    r.business_type || "",
    r.date_run || "",
    r.day_of_week || "",
    r.mobile_app || "",
    r.promoted_on_app || "",
    r.portions_sold ?? "",
    r.total_promotion_sales ?? "",
  ]);

  const escape = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const csv = [headers, ...rows].map(row => row.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeName = (stationLabel || "all").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  a.href = url;
  a.download = `promotion-data-${safeName}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}