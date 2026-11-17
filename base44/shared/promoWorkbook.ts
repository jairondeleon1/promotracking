import * as XLSX from 'npm:xlsx@0.18.5';

export const BATCH_ID = 'sharepoint-live';
const BATCH_LABEL = 'Live SharePoint workbook';

function parseCurrency(val) {
  if (!val) return null;
  return parseFloat(String(val).replace(/[$,\s]/g, '')) || null;
}

function parsePortions(val) {
  if (!val) return null;
  const n = parseFloat(String(val).replace(/[,\s]/g, ''));
  return isNaN(n) ? null : n;
}

function normalizePromotion(p) {
  if (!p) return '';
  const norm = p.replace(/['’`]/g, '').trim().toLowerCase();
  if (['chef table', 'chefs table', 'chef tables'].includes(norm)) return 'Chef Table';
  return p.trim();
}

function ciGet(row, key) {
  const target = key.toLowerCase().trim();
  for (const k in row) {
    if (k.toLowerCase().trim() === target) return String(row[k] || '');
  }
  return '';
}

function mapRow(row) {
  const marketplace = ciGet(row, 'MARKETPLACE+A1:M1') || ciGet(row, 'MARKETPLACE');
  if (!marketplace) return null;
  return {
    marketplace,
    region: ciGet(row, 'REGION'),
    manager_name: ciGet(row, 'MANAGER NAME'),
    promotion: normalizePromotion(ciGet(row, 'PROMOTION')),
    date_run: ciGet(row, 'DATE RUN'),
    day_of_week: ciGet(row, 'DAY OF THE WEEK RUN').trim(),
    price_sold: ciGet(row, 'PRICE SOLD'),
    portions_sold: parsePortions(ciGet(row, 'PORTIONS SOLD')),
    total_promotion_sales: parseCurrency(ciGet(row, 'TOTAL PROMOTION SALES FOR THE DAY')),
    total_marketplace_sales_week: parseCurrency(ciGet(row, 'TOTAL MARKETPLACE SALES FOR THE WEEK OF PROMOTION')),
    mobile_app: ciGet(row, 'MOBILE APP'),
    promoted_on_app: ciGet(row, 'DID YOU PROMOTE ON THE MOBILE APP?'),
    comments: ciGet(row, 'COMMENTS'),
    business_type: ciGet(row, 'BUSINESS TYPE'),
    recipe_run: ciGet(row, 'RECIPE RUN'),
    upload_month: BATCH_LABEL,
    upload_batch_id: BATCH_ID,
  };
}

// Parses workbook bytes and replaces all previously synced rows. Returns the number synced.
export async function replaceSyncedRows(entities, bytes) {
  const wb = XLSX.read(bytes, { type: 'array', cellDates: false });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: false });
  const mapped = rows.map(mapRow).filter(Boolean);
  if (!mapped.length) return 0;
  await entities.PromotionRecord.deleteMany({ upload_batch_id: BATCH_ID });
  for (let i = 0; i < mapped.length; i += 200) {
    await entities.PromotionRecord.bulkCreate(mapped.slice(i, i + 200));
  }
  return mapped.length;
}