# New-client journey audit — October 23, 2026

## Intended path

- **Explore:** Homepage services, website offer, and selected project stories explain what 4u Digital can build.
- **Talk:** Book a consultation opens the same 4u Digital BriefBooth page in a new tab. Appointment requests are reviewed before confirmation.
- **Write instead or add detail:** Project planner is optional before or after a consultation, requires no account or booking, and does not reserve a meeting.
- **After agreement:** Existing-client kickoff records the agreed scope, approvals, and handover. It is not a prerequisite for contacting 4u Digital.

## Changes

- Contact now leads with booking, offers the planner second, and keeps a quick-question email fallback. Removed its competing menu of service-specific inquiry drafts.
- Homepage opening and planner introduction explain when to use the planner and distinguish it from booking.
- Planner confirmation tells clients who have already booked that they do not need to book again.
- Website offer links to the optional planner instead of presenting kickoff as a prospect step. Kickoff is explicitly labeled for existing clients.
- Public meeting copy says video consultation / Meet online, matching the active Google Meet service on BriefBooth.
- Generated-page footer links have a minimum 44-pixel tap target.
- Section links now jump immediately. This avoids a mobile smooth-scroll/focus race that could change the guarantee URL hash while leaving the visitor near the hero.
- Preserved monochrome page styling, full-color project images, business email, all nine testimonials, client ownership terms, and the existing free infrastructure.

## Verification

- All 47 portfolio routes rendered at 390px and 320px: no horizontal overflow, broken loaded images, missing hash destinations, or JavaScript errors. All booking links point to https://briefbooth.com/book/4u-digital with a safe new-tab handoff.
- Mobile menu, keyboard navigation, project dialogs, persistent booking controls, and planner finish-early/review flow checked.
- Final targeted 390px/320px checks verified Contact action order, optional planner copy, offer/kickoff separation, 44px footer links, and the already-booked notice after a mocked planner response.
- Live BriefBooth at 390px: name, email, and Other / not sure yet accepted; all five optional discovery questions skipped; Google Meet service, New York timezone, and available times loaded; final review displayed Free consultation, no payment needed, and consultant review before confirmation.
- BriefBooth fixes were coordinated with its existing app chat and published on Cloudflare Pages Free (source commit d172b76). No scheduling UI was added to the portfolio.
- No real booking, planner submission, or email was sent during this audit. The live test stopped before Send consultation request; planner delivery was mocked. Actual delivery and post-approval confirmation were outside this check.
- No paid product, upgrade, or dependency was added.

- Final `npm run check`: 110 tests passed and all 47 routes built (static version `dfdb84a6a6f278be`).
- The broad local browser run covered 268 desktop/phone cases; two stale wording assertions were corrected, and its mobile guarantee-jump failure led to the immediate-navigation fix. The final focused rerun passed 26/26 desktop/phone cases, including all three earlier failures. Separate touch and rapid-keyboard checks at 320px/390px, with JavaScript enabled and disabled, confirmed the guarantee heading lands in the viewport immediately. The full publication workflow runs the entire suite again.
