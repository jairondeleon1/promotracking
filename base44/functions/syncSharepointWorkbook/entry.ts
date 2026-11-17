import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import * as XLSX from 'npm:xlsx@0.18.5';

const BATCH_ID = 'sharepoint-live';
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

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const link = secrets.get('SHAREPOINT_FILE_LINK');
    if (!link) return Response.json({ skipped: true, reason: 'SHAREPOINT_FILE_LINK is not set yet' });

    const url = link + (link.includes('?') ? '&' : '?') + 'download=1';
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(60000) });
    const type = res.headers.get('content-type') || '';
    if (!res.ok || type.includes('text/html')) {
      return Response.json({
        error: `Could not download the workbook (status ${res.status}). The link must be an "Anyone with the link" link.`,
      }, { status: 502 });
    }

    const wb = XLSX.read(new Uint8Array(await res.arrayBuffer()), { type: 'array', cellDates: false });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: false });
    const mapped = rows.map(mapRow).filter(Boolean);
    if (!mapped.length) return Response.json({ error: 'No valid rows found in the workbook' }, { status: 422 });

    const records = base44.asServiceRole.entities.PromotionRecord;
    await records.deleteMany({ upload_batch_id: BATCH_ID });
    for (let i = 0; i < mapped.length; i += 200) {
      await records.bulkCreate(mapped.slice(i, i + 200));
    }
    return Response.json({ synced: mapped.length, sheet: wb.SheetNames[0] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}