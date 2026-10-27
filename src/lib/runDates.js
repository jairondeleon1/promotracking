// Turns the messy "Date Run" text from uploads ("29-Sep", "9/8-9/14", "May 20th",
// "7.21.2026", ...) into a real date. Missing or implausible years are inferred
// from when the record was uploaded; unreadable values fall back to the upload month.
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const DAY_MS = 86400000;

const monthIndex = (name) => MONTHS.indexOf(String(name).slice(0, 3).toLowerCase());

function extractParts(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return { y: +m[1], m: +m[2] - 1, d: +m[3] };
  if (/^\d{5}$/.test(s)) {
    const dt = new Date((+s - 25569) * DAY_MS);
    return { y: dt.getUTCFullYear(), m: dt.getUTCMonth(), d: dt.getUTCDate() };
  }
  m = s.match(/(\d{1,2})[\/.](\d{1,2})(?:[\/.](\d{2,4}))?/);
  if (m) return { y: m[3] ? +m[3] : null, m: +m[1] - 1, d: +m[2] };
  m = s.match(/(\d{1,2})[\s-]+([A-Za-z]{3,})(?:[\s-]+(\d{2,4}))?/);
  if (m && monthIndex(m[2]) >= 0) return { y: m[3] ? +m[3] : null, m: monthIndex(m[2]), d: +m[1] };
  m = s.match(/([A-Za-z]{3,})\.?\s*(\d{1,2})/);
  if (m && monthIndex(m[1]) >= 0) return { y: null, m: monthIndex(m[1]), d: +m[2] };
  return null;
}

function resolveYear({ y, m, d }, ref) {
  const refTime = ref.getTime();
  const fits = (yr) => {
    const t = new Date(yr, m, d).getTime();
    return t <= refTime + 45 * DAY_MS && t >= refTime - 400 * DAY_MS;
  };
  if (y != null) {
    const full = y < 100 ? 2000 + y : y;
    if (fits(full)) return full;
  }
  const yr = ref.getFullYear();
  return new Date(yr, m, d).getTime() > refTime + 45 * DAY_MS ? yr - 1 : yr;
}

function buildDate(parts, ref) {
  if (!parts || parts.m < 0 || parts.m > 11 || parts.d < 1 || parts.d > 31) return null;
  const dt = new Date(resolveYear(parts, ref), parts.m, parts.d);
  return dt.getMonth() === parts.m ? dt : null;
}

export function getRunDate(record) {
  const ref = record.created_date ? new Date(record.created_date) : new Date();
  const parsed = buildDate(extractParts(record.date_run), ref);
  if (parsed) return parsed;
  const word = String(record.upload_month || "").match(/[A-Za-z]{3,}/);
  const month = word ? monthIndex(word[0]) : -1;
  return month >= 0 ? buildDate({ y: null, m: month, d: 1 }, ref) : null;
}