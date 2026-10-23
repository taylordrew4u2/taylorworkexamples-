export const MAX_BODY_BYTES = 10 * 1024 * 1024;
export const MAX_FILES = 6;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_TOTAL_FILE_BYTES = 8 * 1024 * 1024;
export const PRODUCTION_ORIGINS = ['https://customtechbuilt4u.com', 'https://www.customtechbuilt4u.com', 'https://taylordrew4u2.github.io'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/;
export class BriefError extends Error {
  constructor(message, status = 400, field = undefined) { super(message); this.status = status; this.field = field; }
}
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
export function bytesToBase64(bytes) {
  let output = '';
  for (let i = 0; i < bytes.length; i += 16384) output += String.fromCharCode(...bytes.subarray(i, i + 16384));
  return btoa(output);
}
export async function sha256(value) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
export async function hashIp(ip, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ip))), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
export function canonicalIp(value) {
  const candidate = String(value || '').trim();
  if (!candidate || candidate.length > 80) return null;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(candidate)) {
    const parts = candidate.split('.').map(Number);
    return parts.every((part) => part <= 255) && parts.join('.') === candidate ? candidate : null;
  }
  if (!/^[0-9a-fA-F:.]+$/.test(candidate) || !candidate.includes(':')) return null;
  try { return new URL(`http://[${candidate}]/`).hostname.replace(/^\[|\]$/g, '').toLowerCase(); } catch { return null; }
}
export function extractClientIp(headers) {
  // Cloudflare overwrites CF-Connecting-IP. Caller-supplied XFF prefixes must
  // never choose the quota identity; the final proxy-appended address is fallback.
  const cloudflare = canonicalIp(headers.get('cf-connecting-ip'));
  if (cloudflare) return cloudflare;
  const forwarded = (headers.get('x-forwarded-for') || '').slice(-1024).split(',').reverse();
  return forwarded.map(canonicalIp).find(Boolean) || 'unknown';
}
export function identifyFile(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value)) return 'image/png';
  const head = new TextDecoder().decode(bytes.subarray(0, 12));
  if (head.startsWith('RIFF') && head.slice(8, 12) === 'WEBP') return 'image/webp';
  if (head.startsWith('%PDF-')) return 'application/pdf';
  return null;
}
export async function readBoundedBody(request) {
  const length = request.headers.get('content-length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_BODY_BYTES)) throw new BriefError('Your upload is too large. Keep all files together under 8 MB.', 413, 'files');
  if (!request.body) throw new BriefError('Please complete your project brief.');
  const reader = request.body.getReader(); const chunks = []; let total = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) { await reader.cancel(); throw new BriefError('Your upload is too large. Keep all files together under 8 MB.', 413, 'files'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}
export async function parseSubmission(request, normalizeAnswers, now = Date.now()) {
  const bytes = await readBoundedBody(request);
  const contentType = request.headers.get('content-type') || ''; let brief; let files = []; let captions = [];
  try {
    if (contentType.startsWith('multipart/form-data;')) {
      const form = await new Request('https://localhost/', { method: 'POST', headers: { 'content-type': contentType }, body: bytes }).formData();
      if (form.getAll('brief').length !== 1 || form.getAll('captions').length > 1) throw new Error('Repeated metadata');
      brief = JSON.parse(String(form.get('brief') || ''));
      files = form.getAll('files'); captions = JSON.parse(String(form.get('captions') || '[]'));
      if ([...form.keys()].some((key) => !['brief', 'files', 'captions'].includes(key))) throw new Error('Unexpected form field');
    } else if (contentType.startsWith('application/json')) { brief = JSON.parse(new TextDecoder().decode(bytes)); }
    else throw new BriefError('Use the project brief form to send your answers.', 415);
  } catch (error) { if (error instanceof BriefError) throw error; throw new BriefError('The brief could not be read. Please try sending it again.'); }
  if (!brief || typeof brief !== 'object' || brief.version !== 1 || !UUID.test(brief.requestId || '')) throw new BriefError('Please refresh this page before sending your brief.');
  if (typeof brief.honey !== 'string' || brief.honey !== '') throw new BriefError('We could not accept this request.', 400);
  if (brief.consent !== true) throw new BriefError('Please agree to send your answers and files to 4u Digital.', 400, 'consent');
  const started = typeof brief.startedAt === 'number' ? brief.startedAt : Date.parse(brief.startedAt);
  if (!Number.isFinite(started) || started > now + 60000 || now - started < 3000 || now - started > 7 * 86400000) throw new BriefError('Please spend a moment reviewing your details, then try again.');
  let answers;
  try { answers = normalizeAnswers(brief.answers); }
  catch (error) { throw new BriefError(error.message || 'Please check your answers.', 400, error.field); }
  if (!answers.contactName || typeof answers.contactName !== 'string' || answers.contactName.length > 160) throw new BriefError('Please enter your name.', 400, 'contactName');
  if (typeof answers.contactEmail !== 'string' || !EMAIL.test(answers.contactEmail) || answers.contactEmail.length > 254) throw new BriefError('Please enter a valid email address.', 400, 'contactEmail');
  if (new TextEncoder().encode(JSON.stringify(answers)).length > 200 * 1024) throw new BriefError('Please shorten your answers to under 200 KB.', 413);
  if (!Array.isArray(captions) || captions.length > MAX_FILES || captions.some((value) => typeof value !== 'string' || value.length > 500)) throw new BriefError('Keep file notes under 500 characters.', 400, 'files');
  if (files.length > MAX_FILES || captions.length > files.length) throw new BriefError('Add up to six files.', 400, 'files');
  const attachments = []; const fileMeta = []; let total = 0;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (typeof file === 'string' || !file || typeof file.arrayBuffer !== 'function') throw new BriefError('Please choose an image or PDF file.', 400, 'files');
    if (file.size === 0 || file.size > MAX_FILE_BYTES) throw new BriefError('Each file must be between 1 byte and 5 MB.', 413, 'files');
    total += file.size;
    if (total > MAX_TOTAL_FILE_BYTES) throw new BriefError('Keep all files together under 8 MB.', 413, 'files');
    const data = new Uint8Array(await file.arrayBuffer()); const mime = identifyFile(data);
    if (!mime || file.type !== mime) throw new BriefError('Use genuine JPG, PNG, WebP or PDF files. Other file types are not accepted.', 415, 'files');
    const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' }[mime];
    const name = String(file.name || 'reference').split(/[\\/]/).at(-1).replace(/\.[^.]*$/, '').replace(/[^a-zA-Z0-9 _.-]/g, '').replace(/^\.+/, '').trim().slice(0, 95) || 'reference';
    const safeName = `${String(i + 1).padStart(2, '0')}-${name}.${extension}`;
    attachments.push({ name: safeName, content: bytesToBase64(data) });
    fileMeta.push({ name: safeName, type: mime, size: data.byteLength, caption: (captions[i] || '').trim(), sha256: await sha256(data) });
  }
  const fingerprint = await sha256(JSON.stringify({ answers, files: fileMeta, consent: true, version: 1 }));
  return { requestId: brief.requestId.toLowerCase(), answers, attachments, fileMeta, fileBytes: total, fingerprint };
}
export function buildMail(submission, formatText) {
  const reference = `4U-${submission.requestId.replaceAll('-', '').slice(0, 12).toUpperCase()}`;
  const fileText = submission.fileMeta.length ? '\n\nREFERENCE FILES\n' + submission.fileMeta.map((file) => `${file.name}${file.caption ? '\nNote: ' + file.caption : ''}`).join('\n\n') : '\n\nNo reference files were added.';
  const textContent = `NEW PROJECT BRIEF — 4u Digital\nReference: ${reference}\n\n${formatText(submission.answers)}${fileText}\n\nThe client agreed to send these answers and files to 4u Digital. Skipped optional questions have been left out.\nReply to this email to contact ${submission.answers.contactName}.\n\n4u Digital\nadmin@customtechbuilt4u.com\nhttps://customtechbuilt4u.com/`;
  const htmlContent = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Project brief — 4u Digital</title></head><body style="margin:0;background:#f3f3f3;color:#171717;font-family:Arial,sans-serif"><main style="max-width:680px;margin:24px auto;padding:32px;background:#ffffff;border:1px solid #dddddd"><h1 style="font-size:26px;margin:0 0 20px">4u Digital · New project brief</h1><div style="font-size:15px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(textContent)}</div></main></body></html>`;
  return { sender: { name: '4u Digital', email: 'no-reply@briefbooth.com' }, to: [{ email: 'admin@customtechbuilt4u.com', name: '4u Digital' }], replyTo: { email: submission.answers.contactEmail, name: submission.answers.contactName }, subject: `New project brief — 4u Digital — ${reference}`, textContent, htmlContent, ...(submission.attachments.length ? { attachment: submission.attachments } : {}), tags: ['4u-digital', 'project-brief'], headers: { IdempotencyKey: submission.requestId } };
}
export function createBriefHandler({ repository, normalizeAnswers, formatText, ipSecret, publishableKeys = [], allowedOrigins = PRODUCTION_ORIGINS, now = () => Date.now() }) {
  return async function handle(request) {
    const origin = request.headers.get('origin');
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Vary': 'Origin', 'X-Content-Type-Options': 'nosniff' };
    if (allowedOrigins.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
    const respond = (status, value, extra = {}) => new Response(JSON.stringify(value.ok === false && value.message ? { ...value, error: value.message } : value), { status, headers: { ...headers, ...extra } });
    if (!origin || !allowedOrigins.includes(origin)) return respond(403, { ok: false, message: 'Please send your brief from customtechbuilt4u.com.' });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type, apikey, authorization, x-client-info', 'Access-Control-Max-Age': '600' } });
    if (request.method !== 'POST') return respond(405, { ok: false, message: 'Use POST to send a project brief.' }, { Allow: 'POST, OPTIONS' });
    if (!publishableKeys.length || !publishableKeys.includes(request.headers.get('apikey'))) return respond(401, { ok: false, message: 'Please refresh the project brief page before sending.' });
    try {
      const submission = await parseSubmission(request, normalizeAnswers, now());
      const ip = extractClientIp(request.headers);
      const ipHash = await hashIp(ip, ipSecret);
      const result = await repository.save({ submission, ipHash, payload: buildMail(submission, formatText) });
      if (!result || !['created', 'existing', 'conflict', 'rate_limited', 'capacity'].includes(result.action)) throw new Error('Brief persistence was not acknowledged');
      if (['created', 'existing'].includes(result.action) && !['pending', 'accepted', 'uncertain', 'failed'].includes(result.status)) throw new Error('Brief persistence status was not acknowledged');
      const reference = result.reference || `4U-${submission.requestId.replaceAll('-', '').slice(0, 12).toUpperCase()}`;
      if (result.action === 'conflict') return respond(409, { ok: false, message: 'This submission reference is already in use. Start a new brief to send different answers.' });
      if (result.action === 'rate_limited' || result.action === 'capacity') return respond(429, { ok: false, message: 'The brief form has reached its free delivery limit. Your answers are still on this device. Please try again later or email admin@customtechbuilt4u.com.' }, { 'Retry-After': '3600' });
      let status = result.status;
      if (status !== 'accepted' && status !== 'uncertain' && status !== 'failed') {
        try { status = (await repository.dispatch(submission.requestId)).status; } catch { status = 'pending'; }
      }
      if (status === 'accepted') return respond(201, { ok: true, status: 'sent', reference, message: 'Your project brief and reference files have been sent to 4u Digital.' });
      if (status === 'uncertain' || status === 'failed') return respond(202, { ok: true, status: 'received', delivery: status, reference, message: 'Your brief is safely saved, but its email delivery needs attention. Keep this reference. You can contact admin@customtechbuilt4u.com if you need to follow up.' });
      return respond(202, { ok: true, status: 'received', delivery: 'queued', reference, message: 'Your brief is safely saved and waiting for email delivery. There is no need to submit it again.' });
    } catch (error) {
      if (error instanceof BriefError) return respond(error.status, { ok: false, message: error.message, ...(error.field ? { field: error.field } : {}) });
      return respond(503, { ok: false, message: 'The brief could not be saved just now. Your answers are still on this device. Please try again or email admin@customtechbuilt4u.com.' });
    }
  };
}
