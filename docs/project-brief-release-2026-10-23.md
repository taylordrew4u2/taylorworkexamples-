# Guided project brief release

Shareable client address: **https://customtechbuilt4u.com/project-brief/**. Send this link from admin@customtechbuilt4u.com. Clients do not need an account or an email application to submit.

## Client experience

- Nine guided sections with 75 prompts, conditional website/app/software paths and an unsure option.
- Only the project type, contact name, reply email and final sharing consent are required. Extra detail is optional, with deeper questions disclosed on demand.
- Features, user journeys, device needs, brand style, colors to use or avoid, inspiration, content, integrations, accessibility, privacy expectations, budget, timing, decision makers, ownership and handover are covered.
- Up to six original JPG, PNG, WebP or PDF references, with optional captions. Maximum 5 MiB each and 8 MiB combined. No recoloring or resizing.
- Six visual color palettes and a custom color picker help clients choose a direction. The selected palette name and hex values are part of the emailed colors answer; switching palettes preserves their notes. Project-type illustrations provide quick visual cues without changing the monochrome page branding.
- Seven original, illustrative website/app style cards and five real font samples help clients react to a broad direction. These are optional conversation starters, not a site builder or finished designs. The extra styles, font samples and social rows are disclosed on demand to keep the mobile form focused. Clients can choose a preset palette or make their own.
- Three reference URL/note pairs keep each example connected with what the client likes. Website paths offer Instagram, Facebook, TikTok, YouTube, LinkedIn, X, Pinterest and other public social handles.
- Clients can email photos and videos that are not online to admin@customtechbuilt4u.com. The media email links include the business/project name, and the post-submission link includes the brief reference. Copy-address support and view-only folder instructions cover webmail and large videos. Optional image/PDF form uploads still work separately.
- Optional device-only drafts exclude file contents. Clients review and edit their brief before sending, then can download a copy.
- All appointment scheduling remains on BriefBooth. This questionnaire is a project inquiry, not a booking or signed scope.

## Live delivery verification

The labeled owner-controlled test `4U-4A50B563A952` submitted all 60 answers and one full-color PNG through the live Edge Function. The owner notification arrived in **Inbox** at admin@customtechbuilt4u.com on October 23, 2026, at 17:39 UTC (1:39 PM New York).

The actual email contained every question label and answer, matching HTML/plain text, and the original-size 30,285-byte image attachment. SPF, DKIM and DMARC passed. The private delivery record showed one accepted attempt and immediate removal of the transient attachment payload. An identical retry returned the existing receipt without a second send; a changed brief with the same request ID returned HTTP 409.

The expanded visual planner was separately tested with all **75 answers** in owner-controlled brief `4U-CECFE79650A7`. Its notification reached **Inbox** at 18:19:50 UTC (2:19 PM New York). Both HTML and plain text contained the complete expected summary, including selected style names, the font family, three URL/comment pairs, all social profiles and custom palette colors. SPF, DKIM and DMARC passed; the private record showed one accepted delivery attempt. This test used no attachments because upload handling was unchanged. The labeled database fixture was removed after verification.

Live negative checks verified rejection of an unapproved Origin and a missing public API key, plus the permitted preflight response. Rollback-only SQL tests exercised creation, same-ID deduplication, changed-content rejection and the per-network quota without sending mail or retaining fixtures. Anonymous and authenticated API roles cannot invoke the save/dispatch functions; the private table has RLS enabled. Existing booking delivery code was unchanged.

All 108 source tests passed and the production build generated 47 pages. All 22 planner browser cases passed across desktop and iPhone viewports, including 320px layouts, keyboard choices, skipped sections, review edits, original-color uploads, opt-in drafts, interrupted requests, retry identity, truthful delivery statuses, visual palette selection and restoration, style/font selections, inspiration links, conditional social fields and media email fallback. Four affected desktop/phone cases passed again after final copy/alignment and Unicode email-link hardening. Screenshots were visually reviewed. The labeled database test records were removed after verification; the owner's emails remain as evidence.

The feature uses the existing Supabase and Brevo Free resources, bounded storage and email volume, and no paid fallback. The existing static website hosting is reused. Inbox placement can vary even when the provider accepts a message.

See [project-brief-operations.md](project-brief-operations.md) for retention, quota and operator recovery details. No real client data, private management links or credentials are included in release evidence.

## Conversational planner update

The default flow now shows one question at a time, with Back/Next and preserved answers. A shorter core path replaces the nine dense question pages; clients can finish early and provide reply details, or opt into extra questions. Section navigation and draft settings are collapsed. Required contact details and final consent remain enforced.

Website clients can describe themselves as comedians, actors, musicians, creators, personal portfolios, businesses, organizations, or creative projects, with multiple choices allowed. Website goals/content include show dates, tickets, clips, reels, booking enquiries, and press kits. Optional project answers accept an explicit “No preference — help me decide,” including URL questions. The server validates and formats these answers with the same shared schema; no delivery quotas, accounts, or paid services changed.

Updated browser cases cover single-question visibility, multiple website audiences, Back, drafts, project-type changes, early finish, required identity, no-preference URLs, palette preservation, original image previews, interrupted-request idempotency, and narrow phone/keyboard use.
