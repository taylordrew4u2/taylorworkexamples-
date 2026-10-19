# Mobile client journey audit — October 19, 2026

Scope: the live 4u Digital portfolio and its handoff to BriefBooth. All checks used free local tools, public HTTP responses, browser inspection, and the existing test suite. No consultation was submitted, no time was reserved, and no email was sent. No paid audit, analytics, image service, or subscription was added.

## Findings and repairs

- Project previews offered email, full project stories, and demos, but no direct booking action. Added the exact BriefBooth link near the project introduction and after the details; the preview and selected image remain intact when a client returns.
- Service pages and project openings prioritized email. Added prominent direct consultation links while retaining the business email alternative and original project/demo links.
- The mobile service header booking target measured 39px high at a 390px viewport. Booking links now have a minimum 44px target; manual checks at 320, 390, 768, and 1440px found no horizontal overflow in the homepage, salon service page, or BitBinder page.
- Project section navigation and evidence disclosures had smaller touch areas. They now have 44px minimum heights. Mobile project search text is 16px rather than 13px.
- Per the owner's latest instruction, removed the on-site booking walkthrough. All intake, time selection, and confirmation happen after the external BriefBooth link. The portfolio retains basic Zoom/NYC service information and general project email links.
- Added a visible personal-project disclaimer on the homepage and work index: this is a selection of personal projects, not every app built. Clients own 100% of the custom code built for their project. Client work and code will never be included in the public portfolio without permission. Short ownership reminders appear on service/project pages and in previews.
- Added BriefBooth as the first featured project, an opening preview, and a dedicated project story. Captures show the genuine public site and built-in demo in full color. The source link is labeled Project repository because the public repository currently contains only a README. No private records are included.

- Browser regression checks caught two gallery issues after the featured order changed. Supporting cards now size paired phone screens to their available width without clipping or large empty frames. The archive uses the first capture’s own label and context on initial load, matching subsequent gallery selections. Manual checks confirmed both phone images stay inside their frame at 320px and 1024px.

## Delivery and external handoff

Before the changes, all 30 sitemap pages, 84 booking links, 84 immediate local assets, and 10 imported browser modules were reachable. Fingerprinted images, scripts, and styles retained their long immutable cache headers. The existing image delivery pipeline and untouched originals remain in place.

The actual mobile project-preview consultation link opened `https://briefbooth.com/book/4u-digital` in a new tab. The destination displayed the 4u Digital profile and first intake screen without horizontal overflow. No form was filled out or submitted. Read-only public availability requests returned times; this does not verify final submission, consultant approval, or confirmation email delivery.

BriefBooth's public configuration uses approval mode and a Zoom consultation service. Its copy describes NYC visits as follow-ups. The portfolio describes their purpose and availability by arrangement. The separate BriefBooth application was not modified.

## Comparison with similar sites

This is an editorial comparison of public content and navigation, not a conversion-rate or competitor performance study.

| Site | Useful approach | Application to 4u Digital |
| --- | --- | --- |
| [Melanie Arnold](https://melaniearnold.io/) | Clear small-business offer, direct-developer communication, code ownership, and problem/build/status case descriptions. | Keep business uses and ownership visible alongside the work. |
| [Valentina Koniukhova](https://yahhi.me/projects/) | Distinguishes independent products from client work and testing, with real App Store links. Her [homepage](https://yahhi.me/) links to external booking. | Preserve personal-project labels, App Store proof, accurate development status, and the separate BriefBooth handoff. |
| [Dawloom](https://dawloom.com/work/) | Shows work through business workflows; its [homepage](https://dawloom.com/) distinguishes web, mobile, and desktop services with direct contact. | Connect the existing technical range to recognizable business needs rather than adding more gallery items. |

The main remaining evidence gap is permissioned client outcomes or testimonials. Add them only when available and approved; do not invent client names, results, reviews, or permission. The nine selected personal projects and three App Store apps are concrete product evidence.

## Verification boundaries

Regression coverage includes exact native new-tab booking destinations, return to the original page, modal image/focus preservation, email alternatives, touch target sizing, narrow viewport fit, outbound-only booking without JavaScript, and the ownership disclosure. The existing image/source-integrity, gallery, kickoff form, and static-page checks remain required. A real consultation submission and its resulting email/calendar behavior were deliberately not tested against production.
