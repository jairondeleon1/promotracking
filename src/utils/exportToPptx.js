import PptxGenJS from "pptxgenjs";

const BLUE = "2563EB";
const DARK = "1E293B";
const LIGHT_GRAY = "F1F5F9";
const MID_GRAY = "64748B";
const WHITE = "FFFFFF";

function aggregateByPromotion(records) {
  const map = {};
  records.forEach(r => {
    if (!r.promotion) return;
    map[r.promotion] = (map[r.promotion] || 0) + (r.portions_sold || 0);
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
}

function aggregateByDay(records) {
  const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const map = {};
  records.forEach(r => {
    if (!r.day_of_week) return;
    const day = r.day_of_week.trim().split(/\s*&\s*/)[0].trim();
    const norm = DAY_ORDER.find(d => d.toLowerCase() === day.toLowerCase());
    if (norm) map[norm] = (map[norm] || 0) + (r.portions_sold || 0);
  });
  return DAY_ORDER.filter(d => map[d] > 0).map(d => [d.slice(0, 3), map[d]]);
}

function aggregateByMarketplace(records) {
  const map = {};
  records.forEach(r => {
    if (!r.marketplace) return;
    map[r.marketplace] = (map[r.marketplace] || 0) + (r.portions_sold || 0);
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
}

function addTitleSlide(pptx, month) {
  const slide = pptx.addSlide();
  slide.background = { color: BLUE };
  slide.addText("Promotion Tracking Dashboard", {
    x: 0.5, y: 1.8, w: 9, h: 1,
    fontSize: 36, bold: true, color: WHITE, align: "center"
  });
  slide.addText(month !== "all" ? month : "All Months", {
    x: 0.5, y: 2.9, w: 9, h: 0.6,
    fontSize: 20, color: "BFD4F7", align: "center"
  });
  slide.addText(`Generated ${new Date().toLocaleDateString()}`, {
    x: 0.5, y: 4.2, w: 9, h: 0.4,
    fontSize: 12, color: "9EC0FF", align: "center"
  });
}

function addKpiSlide(pptx, records) {
  const slide = pptx.addSlide();
  slide.addText("Summary KPIs", {
    x: 0.4, y: 0.2, w: 9.2, h: 0.55,
    fontSize: 22, bold: true, color: DARK
  });

  const totalPortions = records.reduce((s, r) => s + (r.portions_sold || 0), 0);
  const uniquePromos = new Set(records.map(r => r.promotion)).size;
  const uniqueMkts = new Set(records.map(r => r.marketplace)).size;
  const appRate = records.length > 0
    ? Math.round((records.filter(r => (r.promoted_on_app || "").toLowerCase() === "yes").length / records.length) * 100)
    : 0;

  const kpis = [
    { label: "Total Portions Sold", value: totalPortions.toLocaleString() },
    { label: "Unique Promotions", value: String(uniquePromos) },
    { label: "Marketplaces Active", value: String(uniqueMkts) },
    { label: "App Promotion Rate", value: `${appRate}%` },
  ];

  kpis.forEach((kpi, i) => {
    const x = 0.3 + (i % 2) * 4.8;
    const y = 1.1 + Math.floor(i / 2) * 1.6;
    slide.addShape(pptx.ShapeType.rect, { x, y, w: 4.4, h: 1.3, fill: { color: LIGHT_GRAY }, line: { color: "E2E8F0", w: 1 }, rounding: true });
    slide.addText(kpi.value, { x, y: y + 0.15, w: 4.4, h: 0.65, fontSize: 28, bold: true, color: BLUE, align: "center" });
    slide.addText(kpi.label, { x, y: y + 0.75, w: 4.4, h: 0.4, fontSize: 13, color: MID_GRAY, align: "center" });
  });
}

function addBarChartSlide(pptx, title, chartData, color) {
  const slide = pptx.addSlide();
  slide.addText(title, {
    x: 0.4, y: 0.2, w: 9.2, h: 0.55,
    fontSize: 18, bold: true, color: DARK
  });

  const chartDataFormatted = [{
    name: "Portions",
    labels: chartData.map(d => d[0]),
    values: chartData.map(d => d[1]),
  }];

  slide.addChart(pptx.ChartType.bar, chartDataFormatted, {
    x: 0.4, y: 0.9, w: 9.2, h: 4.5,
    barDir: "bar",
    chartColors: [color || BLUE],
    showLegend: false,
    showValue: true,
    dataLabelFontSize: 10,
    valAxisLabelFontSize: 11,
    catAxisLabelFontSize: 11,
    valAxisMajorUnit: undefined,
  });
}

function addTableSlide(pptx, records) {
  const slide = pptx.addSlide();
  slide.addText("Top Promotions by Region", {
    x: 0.4, y: 0.2, w: 9.2, h: 0.55,
    fontSize: 18, bold: true, color: DARK
  });

  const map = {};
  records.forEach(r => {
    if (!r.promotion || !r.region) return;
    const key = `${r.promotion}||${r.region}`;
    if (!map[key]) map[key] = { promotion: r.promotion, region: r.region, total: 0, days: new Set() };
    map[key].total += r.portions_sold || 0;
    map[key].days.add(r.date_run);
  });

  const rows = Object.values(map)
    .map(v => ({ ...v, avg: v.days.size > 0 ? (v.total / v.days.size).toFixed(1) : "0" }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 15);

  const tableRows = [
    [
      { text: "Promotion", options: { bold: true, color: WHITE, fill: BLUE } },
      { text: "Region / Division", options: { bold: true, color: WHITE, fill: BLUE } },
      { text: "Total Portions", options: { bold: true, color: WHITE, fill: BLUE } },
      { text: "Avg Portions/Day", options: { bold: true, color: WHITE, fill: BLUE } },
      { text: "Days Run", options: { bold: true, color: WHITE, fill: BLUE } },
    ],
    ...rows.map((r, i) => [
      { text: r.promotion, options: { fill: i % 2 === 0 ? WHITE : LIGHT_GRAY } },
      { text: r.region, options: { fill: i % 2 === 0 ? WHITE : LIGHT_GRAY } },
      { text: r.total.toLocaleString(), options: { align: "right", fill: i % 2 === 0 ? WHITE : LIGHT_GRAY } },
      { text: String(r.avg), options: { align: "right", fill: i % 2 === 0 ? WHITE : LIGHT_GRAY } },
      { text: String(r.days.size), options: { align: "right", fill: i % 2 === 0 ? WHITE : LIGHT_GRAY } },
    ])
  ];

  slide.addTable(tableRows, {
    x: 0.4, y: 0.9, w: 9.2,
    fontSize: 11,
    border: { color: "E2E8F0" },
    colW: [3, 2.2, 1.5, 1.5, 1],
  });
}

export async function exportToPptx(records, month) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = "Promotion Tracking Dashboard";

  const validRecords = records.filter(r => r.portions_sold > 0);

  addTitleSlide(pptx, month);
  addKpiSlide(pptx, validRecords);
  addBarChartSlide(pptx, "Total Portions Sold by Promotion", aggregateByPromotion(validRecords), BLUE);
  addBarChartSlide(pptx, "Total Portions Sold by Day of Week", aggregateByDay(validRecords), "0891B2");
  addBarChartSlide(pptx, "Total Portions Sold by Marketplace", aggregateByMarketplace(validRecords), "7C3AED");
  addTableSlide(pptx, validRecords);

  const fileName = `Promotion_Dashboard_${month !== "all" ? month.replace(/\s/g, "_") : "All_Months"}.pptx`;
  await pptx.writeFile({ fileName });
}