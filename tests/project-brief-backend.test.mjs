import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeBrief, formatBriefText, briefFields, maxBriefLength } from '../project-brief-schema.js';
import { createBriefHandler, parseSubmission, buildMail, escapeHtml, sha256, hashIp, identifyFile, extractClientIp, canonicalIp, MAX_BODY_BYTES } from '../supabase/functions/project-brief/core.js';
const now = Date.parse('2026-10-23T18:00:00Z');
const id = '22222222-2222-4222-8222-222222222222';
const origin = 'https://customtechbuilt4u.com';
const key = 'sb_publishable_test_only';
const valid = () => ({ version: 1, requestId: id, answers: { projectType: 'website', contactName: 'A client', contactEmail: 'client@example.com' }, consent: true, honey: '', startedAt: new Date(now - 5000).toISOString() });
function request(brief = valid(), options = {}) {
  return new Request('https://example.supabase.co/functions/v1/project-brief', { method: 'POST', headers: { origin, apikey: key, 'content-type': 'application/json', ...options.headers }, body: JSON.stringify(brief) });
}
function multipart(brief = valid(), files = [], captions = []) {
  const form = new FormData(); form.set('brief', JSON.stringify(brief)); form.set('captions', JSON.stringify(captions));
  for (const file of files) form.append('files', file.blob, file.name);
  return new Request('https://example.supabase.co/functions/v1/project-brief', { method: 'POST', headers: { origin, apikey: key }, body: form });
}
function setup(saveResult = { action: 'created', status: 'pending', reference: '4U-22222222' }, dispatchResult = { status: 'accepted' }) {
  const calls = [];
  const handler = createBriefHandler({ normalizeAnswers: normalizeBrief, formatText: formatBriefText, now: () => now, ipSecret: 'test-secret-not-real', publishableKeys: [key], repository: { save: async (value) => { calls.push(value); if (saveResult instanceof Error) throw saveResult; return saveResult; }, dispatch: async (value) => { calls.push(value); if (dispatchResult instanceof Error) throw dispatchResult; return dispatchResult; } } });
  return { handler, calls };
}
const png = new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]);
test('valid brief uses actual schema and stable content fingerprint', async () => {
  const a = await parseSubmission(request(), normalizeBrief, now);
  const b = await parseSubmission(request(), normalizeBrief, now);
  assert.equal(a.fingerprint, b.fingerprint); assert.equal(a.fileBytes, 0); assert.equal(a.requestId, id);
});
test('required contact fields and consent are independently checked', async () => {
  for (const [mutate, field] of [[v => v.consent = false, 'consent'], [v => v.answers.contactEmail = 'bad', 'contactEmail'], [v => v.answers.contactName = '', 'contactName']]) {
    const v = valid(); mutate(v); await assert.rejects(parseSubmission(request(v), normalizeBrief, now), e => e.field === field);
  }
});
test('unknown fields, injected option values, and checkbox types are rejected', async () => {
  const v = valid(); v.answers.arbitraryRecipient = 'attacker@example.com';
  await assert.rejects(parseSubmission(request(v), normalizeBrief, now));
  v.answers = { ...valid().answers, projectType: 'tampered' }; await assert.rejects(parseSubmission(request(v), normalizeBrief, now));
});
test('honeypots, too-fast submissions, future starts and invalid ids rejected before saving', async () => {
  for (const modify of [v => v.honey = 'bot', v => v.startedAt = new Date(now).toISOString(), v => v.startedAt = 'invalid', v => v.startedAt = new Date(now + 120000).toISOString(), v => v.requestId = 'not-uuid']) {
    const value = valid(); modify(value); const { handler, calls } = setup(); const result = await handler(request(value)); assert.equal(result.status, 400); assert.equal(calls.length, 0);
  }
});
test('body cap is enforced without trusting content-length', async () => {
  const oversized = new Request('https://example.test', { method: 'POST', body: new Uint8Array(MAX_BODY_BYTES + 1), headers: { 'content-type': 'application/json' } });
  await assert.rejects(parseSubmission(oversized, normalizeBrief, now), e => e.status === 413);
});
test('forged over-limit content-length is rejected before reading', async () => {
  await assert.rejects(parseSubmission(request(valid(), { headers: { 'content-length': String(MAX_BODY_BYTES + 1) } }), normalizeBrief, now), e => e.status === 413);
});
test('genuine file signatures are checked against declared MIME', () => {
  assert.equal(identifyFile(png), 'image/png'); assert.equal(identifyFile(new Uint8Array([255,216,255,0])), 'image/jpeg');
  assert.equal(identifyFile(new TextEncoder().encode('%PDF-1.7\n')), 'application/pdf');
  assert.equal(identifyFile(new TextEncoder().encode('RIFFabcdWEBP')), 'image/webp'); assert.equal(identifyFile(new TextEncoder().encode('<svg></svg>')), null);
});
test('original image bytes, safe filename and captions reach the owner attachment', async () => {
  const parsed = await parseSubmission(multipart(valid(), [{ name: '../../<img onerror=oops>.png', blob: new Blob([png], { type: 'image/png' }) }], ['Layout inspiration']), normalizeBrief, now);
  assert.equal(parsed.attachments.length, 1); assert.equal(parsed.fileMeta[0].caption, 'Layout inspiration');
  assert.equal(parsed.attachments[0].content, Buffer.from(png).toString('base64')); assert.match(parsed.attachments[0].name, /^01-[a-zA-Z0-9 ._-]+\.png$/);
  assert.equal(parsed.fileMeta[0].sha256, await sha256(png));
});
test('disguised SVGs, MIME mismatches, zero-byte files and seventh attachment rejected', async () => {
  for (const files of [
    [{ name: 'bad.png', blob: new Blob(['<svg></svg>'], { type: 'image/png' }) }],
    [{ name: 'bad.jpg', blob: new Blob([png], { type: 'image/jpeg' }) }],
    [{ name: 'empty.png', blob: new Blob([], { type: 'image/png' }) }],
    Array.from({ length: 7 }, () => ({ name: 'okay.png', blob: new Blob([png], { type: 'image/png' }) })),
  ]) await assert.rejects(parseSubmission(multipart(valid(), files), normalizeBrief, now));
});
test('individual and total attachment limits enforced', async () => {
  const large = new Uint8Array(5 * 1024 * 1024 + 1); large.set(png);
  await assert.rejects(parseSubmission(multipart(valid(), [{ name: 'big.png', blob: new Blob([large], { type: 'image/png' }) }]), normalizeBrief, now), e => e.status === 413);
  const part = new Uint8Array(4 * 1024 * 1024 + 1); part.set(png);
  await assert.rejects(parseSubmission(multipart(valid(), [{ name: 'a.png', blob: new Blob([part], { type: 'image/png' }) }, { name: 'b.png', blob: new Blob([part], { type: 'image/png' }) }]), normalizeBrief, now), e => e.status === 413);
});
test('email recipient/sender are fixed, reply-to is validated client, HTML escapes all submitted content', async () => {
  const v = valid(); v.answers.contactName = '<script>alert(1)</script>';
  const parsed = await parseSubmission(request(v), normalizeBrief, now); const mail = buildMail(parsed, formatBriefText);
  assert.deepEqual(mail.to, [{ email: 'admin@customtechbuilt4u.com', name: '4u Digital' }]); assert.equal(mail.sender.email, 'no-reply@briefbooth.com');
  assert.equal(mail.replyTo.email, 'client@example.com'); assert.match(mail.htmlContent, /&lt;script&gt;/); assert.doesNotMatch(mail.htmlContent, /<script>/);
  assert.match(mail.textContent, /<script>/); assert.equal(mail.headers.IdempotencyKey, id); assert.equal(mail.attachment, undefined);
});
test('IP HMAC never preserves raw client address and is stable per secret', async () => {
  const hashed = await hashIp('192.0.2.2', 'test-secret'); assert.match(hashed, /^[a-f0-9]{64}$/);
  assert.equal(hashed, await hashIp('192.0.2.2', 'test-secret')); assert.notEqual(hashed, await hashIp('192.0.2.2', 'other-secret'));
});
test('production origin and API key are required before any save', async () => {
  for (const headers of [{ origin: 'https://evil.test' }, { origin: 'null' }, { apikey: 'bad' }, { origin: 'http://localhost:5173' }]) {
    const { handler, calls } = setup(); const result = await handler(request(valid(), { headers })); assert.ok([401,403].includes(result.status)); assert.equal(calls.length, 0);
  }
});
test('allowed preflight has no body and no database call', async () => {
  const { handler, calls } = setup(); const result = await handler(new Request('https://example.test', { method: 'OPTIONS', headers: { origin } })); assert.equal(result.status, 204); assert.equal(result.headers.get('access-control-allow-origin'), origin); assert.equal(calls.length, 0);
});
test('only provider acceptance produces sent status', async () => {
  const { handler, calls } = setup(); const response = await handler(request()); const body = await response.json();
  assert.equal(response.status, 201); assert.equal(body.status, 'sent'); assert.equal(calls.length, 2); assert.match(calls[0].ipHash, /^[a-f0-9]{64}$/);
});
test('existing accepted idempotent submission never dispatches again', async () => {
  const { handler, calls } = setup({ action: 'existing', status: 'accepted' }); const result = await handler(request()); assert.equal(result.status, 201); assert.equal(calls.length, 1);
});
test('saved pending queue is accurately represented with no claimed inbox delivery', async () => {
  const { handler } = setup(undefined, { status: 'pending' }); const result = await handler(request()); const body = await result.json(); assert.equal(result.status, 202); assert.equal(body.status, 'received'); assert.equal(body.delivery, 'queued'); assert.match(body.message, /waiting for email delivery/);
});
test('uncertain and failed submissions are saved but never blindly dispatched', async () => {
  for (const status of ['uncertain', 'failed']) { const { handler, calls } = setup({ action: 'existing', status }); const result = await handler(request()); const body = await result.json(); assert.equal(body.status, 'received'); assert.match(body.message, /delivery needs attention/); assert.equal(calls.length, 1); }
});
test('identity conflicts and free quota limits fail accurately without dispatch', async () => {
  for (const [action, status] of [['conflict',409],['rate_limited',429],['capacity',429]]) { const { handler, calls } = setup({ action }); const result = await handler(request()); assert.equal(result.status, status); assert.equal((await result.json()).ok, false); assert.equal(calls.length, 1); }
});
test('failed persistence never returns success; dispatch timeout retains safe saved queue', async () => {
  const { handler } = setup(new Error('private secret must not leak')); const result = await handler(request()); assert.equal(result.status, 503); assert.doesNotMatch(await result.text(), /private secret/);
  const afterSave = setup(undefined, new Error('gateway timeout')); const queued = await afterSave.handler(request()); assert.equal(queued.status, 202); assert.equal((await queued.json()).delivery, 'queued');
});
test('migration isolates data, locks quota, binds RPCs to service_role and never mutates booking functions', async () => {
  const sql = await readFile(new URL('../supabase/migrations/20261023173813_project_briefs.sql', import.meta.url), 'utf8');
  assert.match(sql, /enable row level security/); assert.match(sql, /revoke all on schema four_u_private from public, anon, authenticated/);
  assert.match(sql, /pg_advisory_xact_lock\(492483718\)/); assert.match(sql, /pg_try_advisory_xact_lock\(492483717\)/);
  assert.match(sql, /grant execute on function public\.submit_4u_project_brief[^;]+ to service_role/);
  assert.match(sql, /payload=payload-'attachment',file_bytes=0/); assert.match(sql, /67108864/);
  assert.match(sql, /interval '7 days'/); assert.match(sql, /interval '30 days'/); assert.match(sql, /cron.schedule\('4u-digital-project-briefs'/);
  assert.doesNotMatch(sql, /create (?:or replace )?function briefbooth_private|update briefbooth_private|delete from briefbooth_private/i);
  assert.doesNotMatch(sql, /decrypted_secret[^;]*return/i);
});

test('quota identity trusts canonical Cloudflare address and ignores attacker XFF prefix', () => {
  assert.equal(extractClientIp(new Headers({ 'cf-connecting-ip': '203.0.113.9', 'x-forwarded-for': '192.0.2.1, 198.51.100.4' })), '203.0.113.9');
  assert.equal(extractClientIp(new Headers({ 'x-forwarded-for': 'attacker, 192.0.2.1, 198.51.100.4' })), '198.51.100.4');
  assert.equal(canonicalIp('2001:0DB8:0000:0000:0000:0000:0000:0001'), '2001:db8::1');
  assert.equal(canonicalIp('256.2.3.4'), null); assert.equal(canonicalIp('1.2.3.04'), null); assert.equal(canonicalIp('::1:90000'), null);
});
test('unknown persistence acknowledgments never report durable success', async () => {
  for (const result of [{}, { action: 'created' }, { action: 'created', status: 'invented' }]) {
    const { handler } = setup(result); const response = await handler(request()); assert.equal(response.status, 503); assert.equal((await response.json()).ok, false);
  }
});

test('expanded design choices, three reference pairs, and every website social are included in the owner email', async () => {
  const brief = valid();
  Object.assign(brief.answers, {
    brandMood: ['clean', 'premium'], fontStyle: 'editorial',
    referenceUrl1: 'first-reference.example/design', referenceNotes1: 'Keep the calm layout, not their pricing.',
    referenceUrl2: 'https://second-reference.example/menus?view=seasonal', referenceNotes2: 'Readable menus & welcoming photos.',
    referenceUrl3: 'https://third-reference.example/gallery#rooms', referenceNotes3: 'The <b>room photos</b> inspire the presentation.',
    socialInstagram: '@my_business', socialFacebook: 'https://facebook.example/my-business',
    socialTikTok: '@my_business_tiktok', socialYouTube: '@my_business_video',
    socialLinkedIn: 'https://linkedin.example/company/my-business', socialX: '@my_business_x',
    socialPinterest: '@my_business_pins', socialOther: 'Mastodon: @studio@social.example\nA second public profile can wait.',
  });
  const submission = await parseSubmission(request(brief), normalizeBrief, now);
  const mail = buildMail(submission, formatBriefText);
  for (const id of ['brandMood', 'fontStyle', 'referenceUrl1', 'referenceNotes1', 'referenceUrl2', 'referenceNotes2', 'referenceUrl3', 'referenceNotes3', 'socialInstagram', 'socialFacebook', 'socialTikTok', 'socialYouTube', 'socialLinkedIn', 'socialX', 'socialPinterest', 'socialOther']) {
    const field = briefFields.find((entry) => entry.id === id);
    assert.ok(field, `${id} exists in the shared deployed schema`);
    assert.ok(mail.textContent.includes(field.label), `${id} has its question label in plain text`);
    assert.ok(mail.htmlContent.includes(escapeHtml(field.label)), `${id} has its escaped question label in HTML`);
    const answer = submission.answers[id];
    const values = Array.isArray(answer) ? answer : [answer];
    for (const value of values) {
      const display = field.options?.find((option) => option.value === value)?.label || value;
      assert.ok(mail.textContent.includes(display), `${id} retains the client's complete answer in plain text`);
      assert.ok(mail.htmlContent.includes(escapeHtml(display)), `${id} retains the client's escaped complete answer in HTML`);
    }
  }
  assert.equal(submission.answers.referenceUrl1, 'https://first-reference.example/design');
  assert.match(mail.textContent, /room photos/); assert.match(mail.htmlContent, /&lt;b&gt;room photos&lt;\/b&gt;/);
  assert.doesNotMatch(mail.htmlContent, /<b>room photos<\/b>/);
  assert.deepEqual(mail.to, [{ email: 'admin@customtechbuilt4u.com', name: '4u Digital' }]);
});

test('website-only social answers are omitted for an app while shared font and reference choices remain', async () => {
  const brief = valid(); Object.assign(brief.answers, { projectType: 'app', socialInstagram: '@not-for-this-project', socialOther: 'Do not include this website-only answer.', fontStyle: 'technical', referenceUrl1: 'app-reference.example', referenceNotes1: 'The timer should be easy to read.' });
  const submission = await parseSubmission(request(brief), normalizeBrief, now);
  const mail = buildMail(submission, formatBriefText);
  assert.equal(submission.answers.socialInstagram, undefined); assert.equal(submission.answers.socialOther, undefined);
  assert.equal(submission.answers.fontStyle, 'technical'); assert.equal(submission.answers.referenceUrl1, 'https://app-reference.example/');
  assert.doesNotMatch(mail.textContent, /not-for-this-project|Do not include this website-only answer/);
  assert.match(mail.textContent, /The timer should be easy to read/);
});

test('reference URL fields reject executable schemes, embedded credentials and control characters before storage', async () => {
  for (const field of ['referenceUrl1', 'referenceUrl2', 'referenceUrl3']) {
    for (const bad of ['javascript:alert(1)', 'data:text/html,<script>bad</script>', 'file:///etc/passwd', 'https://user:password@example.test/', 'https://example.test/\r\nBcc:outside@example.test']) {
      const brief = valid(); brief.answers[field] = bad;
      const { handler, calls } = setup(); const response = await handler(request(brief));
      assert.equal(response.status, 400); assert.equal((await response.json()).field, field); assert.equal(calls.length, 0);
    }
  }
  for (const field of ['contactName', 'contactEmail', 'socialInstagram']) {
    const brief = valid(); brief.answers[field] = 'name\r\nBcc: outside@example.test';
    await assert.rejects(parseSubmission(request(brief), normalizeBrief, now), (error) => error.field === field);
  }
});

test('maximum 60000-character mixed brief fits backend UTF-8 and email payload limits', async () => {
  const brief = valid(); brief.answers.projectType = 'mixed';
  let total = Object.values(brief.answers).reduce((sum, value) => sum + value.length, 0);
  for (const field of briefFields.filter((entry) => !entry.required && ['text', 'textarea', 'colors'].includes(entry.type))) {
    const length = Math.min(field.maxLength || 3000, maxBriefLength - total);
    if (length <= 0) break;
    brief.answers[field.id] = '界'.repeat(length); total += length;
  }
  assert.equal(total, maxBriefLength, 'schema contains enough optional room for the total boundary');
  const submission = await parseSubmission(request(brief), normalizeBrief, now);
  assert.ok(new TextEncoder().encode(JSON.stringify(submission.answers)).length < 200 * 1024);
  const mail = buildMail(submission, formatBriefText);
  // Include the maximum combined attachment base64 length without using an invalid
  // upload or sending anything: SQL receives this same serialized API payload shape.
  mail.attachment = [{ name: 'maximum-size-reference.jpg', content: 'A'.repeat(Math.ceil((8 * 1024 * 1024) / 3) * 4) }];
  assert.ok(new TextEncoder().encode(JSON.stringify(mail)).length < 13 * 1024 * 1024);
});
