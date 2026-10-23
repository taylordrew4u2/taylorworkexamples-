# 4u Digital project brief delivery

The public `/project-brief/` discovery form sends one owner notification to **admin@customtechbuilt4u.com**. It does not book consultations and does not send unsolicited acknowledgments to submitted addresses. The existing BriefBooth booking worker, auth, Zoom, and Google integrations are not modified.

## Existing free infrastructure

- Supabase project: `kjjfpacypvdfdktkssst`; a new isolated `four_u_private` schema, one Edge Function, and two cron jobs.
- Existing Brevo Free transactional sender: `no-reply@briefbooth.com`, display name **4u Digital**. The business recipient is fixed. Reply-To is the validated client's address, so replying to the notification contacts that client.
- The existing `briefbooth_brevo_api_key` remains inside Vault and the SQL delivery worker. No secret is returned by an RPC or shipped to the browser.
- Deploy `project-brief` with `verify_jwt = false` because the form uses the project's current non-JWT publishable key. The handler validates that key, the exact owned Origin (primary domain, www, or the existing GitHub Pages mirror), request size, consent, honeypot, elapsed time, every answer, file limits, declared MIME, and file signatures. A public publishable key is not a bot secret; atomic database quotas protect the free allowance.
- Public RPC execution is revoked from PUBLIC, anon, and authenticated. Only service_role can save or dispatch briefs. The private table has RLS enabled and no public access policies.

## Receipt semantics

- HTTP **201 / sent** means Brevo returned successful acceptance and a provider message ID. It does not prove placement in the owner's inbox.
- HTTP **202 / received**, `delivery: queued` means the brief is durably saved and the separate minute cron will retry delivery. Known provider quota, authentication, or sender rejections retry after one hour. The client should not resubmit.
- HTTP **202 / received**, `delivery: uncertain` or `failed`, means the brief is saved but delivery needs operator attention. Network timeouts and provider 5xx outcomes are uncertain and are not blindly replayed, preventing duplicate mail after possible provider acceptance. Other terminal rejections also require attention.
- HTTP **429** means the brief was not saved; the client retains their local draft and can retry later or email the business.
- A repeated request ID with matching content returns the saved outcome. A changed brief using an existing ID receives HTTP 409. Provider requests also carry an idempotency key.

## Files and privacy

At most six genuine JPG, PNG, WebP, or PDF files are accepted, at most 5 MiB each and 8 MiB combined. Raw uploads are capped before multipart parsing. The original bytes are included in the owner email; no recoloring, resizing, or public file URLs are involved. Filenames are sanitized and file notes are included in the email summary.

Brief answers, email payloads, file metadata, and a keyed IP hash live only in the private schema. Raw IP addresses are not persisted. Attachment payloads are immediately removed after provider acceptance. Failed or uncertain attachments expire after seven days; answers and delivery records expire after 30 days. `4u-digital-project-brief-retention` runs hourly independently of email delivery. No private uploaded files enter public Git or a public storage bucket.

The logical serialized payload capacity is bounded to **64 MiB total**, including base64 expansion and answer/email text. Incoming briefs are capped at **15 per UTC day**, **3 per keyed IP hash per UTC day**, with at most **15 accepted brief emails per UTC day**. The worker also pauses when existing booking delivery has reached 240 accepted emails that UTC day. It shares the booking worker's advisory lock and never enables paid fallback. Existing auth and booking traffic still shares the provider's account-level free allowance; provider 429 safely queues rather than incurring charges.

## Operator checks and recovery

Run these in the Supabase SQL editor with an authorized owner account; do not publish query results containing client content.

```sql
-- Status only; no intake content or attachments.
select reference, status, attempts, created_at, accepted_at, last_error
from four_u_private.project_briefs order by created_at desc limit 30;

select jobname, schedule, active from cron.job
where jobname in ('4u-digital-project-briefs','4u-digital-project-brief-retention');
```

For `uncertain`, first inspect Brevo transactional logs using the saved provider message ID, reference in the subject, and timestamp. Never retry merely because the browser timed out or because a client did not see a success screen. If provider logs prove the message was accepted, mark accepted and clear `payload - 'attachment'`, `file_bytes = 0`; retain the actual provider ID if available. If logs prove no acceptance, an authorized operator may set that one row to `pending`, `next_attempt_at = now()`, then call `public.dispatch_4u_project_brief(the_uuid)`. These actions require review and are deliberately unavailable to anonymous clients.

If sender credentials need attention, fix the existing Vault key or sender configuration; the hourly retry then resumes automatically. Do not change unrelated booking functions or expose the secret while debugging. No paid provider, new account, or subscription is required.

To disable the form backend without touching bookings, unschedule the two `4u-digital-project-brief*` cron jobs and undeploy only the `project-brief` Edge Function. Preserve private rows for authorized recovery subject to the stated retention window.

## Verification

Run `node --test tests/project-brief-backend.test.mjs`. Tests cover real shared-schema validation, malicious answers and HTML escaping, fixed recipient, original-byte attachments, MIME/signature checks, quotas and payload limits, Origin/key rejection, meaningful provider outcomes, and idempotent response behavior. Production SQL checks must separately confirm execution permissions, RLS, cron registration, same-ID deduplication, content-change conflict, quota behavior, provider acceptance, attachment purge, and cleanup of labeled test records. Do not claim a production email delivery test based solely on mocked tests.
