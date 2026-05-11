import PptxGenJS from "pptxgenjs";

// ── Color palette (inspired by the Eurest template style) ───────────────────
const NAVY      = "1E2A3A";   // dark navy (header bars, dark cards)
const GOLD      = "F5A623";   // gold accent
const WHITE     = "FFFFFF";
const OFF_WHITE = "F4F5F7";   // light card bg
const MID_GRAY  = "64748B";
const DARK_TEXT = "1E2A3A";
const BLUE      = "2563EB";
const GREEN     = "16A34A";
const PURPLE    = "7C3AED";
const CYAN      = "0891B2";
const ORANGE    = "D97706";

const DAY_ORDER = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

// ── Aggregation helpers ──────────────────────────────────────────────────────

function aggregateByPromotion(records) {
  const map = {};
  records.forEach(r => { if (!r.promotion) return; map[r.promotion] = (map[r.promotion] || 0) + (r.portions_sold || 0); });
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
}

function aggregateSalesByPromotion(records) {
  const map = {};
  records.forEach(r => { if (!r.promotion) return; map[r.promotion] = (map[r.promotion] || 0) + (r.total_promotion_sales || 0); });
  return Object.entries(map).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 10)
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
  return Object.entries(map).map(([k, v]) => [k, v.days.size > 0 ? parseFloat((v.total / v.days.size).toFixed(1)) : 0])
    .sort((a, b) => b[1] - a[1]).slice(0, 10);
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
  records.forEach(r => { if (!r.marketplace) return; map[r.marketplace] = (map[r.marketplace] || 0) + (r.portions_sold || 0); });
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
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
    .map(([k, v]) => [k.length > 22 ? k.slice(0, 20) + "…" : k, v.days.size > 0 ? parseFloat((v.total / v.days.size).toFixed(1)) : 0])
    .sort((a, b) => b[1] - a[1]);
}

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
  return {
    groups: activeDays.map(d => d.slice(0, 3)),
    seriesData: promos.map(p => ({ name: p, values: activeDays.map(d => byDayPromo[d][p] || 0) })),
  };
}

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
  const sortedPromos = promos.map(promo => ({
    promo,
    total: regions.reduce((s, region) => { const e = byPromoRegion[`${promo}||${region}`]; return s + (e && e.days.size > 0 ? e.total / e.days.size : 0); }, 0),
  })).sort((a, b) => b.total - a.total).slice(0, 12).map(v => v.promo);
  return {
    groups: sortedPromos,
    seriesData: regions.map(region => ({
      name: region,
      values: sortedPromos.map(promo => { const e = byPromoRegion[`${promo}||${region}`]; return e && e.days.size > 0 ? parseFloat((e.total / e.days.size).toFixed(1)) : 0; }),
    })),
  };
}

// ── Shared layout helpers ────────────────────────────────────────────────────

/** Adds the dark navy header bar + bold uppercase title to a slide */
function addSlideHeader(slide, title) {
  slide.addShape("rect", { x: 0, y: 0, w: "100%", h: 0.95, fill: { color: NAVY } });
  slide.addText(title.toUpperCase(), {
    x: 0.4, y: 0.1, w: 12.5, h: 0.75,
    fontSize: 22, bold: true, color: WHITE, fontFace: "Calibri",
  });
}

/** Adds a small gold accent bar at the very bottom of a slide */
function addFooterBar(slide) {
  slide.addShape("rect", { x: 0, y: 7.3, w: "100%", h: 0.2, fill: { color: GOLD } });
}

// ── Slide builders ───────────────────────────────────────────────────────────

function addTitleSlide(pptx, month) {
  const slide = pptx.addSlide();
  slide.background = { color: NAVY };
  // Gold accent stripe at very bottom
  slide.addShape("rect", { x: 0, y: 7.3, w: "100%", h: 0.2, fill: { color: GOLD } });
  slide.addText("PROMOTION TRACKING", {
    x: 0.6, y: 1.8, w: 8.8, h: 1.0,
    fontSize: 44, bold: true, color: WHITE, fontFace: "Calibri", align: "left",
  });
  slide.addText((month !== "all" ? month : "All Months").toUpperCase(), {
    x: 0.6, y: 2.9, w: 8.8, h: 0.7,
    fontSize: 28, color: GOLD, fontFace: "Calibri", bold: true,
  });
  slide.addText(`Generated ${new Date().toLocaleDateString()}`, {
    x: 0.6, y: 3.75, w: 5, h: 0.4,
    fontSize: 12, color: "8DA4BF", fontFace: "Calibri",
  });
}

