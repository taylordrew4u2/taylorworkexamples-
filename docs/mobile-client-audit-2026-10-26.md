# Mobile client journey review — October 26, 2026

Reviewed the public 4u Digital journey at phone width: homepage opening and menu, choosing a website service, Projects filtering, project previews and full pages, the optional planner, and the real BriefBooth booking handoff. Reviewed the remaining shared routes and client-facing copy against the repository's requirements.

## Fixes

- Quick project previews now offer **View full project** immediately after the primary consultation action, before the image gallery. The preview has a distinct label and the full page opens in the same tab.
- Clients editing planner answers from the final review can choose **Back to review** directly. Required name/email validation still applies, existing answers are retained, and this action cannot send the brief or book a meeting.

## Verification

- All 113 content/unit checks and 316 desktop/phone browser scenarios passed. Focused new scenarios cover narrow 320/390-pixel project handoffs and planner editing, errors, retained notes, and absence of submission side effects.
- Manual phone inspection confirmed the preview shortcut and planner return action. The site retains black, white, and gray styling and the original full-color project images.
- All seven live website/web-app project destinations returned successful responses with the expected page titles. This checks public availability, not authenticated features inside those products.
- The real mobile BriefBooth journey accepted the project type, allowed optional questions to be skipped, loaded consultation/date/time choices with the correct timezone, and reached the final request review. The test stopped before **Send consultation request**; it did not create an appointment, send a planner brief, or trigger confirmation emails.
- No paid service, dependency, analytics plan, or subscription was added.

This pass does not re-test email delivery or meeting-link generation after an approved booking. Those require a submitted and approved request and are outside this non-submitting walkthrough.

## Entire-site follow-up

The owner clarified that the polish must cover the entire site. The follow-up audited all **48 canonical pages plus the 404 recovery page**, reading the generated sitemap rather than maintaining a partial list of routes. Each route was visited at both 320 and 390 pixels in both browser projects. The audit checks the actual navigation, visible booking action and tap area, every in-page anchor, document width, footer focus/tap access, planner exclusions, and bottom-bar overlap. The test attaches its route-by-route results.

### Broader changes

- All ordinary inner pages now use the same compact mobile menu as the homepage. Escape, outside click, focus changes, link activation, and resizing close it predictably. Real navigation remains visible if JavaScript is disabled or its module fails. The focused planner keeps its intentional direct-booking header.
- The Services directory presents the four development choices before its website promotion. All six service openings prioritize booking, keep email secondary, and offer a single examples jump. Long related-project lists show two leading examples plus direct links to all remaining examples. The Apple app page links to the three published App Store apps. Related services now precede the final consultation panel.
- The comparison guide presents four stacked choices on phones, preserving the desktop table. Website evidence points to the Micro-short Film Website, and SobStage retains its release-candidate/physical-microphone validation caveat.
- All nineteen articles use their short summaries in the opening, retain their original full introduction in the body, expose a related-project jump, and end with one consultation panel after related projects and reading. Salon/restaurant articles connect the simple website and custom workflow options. Pricing articles explain the existing reasonable launch changes and optional support using shared client-care copy.
- The website offer now compares its two existing packages in readable cards, with real project/client proof before the longer care terms. Original prices, deadline, eligibility, payment terms, three-month content benefit, and guarantees remain intact.
- The NYC page explains online consultations and arranged visits in two concise cards, including visits when a physical space or uncertain needs matter. The About opening explains direct collaboration with the developer who designs, codes, tests, and launches the product.
- Black, white, and gray styling remains throughout. Original full-color artwork, all eleven project galleries, all nine testimonials, exact BriefBooth booking links, private planner behavior, and client code-ownership commitments are preserved. No paid service or dependency was added.

### Route coverage

| Area | Canonical pages reviewed |
| --- | --- |
| Opening and directories | `/`, `/services/`, `/work/`, `/insights/` |
| Services | `/services/website-development/`, `/services/web-app-development/`, `/services/app-development/`, `/services/custom-software-development/`, `/services/salon-booking-app-development/`, `/services/restaurant-ordering-app-development/` |
| Individual projects | `/work/briefbooth/`, `/work/i-can-run-a-show/`, `/work/bitbinder/`, `/work/trip-handler/`, `/work/bill-spilt/`, `/work/my-gig-calendar/`, `/work/micro-short-film-website/`, `/work/nyc-open-mic-master-list/`, `/work/open-micer-timer/`, `/work/pins-and-needles-comedy/`, `/work/sobstage/` |
| Comparison | `/guides/website-or-app/` |
| Website and industry guides | `/insights/simple-business-website/`, `/insights/one-page-vs-multi-page-website/`, `/insights/salon-business-website/`, `/insights/restaurant-business-website/`, `/insights/local-shop-website/`, `/insights/salon-booking-website/`, `/insights/restaurant-ordering-app/`, `/insights/website-launch-checklist/`, `/insights/diy-vs-custom-website/` |
| Pricing and development guides | `/insights/hourly-vs-fixed-price-development/`, `/insights/why-website-quotes-vary/`, `/insights/website-app-ongoing-costs/`, `/insights/project-changes-and-pricing/`, `/insights/custom-software-vs-existing-tools/`, `/insights/what-to-bring-to-a-developer/`, `/insights/client-portal-for-small-business/`, `/insights/freelance-developer-vs-agency/`, `/insights/spreadsheet-to-business-software/`, `/insights/first-version-app-features/` |
| Offer and company | `/offer/`, `/new-york-city/`, `/about/`, `/contact/`, `/privacy/` |
| Planning resources | `/project-brief/`, `/project-kickoff/` |

The separate `/404.html` recovery page received the same narrow-phone checks. Its intentional absolute production asset references are mapped to the current local build in the test, so unpublished asset fingerprints do not invalidate the pre-deployment review.

### Verification for this follow-up

- All 113 content/unit checks passed and the production build completed: 48 canonical pages, 11 public projects, 73 responsive images.
- The full browser run passed 351 of 352 scenarios. Its sole failure was a test incorrectly expecting the phone-only booking dock to be visible on desktop. The test now checks the visible booking controls for its viewport; the affected journey passed on both desktop and phone on rerun. No product change was needed for that failure.
- All four complete-route mobile audits passed, along with the new shared-menu, service/comparison, and nineteen-article checks. No canonical page failed the whole-site phone audit.
- Manual phone inspection covered the compact header, Services directory, comparison cards, article opening, offer packages, and NYC consultation options. A separate read-only implementation review found no remaining actionable regression in the shared navigation or page flow.
- Production booking and planner submissions remain out of this non-submitting review. The earlier live BriefBooth review boundary still applies: no request, email, or approved meeting was created by this follow-up.
