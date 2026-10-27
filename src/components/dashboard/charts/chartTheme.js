export const AXIS_TICK = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };
export const GRID_STROKE = "hsl(var(--border))";
export const CURSOR = { fill: "hsl(var(--muted))" };

export const CHART_COLORS = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `hsl(var(--chart-${n}))`);

const NAMED = {
  thrive: "hsl(var(--chart-1))",
  savour: "hsl(var(--chart-2))",
  "no app": "hsl(var(--chart-8))",
};

export const seriesColor = (key, i) => NAMED[key] || CHART_COLORS[i % CHART_COLORS.length];

export const truncate = (s, n = 22) => (String(s).length > n ? `${String(s).slice(0, n - 1)}…` : s);