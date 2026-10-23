# Guided project brief release

Shareable client address: **https://customtechbuilt4u.com/project-brief/**. Send this link from admin@customtechbuilt4u.com. Clients do not need an account or an email application to submit.

## Client experience

- Nine guided sections with 60 prompts, conditional website/app/software paths and an unsure option.
- Only the project type, contact name, reply email and final sharing consent are required. Extra detail is optional, with deeper questions disclosed on demand.
- Features, user journeys, device needs, brand style, colors to use or avoid, inspiration, content, integrations, accessibility, privacy expectations, budget, timing, decision makers, ownership and handover are covered.
- Up to six original JPG, PNG, WebP or PDF references, with optional captions. Maximum 5 MiB each and 8 MiB combined. No recoloring or resizing.
- Six visual color palettes and a custom color picker help clients choose a direction. The selected palette name and hex values are part of the emailed colors answer; switching palettes preserves their notes. Project-type illustrations provide quick visual cues without changing the monochrome page branding.
- Optional device-only drafts exclude file contents. Clients review and edit their brief before sending, then can download a copy.
- All appointment scheduling remains on BriefBooth. This questionnaire is a project inquiry, not a booking or signed scope.

## Live delivery verification

The labeled owner-controlled test `4U-4A50B563A952` submitted all 60 answers and one full-color PNG through the live Edge Function. The owner notification arrived in **Inbox** at admin@customtechbuilt4u.com on October 23, 2026, at 17:39 UTC (1:39 PM New York).

The actual email contained every question label and answer, matching HTML/plain text, and the original-size 30,285-byte image attachment. SPF, DKIM and DMARC passed. The private delivery record showed one accepted attempt and immediate removal of the transient attachment payload. An identical retry returned the existing receipt without a second send; a changed brief with the same request ID returned HTTP 409.

Live negative checks verified rejection of an unapproved Origin and a missing public API key, plus the permitted preflight response. Rollback-only SQL tests exercised creation, same-ID deduplication, changed-content rejection and the per-network quota without sending mail or retaining fixtures. Anonymous and authenticated API roles cannot invoke the save/dispatch functions; the private table has RLS enabled. Existing booking delivery code was unchanged.

All 101 source tests passed and the production build generated 47 pages. All 28 focused browser cases passed in a single controlled run across desktop and iPhone viewports, including 320px layouts, keyboard choices, skipped sections, review edits, uploads, opt-in drafts, interrupted requests, retry identity truthful delivery statuses, visual palette selection and draft restoration, plus existing service and booking navigation. The labeled database test record was removed after verification; the owner's email remains as evidence.

The feature uses the existing Supabase and Brevo Free resources, bounded storage and email volume, and no paid fallback. The existing static website hosting is reused. Inbox placement can vary even when the provider accepts a message.

See [project-brief-operations.md](project-brief-operations.md) for retention, quota and operator recovery details. No real client data, private management links or credentials are included in release evidence.
