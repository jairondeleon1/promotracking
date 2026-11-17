import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { replaceSyncedRows } from '../../shared/promoWorkbook.ts';

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

    const synced = await replaceSyncedRows(base44.asServiceRole.entities, new Uint8Array(await res.arrayBuffer()));
    if (!synced) return Response.json({ error: 'No valid rows found in the workbook' }, { status: 422 });
    return Response.json({ synced });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}