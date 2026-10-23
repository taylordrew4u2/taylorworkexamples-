import { createBriefHandler } from './core.js';
import { normalizeBrief, formatBriefText } from '../../../project-brief-schema.js';

// This is an intentionally public project-discovery form. No browser/API key can read
// a saved brief; these narrowly scoped RPCs are executable only by service_role.
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const modernKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
const serviceKey = modernKeys.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
async function rpc(name: string, body: Record<string, unknown>) {
  if (!supabaseUrl || !serviceKey) throw new Error('Brief delivery is not configured');
  const headers: Record<string, string> = { 'Content-Type': 'application/json', apikey: serviceKey };
  if (!serviceKey.startsWith('sb_secret_')) headers.Authorization = `Bearer ${serviceKey}`;
  const result = await fetch(`${supabaseUrl}/rest/v1/rpc/${name}`, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(25000) });
  if (!result.ok) throw new Error('Brief storage is temporarily unavailable');
  return await result.json();
}
const publishableKey = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '{}').default || Deno.env.get('SUPABASE_ANON_KEY') || '';
const handler = createBriefHandler({
  publishableKeys: publishableKey ? [publishableKey] : [],
  normalizeAnswers: normalizeBrief, formatText: formatBriefText, ipSecret: serviceKey,
  repository: {
    save: ({ submission, ipHash, payload }: any) => rpc('submit_4u_project_brief', {
      p_request_id: submission.requestId, p_fingerprint: submission.fingerprint,
      p_ip_hash: ipHash, p_answers: submission.answers, p_payload: payload,
      p_file_bytes: submission.fileBytes, p_file_meta: submission.fileMeta,
    }),
    dispatch: (requestId: string) => rpc('dispatch_4u_project_brief', { p_request_id: requestId }),
  },
});
Deno.serve(handler);