function addKpiSlide(pptx, records) {
  const slide = pptx.addSlide();
  slide.background = { color: WHITE };
  addSlideHeader(slide, "Summary KPIs");
  addFooterBar(slide);

  const totalPortions = records.reduce((s, r) => s + (r.portions_sold || 0), 0);
  const totalSales = records.reduce((s, r) => s + (r.total_promotion_sales || 0), 0);
  const uniquePromos = new Set(records.map(r => r.promotion)).size;
  const uniqueMkts = new Set(records.map(r => r.marketplace)).size;
  const appRate = records.length > 0
    ? Math.round((records.filter(r => (r.promoted_on_app || "").toLowerCase() === "yes").length / records.length) * 100) : 0;

  const kpis = [
    { label: "TOTAL PORTIONS SOLD", value: totalPortions.toLocaleString() },
    { label: "TOTAL PROMOTION SALES", value: `$${totalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
    { label: "UNIQUE PROMOTIONS", value: String(uniquePromos) },
    { label: "MARKETPLACES ACTIVE", value: String(uniqueMkts) },
    { label: "APP PROMOTION RATE", value: `${appRate}%` },
  ];

  // 5 dark cards spanning the full slide width (LAYOUT_WIDE = 13.33" wide)
  const slideW = 13.33;
  const margin = 0.2;
  const gap = 0.1;
  const cardW = (slideW - margin * 2 - gap * 4) / 5;
  const cardH = 5.9;
  const cardY = 1.1;
  kpis.forEach((kpi, i) => {
    const x = margin + i * (cardW + gap);
    slide.addShape("rect", { x, y: cardY, w: cardW, h: cardH, fill: { color: NAVY }, rounding: true });
    slide.addText(kpi.value, {
      x, y: cardY + 2.0, w: cardW, h: 1.1,
      fontSize: 28, bold: true, color: GOLD, align: "center", fontFace: "Calibri",
    });
    slide.addText(kpi.label, {
      x, y: cardY + 3.2, w: cardW, h: 0.8,
      fontSize: 10, color: "8DA4BF", align: "center", fontFace: "Calibri", bold: true,
    });
  });
}

function addBarChartSlide(pptx, title, description, seriesName, chartData, color) {
  const slide = pptx.addSlide();
  slide.background = { color: WHITE };
  addSlideHeader(slide, title);
  addFooterBar(slide);

  if (description) {
    slide.addText(description, {
      x: 0.4, y: 0.98, w: 12.5, h: 0.38,
      fontSize: 13, color: MID_GRAY, italic: true, fontFace: "Calibri",
    });
  }

  const chartDataFormatted = [{
    name: seriesName || "Value",
    labels: chartData.map(d => d[0]),
    values: chartData.map(d => d[1]),
  }];

  slide.addChart(pptx.ChartType.bar, chartDataFormatted, {
    x: 0.4, y: 1.38, w: 12.5, h: 5.7,
    barDir: "bar",
    chartColors: [color || NAVY],
    showLegend: false,
    showValue: true,
    dataLabelFontSize: 9,
    dataLabelColor: DARK_TEXT,
    valAxisLabelFontSize: 10,
    catAxisLabelFontSize: 9,
    plotAreaBorderColor: "EBEBEB",
    plotAreaBorderWidth: 1,
  });
}

function addGroupedBarChartSlide(pptx, title, description, groups, seriesData) {
  const slide = pptx.addSlide();
  slide.background = { color: WHITE };
  addSlideHeader(slide, title);
  addFooterBar(slide);

  if (description) {
    slide.addText(description, {
      x: 0.4, y: 0.98, w: 12.5, h: 0.38,
      fontSize: 13, color: MID_GRAY, italic: true, fontFace: "Calibri",
    });
  }

  const COLORS_LIST = ["2563EB","DC2626","16A34A","D97706","7C3AED","0891B2","DB2777","0D9488","B45309","1E40AF"];
  const chartData = seriesData.map(s => ({ name: s.name, labels: groups, values: s.values }));

  slide.addChart(pptx.ChartType.bar, chartData, {
    x: 0.4, y: 1.38, w: 12.5, h: 5.7,
    barDir: "col",
    barGrouping: "stacked",
    chartColors: COLORS_LIST.slice(0, seriesData.length),
    showLegend: true,
    legendPos: "b",
    legendFontSize: 9,
    showValue: false,
    valAxisLabelFontSize: 10,
    catAxisLabelFontSize: 9,
    catAxisLabelRotate: 35,
    plotAreaBorderColor: "EBEBEB",
    plotAreaBorderWidth: 1,
  });
}

function addTableSlide(pptx, records) {
  const slide = pptx.addSlide();
  slide.background = { color: WHITE };
  addSlideHeader(slide, "Top Promotions by Region / Division");
  addFooterBar(slide);

  slide.addText("Ranks the top promotion + region combinations by total portions sold, including average daily performance.", {
    x: 0.4, y: 0.98, w: 12.5, h: 0.38,
    fontSize: 13, color: MID_GRAY, italic: true, fontFace: "Calibri",
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
    .sort((a, b) => b.total - a.total).slice(0, 30);

  const hOpts = { bold: true, color: WHITE, fill: NAVY, fontFace: "Calibri", fontSize: 10 };
  const tableRows = [
    [
      { text: "PROMOTION", options: hOpts },
      { text: "REGION / DIVISION", options: hOpts },
      { text: "TOTAL PORTIONS", options: { ...hOpts, align: "right" } },
      { text: "AVG PORTIONS/DAY", options: { ...hOpts, align: "right" } },
      { text: "DAYS RUN", options: { ...hOpts, align: "right" } },
    ],
    ...rows.map((r, i) => {
      const bg = i % 2 === 0 ? WHITE : OFF_WHITE;
      const cell = (text, align = "left") => ({ text: String(text), options: { fill: bg, fontSize: 10, fontFace: "Calibri", color: DARK_TEXT, align } });
      return [cell(r.promotion), cell(r.region), cell(r.total.toLocaleString(), "right"), cell(r.avg, "right"), cell(r.days.size, "right")];
    }),
  ];

  slide.addTable(tableRows, {
    x: 0.4, y: 1.38, w: 12.5,
    border: { color: "E2E8F0", pt: 0.5 },
    colW: [4.2, 3.0, 2.0, 2.0, 1.3],
  });
}

function addMarketplaceTableSlide(pptx, records) {
  const slide = pptx.addSlide();
  slide.background = { color: WHITE };
  addSlideHeader(slide, "Top Marketplaces by Mobile App");
  addFooterBar(slide);

  slide.addText("Ranks the top marketplace + mobile app combinations by total portions sold and daily average.", {
    x: 0.4, y: 0.98, w: 12.5, h: 0.38,
    fontSize: 13, color: MID_GRAY, italic: true, fontFace: "Calibri",
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
    .sort((a, b) => b.total - a.total).slice(0, 30);

  const hOpts = { bold: true, color: WHITE, fill: NAVY, fontFace: "Calibri", fontSize: 10 };
  const tableRows = [
    [
      { text: "MARKETPLACE", options: hOpts },
      { text: "MOBILE APP", options: hOpts },
      { text: "TOTAL PORTIONS", options: { ...hOpts, align: "right" } },
      { text: "AVG PORTIONS/DAY", options: { ...hOpts, align: "right" } },
      { text: "DAYS ACTIVE", options: { ...hOpts, align: "right" } },
    ],
    ...rows.map((r, i) => {
      const bg = i % 2 === 0 ? WHITE : OFF_WHITE;
      const cell = (text, align = "left") => ({ text: String(text), options: { fill: bg, fontSize: 10, fontFace: "Calibri", color: DARK_TEXT, align } });
      return [cell(r.marketplace), cell(r.app), cell(r.total.toLocaleString(), "right"), cell(r.avg, "right"), cell(r.days.size, "right")];
    }),
  ];

  slide.addTable(tableRows, {
    x: 0.4, y: 1.38, w: 12.5,
    border: { color: "E2E8F0", pt: 0.5 },
    colW: [4.5, 2.5, 2.0, 2.0, 1.5],
  });
}

// ── Main export ──────────────────────────────────────────────────────────────

export async function exportToPptx(records, month) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = "Promotion Tracking Dashboard";

  const validRecords = records.filter(r => r.portions_sold > 0);

  addTitleSlide(pptx, month);
  addKpiSlide(pptx, validRecords);

  addBarChartSlide(pptx,
    "Total Portions Sold by Promotion",
    "Shows which promotions drove the highest total volume of portions sold.",
    "Portions", aggregateByPromotion(validRecords), NAVY);

  addBarChartSlide(pptx,
    "Total Sales ($) by Promotion",
    "Shows total dollar sales generated per promotion.",
    "Sales ($)", aggregateSalesByPromotion(validRecords), GOLD.replace("#",""));

  const avgPromoRegion = buildAvgByPromotionRegionSeries(validRecords);
  addGroupedBarChartSlide(pptx,
    "Avg Portions/Day by Promotion & Division",
    "Compares the average daily portions sold per promotion, broken down by division.",
    avgPromoRegion.groups, avgPromoRegion.seriesData);

  addBarChartSlide(pptx,
    "Total Portions Sold by Day of Week",
    "Reveals which days of the week generate the most promotion activity.",
    "Portions", aggregateByDay(validRecords), CYAN);

  const dayByPromo = buildDayByPromotionSeries(validRecords);
  addGroupedBarChartSlide(pptx,
    "Total Portions by Day of Week & Promotion",
    "Shows how each promotion performs across different days of the week.",
    dayByPromo.groups, dayByPromo.seriesData);

  addBarChartSlide(pptx,
    "Total Portions Sold by Marketplace",
    "Displays total portions sold at each marketplace.",
    "Portions", aggregateByMarketplace(validRecords), PURPLE);

  addBarChartSlide(pptx,
    "Avg Portions/Day by Marketplace",
    "Shows the average daily portions sold per marketplace.",
    "Avg Portions/Day", aggregateAvgByMarketplace(validRecords), ORANGE);

  addTableSlide(pptx, validRecords);
  addMarketplaceTableSlide(pptx, validRecords);

  const fileName = `Promotion_Dashboard_${month !== "all" ? month.replace(/\s/g, "_") : "All_Months"}.pptx`;
  await pptx.writeFile({ fileName });
}