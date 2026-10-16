# 4u Digital service pages and contact attribution

Public brand: **4u Digital**. Tagline: **Custom tech build for you.** The primary domain and business email remain customtechbuilt4u.com and admin@customtechbuilt4u.com.

The homepage services section now links to salon booking and restaurant ordering service pages. Both pages explain a prospective customer and staff workflow, scope decisions, questions, related planning guides, and genuine portfolio examples. Their examples do not claim completed salon or restaurant client work. All projects remain grouped before the process, consultation, and FAQ sections.

Consultation actions say **Request a consultation**. The form prepares an email; the meeting is agreed and confirmed by email. It does not promise automatic booking, availability, fees, or a meeting duration.

## Received inquiries

Business inquiry drafts include a terminal `Source page` line containing a known public canonical page URL. Links from other pages to the homepage consultation carry a `from` parameter containing only that public path. The form and clipboard draft retain it. Unknown paths, arbitrary URLs, query strings, and fragments cannot become source references. Attribution does not persist across visits or unrelated page navigation. A received email is the evidence of an actual inquiry; opening or copying a draft alone is not.

## Aggregate contact reports

The analytics module supports Vercel Web Analytics on the primary production domain. It sends `Contact intent` events with only two properties: `page` (known public path) and `action` (fixed action label). Consultation email actions distinguish Zoom and in-person; copy actions are recorded only after clipboard success. Invalid form submissions and failed copies produce no successful-contact event.

No project description, preferred time, search input, email body, arbitrary URL parameter, or visitor identifier added by the site is collected. The provider's page URLs are stripped to known public paths. Global Privacy Control and Do Not Track disable collection. No analytics is loaded on localhost, preview deployments, the GitHub Pages mirror, or the noindex 404 page. Provider failure leaves the contact flow usable.

Reporting location: Vercel → **4u-digital** project → **Analytics** → **Events** → **Contact intent**. Select a page/action breakdown to compare interest from the homepage, services, guides, and project pages. These are intent counts, not email delivery or booking confirmations.

Activation requires both `site.analyticsEnabled` and the project's Web Analytics setting. The existing Vercel team is Pro; custom events are supported. Vercel's published price is $0.03 per 1,000 collected page-view and custom events, subject to existing monthly usage credit. No Analytics Plus subscription is needed. Paid activation is pending user approval.

## Verification

Source checks cover canonical routes, truthful examples, metadata/schema, source attribution, no-JS links, data bounds, redaction, initialization, and failure handling. Browser checks exercise the real UI hooks with a mocked analytics transport so test form text is never sent to a reporting provider. The public privacy page describes the active state and email-draft handling.
