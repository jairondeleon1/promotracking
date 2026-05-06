import PptxGenJS from "pptxgenjs";

const BLUE = "2563EB";
const GREEN = "16A34A";
const PURPLE = "7C3AED";
const CYAN = "0891B2";
const ORANGE = "D97706";
const DARK = "1E293B";
const LIGHT_GRAY = "F1F5F9";
const MID_GRAY = "64748B";
const WHITE = "FFFFFF";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ── Aggregation helpers ──────────────────────────────────────────────────────

function aggregateByPromotion(records) {
  const map = {};
  records.forEach(r => {
    if (!r.promotion) return;
    map[r.promotion] = (map[r.promotion] || 0) + (r.portions_sold || 0);
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
}

function aggregateSalesByPromotion(records) {
  const map = {};
  records.forEach(r => {
    if (!r.promotion) return;
    map[r.promotion] = (map[r.promotion] || 0) + (r.total_promotion_sales || 0);
  });
  return Object.entries(map)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([k, v]) => [k, parseFloat(v.toFixed(2))]);
}

function aggregateAvgByPromotion(records) {
  const map = {};
  records.forEach(r => {
    if (!r.promotion) return;
    if (!map[r.promotion]) map[r.promotion] = { total: 0, days: new Set() };
    map[r.promotion].total += r.portions_sold || 0;
    if (r.date_run) map[r.promotion].days.add(r.date_run);
  });
  return Object.entries(map)
    .map(([k, v]) => [k, v.days.size > 0 ? parseFloat((v.total / v.days.size).toFixed(1)) : 0])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
}

function aggregateByDay(records) {
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

function aggregateAvgByMarketplace(records) {
  const map = {};
  records.forEach(r => {
    if (!r.marketplace) return;
    if (!map[r.marketplace]) map[r.marketplace] = { total: 0, days: new Set() };
    map[r.marketplace].total += r.portions_sold || 0;
    if (r.date_run) map[r.marketplace].days.add(r.date_run);
  });
  return Object.entries(map)
    .map(([k, v]) => [k.length > 18 ? k.slice(0, 16) + "…" : k, v.days.size > 0 ? parseFloat((v.total / v.days.size).toFixed(1)) : 0])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
}

// ── Slide builders ───────────────────────────────────────────────────────────

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
  const totalSales = records.reduce((s, r) => s + (r.total_promotion_sales || 0), 0);
  const uniquePromos = new Set(records.map(r => r.promotion)).size;
  const uniqueMkts = new Set(records.map(r => r.marketplace)).size;
  const appRate = records.length > 0
    ? Math.round((records.filter(r => (r.promoted_on_app || "").toLowerCase() === "yes").length / records.length) * 100)
    : 0;

  const kpis = [
    { label: "Total Portions Sold", value: totalPortions.toLocaleString() },
    { label: "Total Promotion Sales", value: `$${totalSales.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` },
    { label: "Unique Promotions", value: String(uniquePromos) },
    { label: "Marketplaces Active", value: String(uniqueMkts) },
    { label: "App Promotion Rate", value: `${appRate}%` },
  ];

  const positions = [
    { x: 0.3, y: 1.1 }, { x: 5.1, y: 1.1 },
    { x: 0.3, y: 2.8 }, { x: 5.1, y: 2.8 },
    { x: 2.7, y: 4.5 },
  ];

  kpis.forEach((kpi, i) => {
    const { x, y } = positions[i];
    slide.addShape(pptx.ShapeType.rect, { x, y, w: 4.4, h: 1.3, fill: { color: LIGHT_GRAY }, line: { color: "E2E8F0", w: 1 }, rounding: true });
    slide.addText(kpi.value, { x, y: y + 0.15, w: 4.4, h: 0.65, fontSize: 28, bold: true, color: BLUE, align: "center" });
    slide.addText(kpi.label, { x, y: y + 0.75, w: 4.4, h: 0.4, fontSize: 13, color: MID_GRAY, align: "center" });
  });
}

function addBarChartSlide(pptx, title, description, seriesName, chartData, color) {
  const slide = pptx.addSlide();
  slide.addText(title, {
    x: 0.4, y: 0.15, w: 9.2, h: 0.5,
    fontSize: 18, bold: true, color: DARK
  });
  if (description) {
    slide.addText(description, {
      x: 0.4, y: 0.65, w: 9.2, h: 0.35,
      fontSize: 10, color: MID_GRAY, italic: true
    });
  }

  const chartDataFormatted = [{
    name: seriesName || "Value",
    labels: chartData.map(d => d[0]),
    values: chartData.map(d => d[1]),
  }];

  slide.addChart(pptx.ChartType.bar, chartDataFormatted, {
    x: 0.4, y: 1.05, w: 9.2, h: 4.35,
    barDir: "bar",
    chartColors: [color || BLUE],
    showLegend: false,
    showValue: true,
    dataLabelFontSize: 10,
    valAxisLabelFontSize: 11,
    catAxisLabelFontSize: 10,
  });
}

function addGroupedBarChartSlide(pptx, title, description, groups, seriesData) {
  // seriesData: [{ name, values: [v per group] }]
  const slide = pptx.addSlide();
  slide.addText(title, {
    x: 0.4, y: 0.15, w: 9.2, h: 0.5,
    fontSize: 18, bold: true, color: DARK
  });
  if (description) {
    slide.addText(description, {
      x: 0.4, y: 0.65, w: 9.2, h: 0.35,
      fontSize: 10, color: MID_GRAY, italic: true
    });
  }

  const chartData = seriesData.map(s => ({
    name: s.name,
    labels: groups,
    values: s.values,
  }));

  const COLORS_LIST = ["2563EB", "DC2626", "16A34A", "D97706", "7C3AED", "0891B2", "DB2777", "0D9488", "B45309", "1E40AF"];

  slide.addChart(pptx.ChartType.bar, chartData, {
    x: 0.4, y: 1.05, w: 9.2, h: 4.35,
    barDir: "col",
    barGrouping: "stacked",
    chartColors: COLORS_LIST.slice(0, seriesData.length),
    showLegend: true,
    legendPos: "b",
    legendFontSize: 9,
    showValue: false,
    dataLabelFontSize: 9,
    valAxisLabelFontSize: 10,
    catAxisLabelFontSize: 9,
    catAxisLabelRotate: 35,
  });
}

function addTableSlide(pptx, records) {
  const slide = pptx.addSlide();
  slide.addText("Top Promotions by Region / Division", {
    x: 0.4, y: 0.15, w: 9.2, h: 0.5,
    fontSize: 18, bold: true, color: DARK
  });
  slide.addText("Ranks the top promotion + region combinations by total portions sold, including average daily performance.", {
    x: 0.4, y: 0.65, w: 9.2, h: 0.35,
    fontSize: 10, color: MID_GRAY, italic: true
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
    x: 0.4, y: 1.05, w: 9.2,
    fontSize: 11,
    border: { color: "E2E8F0" },
    colW: [3, 2.2, 1.5, 1.5, 1],
  });
}

function addMarketplaceTableSlide(pptx, records) {
  const slide = pptx.addSlide();
  slide.addText("Top Marketplaces by App", {
    x: 0.4, y: 0.15, w: 9.2, h: 0.5,
    fontSize: 18, bold: true, color: DARK
  });
  slide.addText("Ranks the top marketplace + mobile app combinations by total portions sold and daily average.", {
    x: 0.4, y: 0.65, w: 9.2, h: 0.35,
    fontSize: 10, color: MID_GRAY, italic: true
  });

  const map = {};
  records.forEach(r => {
    if (!r.marketplace) return;
    const raw = r.mobile_app && r.mobile_app.trim() ? r.mobile_app.trim() : "No App";
    const app = raw === "No App" ? raw : raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    const key = `${r.marketplace}||${app}`;
    if (!map[key]) map[key] = { marketplace: r.marketplace, app, total: 0, days: new Set() };
    map[key].total += r.portions_sold || 0;
    if (r.date_run) map[key].days.add(r.date_run);
  });

  const rows = Object.values(map)
    .map(v => ({ ...v, avg: v.days.size > 0 ? (v.total / v.days.size).toFixed(1) : "0" }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 15);

  const tableRows = [
    [
      { text: "Marketplace", options: { bold: true, color: WHITE, fill: PURPLE } },
      { text: "Mobile App", options: { bold: true, color: WHITE, fill: PURPLE } },
      { text: "Total Portions", options: { bold: true, color: WHITE, fill: PURPLE } },
      { text: "Avg Portions/Day", options: { bold: true, color: WHITE, fill: PURPLE } },
      { text: "Days Active", options: { bold: true, color: WHITE, fill: PURPLE } },
    ],
    ...rows.map((r, i) => [
      { text: r.marketplace, options: { fill: i % 2 === 0 ? WHITE : LIGHT_GRAY } },
      { text: r.app, options: { fill: i % 2 === 0 ? WHITE : LIGHT_GRAY } },
      { text: r.total.toLocaleString(), options: { align: "right", fill: i % 2 === 0 ? WHITE : LIGHT_GRAY } },
      { text: String(r.avg), options: { align: "right", fill: i % 2 === 0 ? WHITE : LIGHT_GRAY } },
      { text: String(r.days.size), options: { align: "right", fill: i % 2 === 0 ? WHITE : LIGHT_GRAY } },
    ])
  ];

  slide.addTable(tableRows, {
    x: 0.4, y: 1.05, w: 9.2,
    fontSize: 11,
    border: { color: "E2E8F0" },
    colW: [3.2, 2, 1.5, 1.5, 1],
  });
}

// Build grouped series for day-of-week × promotion
function buildDayByPromotionSeries(records) {
  const promos = [...new Set(records.map(r => r.promotion).filter(Boolean))].slice(0, 8);
  const byDayPromo = {};
  DAY_ORDER.forEach(d => { byDayPromo[d] = {}; promos.forEach(p => { byDayPromo[d][p] = 0; }); });
  records.forEach(r => {
    if (!r.day_of_week || !r.promotion || !promos.includes(r.promotion)) return;
    const day = r.day_of_week.trim().split(/\s*&\s*/)[0].trim();
    const norm = DAY_ORDER.find(d => d.toLowerCase() === day.toLowerCase());
    if (norm) byDayPromo[norm][r.promotion] += r.portions_sold || 0;
  });
  const activeDays = DAY_ORDER.filter(d => promos.some(p => byDayPromo[d][p] > 0));
  const groups = activeDays.map(d => d.slice(0, 3));
  const seriesData = promos.map(p => ({ name: p, values: activeDays.map(d => byDayPromo[d][p] || 0) }));
  return { groups, seriesData };
}

// Build grouped series for avg portions/day × promotion × region
function buildAvgByPromotionRegionSeries(records) {
  const byPromoRegion = {};
  records.forEach(r => {
    const promo = r.promotion || "Unknown";
    const region = r.region || "Unknown";
    const key = `${promo}||${region}`;
    if (!byPromoRegion[key]) byPromoRegion[key] = { promo, region, total: 0, days: new Set() };
    byPromoRegion[key].total += r.portions_sold || 0;
    if (r.date_run) byPromoRegion[key].days.add(r.date_run);
  });
  const regions = [...new Set(Object.values(byPromoRegion).map(v => v.region))].sort();
  const promos = [...new Set(Object.values(byPromoRegion).map(v => v.promo))];
  const sortedPromos = promos.map(promo => {
    const total = regions.reduce((s, region) => {
      const entry = byPromoRegion[`${promo}||${region}`];
      return s + (entry && entry.days.size > 0 ? entry.total / entry.days.size : 0);
    }, 0);
    return { promo, total };
  }).sort((a, b) => b.total - a.total).slice(0, 12).map(v => v.promo);

  const groups = sortedPromos;
  const seriesData = regions.map(region => ({
    name: region,
    values: sortedPromos.map(promo => {
      const entry = byPromoRegion[`${promo}||${region}`];
      return entry && entry.days.size > 0 ? parseFloat((entry.total / entry.days.size).toFixed(1)) : 0;
    }),
  }));
  return { groups, seriesData };
}

// ── Main export ──────────────────────────────────────────────────────────────

export async function exportToPptx(records, month) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = "Promotion Tracking Dashboard";

  const validRecords = records.filter(r => r.portions_sold > 0);

  // 1. Title
  addTitleSlide(pptx, month);

  // 2. KPIs
  addKpiSlide(pptx, validRecords);

  // 3. Total Portions by Promotion
  addBarChartSlide(
    pptx,
    "Total Portions Sold by Promotion",
    "Shows which promotions drove the highest total volume of portions sold.",
    "Portions",
    aggregateByPromotion(validRecords),
    BLUE
  );

  // 4. Total Sales ($) by Promotion
  addBarChartSlide(
    pptx,
    "Total Sales ($) by Promotion",
    "Shows total dollar sales generated per promotion.",
    "Sales ($)",
    aggregateSalesByPromotion(validRecords),
    GREEN
  );

  // 5. Avg Portions/Day by Promotion & Division (stacked grouped)
  const avgPromoRegion = buildAvgByPromotionRegionSeries(validRecords);
  addGroupedBarChartSlide(
    pptx,
    "Avg Portions/Day by Promotion & Division",
    "Compares the average daily portions sold per promotion, broken down by division.",
    avgPromoRegion.groups,
    avgPromoRegion.seriesData
  );

  // 6. Total Portions by Day of Week
  addBarChartSlide(
    pptx,
    "Total Portions Sold by Day of Week",
    "Reveals which days of the week generate the most promotion activity.",
    "Portions",
    aggregateByDay(validRecords),
    CYAN
  );

  // 7. Portions by Day of Week & Promotion (stacked)
  const dayByPromo = buildDayByPromotionSeries(validRecords);
  addGroupedBarChartSlide(
    pptx,
    "Total Portions by Day of Week & Promotion",
    "Shows how each promotion performs across different days of the week.",
    dayByPromo.groups,
    dayByPromo.seriesData
  );

  // 8. Total Portions by Marketplace
  addBarChartSlide(
    pptx,
    "Total Portions Sold by Marketplace",
    "Displays total portions sold at each marketplace.",
    "Portions",
    aggregateByMarketplace(validRecords),
    PURPLE
  );

  // 9. Avg Portions/Day by Marketplace
  addBarChartSlide(
    pptx,
    "Avg Portions/Day by Marketplace",
    "Shows the average daily portions sold per marketplace.",
    "Avg Portions/Day",
    aggregateAvgByMarketplace(validRecords),
    ORANGE
  );

  // 10. Top Promotions by Region table
  addTableSlide(pptx, validRecords);

  // 11. Top Marketplaces by App table
  addMarketplaceTableSlide(pptx, validRecords);

  const fileName = `Promotion_Dashboard_${month !== "all" ? month.replace(/\s/g, "_") : "All_Months"}.pptx`;
  await pptx.writeFile({ fileName });
}