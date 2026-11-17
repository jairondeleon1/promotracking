import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { replaceSyncedRows } from '../../shared/promoWorkbook.ts';

// Called by the Compass Power Automate flow with the workbook file content.
export default async function(req) {
  try {
    const expected = secrets.get('POWER_AUTOMATE_SYNC_TOKEN');
    const token = req.headers.get('x-sync-token');
    if (!expected || token !== expected) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const content = body['$content'] || body.file;
    if (!content) return Response.json({ error: 'Missing file content' }, { status: 400 });

    const bytes = Uint8Array.from(atob(content), (c) => c.charCodeAt(0));
    const base44 = createClientFromRequest(req);
    const synced = await replaceSyncedRows(base44.asServiceRole.entities, bytes);
    if (!synced) return Response.json({ error: 'No valid rows found in the workbook' }, { status: 422 });
    return Response.json({ synced });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}