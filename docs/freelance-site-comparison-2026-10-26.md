# Freelance developer website comparison — October 26, 2026

Compared the live 4u Digital site with the following independent developer portfolios, including their openings at a 390-pixel phone width. These observations describe presentation and navigation, not measured conversion rates or the developers' business results.

| Reference | Useful presentation pattern | Application to 4u Digital |
| --- | --- | --- |
| [Matt Farley](https://mattfarley.ca/) | A concise opening, a clear separation between capabilities, recent work, personal products, and testimonials. Public projects offer direct product links. | Keep the existing client-focused opening and all nine reviews. Add an immediate service shortcut and direct links to the existing live projects. |
| [Dennis Snellenberg](https://www.dennissnellenberg.com/) | Strong visual hierarchy, a small navigation set, selected project links with explicit design/development roles. | Retain the independent 4u Digital brand, neutral page palette, and authentic product visuals. Make exploration easier without adding a personal-name presentation, loading introduction, or additional animation. |
| [Ian Lunn](https://ianlunn.co.uk/) | Project summaries explain the work undertaken and lead to dedicated case studies; client recommendations are a distinct destination. | Preserve the eleven complete project stories and truthful implementation/status context. Let visitors navigate directly to a relevant screen inside longer galleries. |

4u Digital already provides a prominent direct booking link, an explicit service range, three published App Store examples, all nine supplied testimonials, code ownership, and the owner-approved launch guarantee. Its opening booking action is more immediately available than the contact paths in the first phone screens of these references. No competitor statistics, credentials, client logos, copy, or artwork were adopted.

## Improvements implemented

- Added **Choose a service** beside the homepage's opening actions, before its project imagery. Booking stays primary and the complete project collection stays on `/work/`.
- Converted the two supplied opening app banners to real case-page links. Normal activation still opens the existing quick preview when scripts load; links continue to work without JavaScript or if the module fails, and modified clicks retain browser new-tab behavior. The original banners remain complete and unaltered, with no text overlays.
- Added quiet **Live site / App Store** links to project cards using their existing public destinations. Complete case pages remain the primary project actions. SobStage retains its release-candidate status and has no invented live link.
- Added an optional native caption index to project galleries. It jumps to actual, focusable image destinations while preserving every original gallery frame, caption, image order, full-size link, and all 84 original files. The picker adds no scripts or image requests.
- Added comfortable 44-pixel touch areas to the remaining App Store proof and related-content links.
- Placed the existing complete payment/timing and ownership/running-cost terms immediately after the website package comparison. Expanded package scope remains available through a keyboard-operable native disclosure; original prices, eligibility, deadline, deposit terms, content-change benefit, and guarantee remain intact.
- Reused the existing video/new-tab/request-review explanation beneath the primary booking action on service, project, offer, and NYC consultation openings. Scheduling remains entirely on BriefBooth, and the planner remains optional.

## Verification boundaries

The implementation uses the existing static site, free local tools, and existing deployment infrastructure. It adds no dependencies, subscriptions, paid analytics, fonts, stock imagery, or external widgets. The page palette remains black, white, and gray; all project imagery remains in its original full color. No production booking, planner brief, or email is submitted as part of the review.

Automated regression checks cover the opening service shortcut, native banner fallbacks, enhanced previews and focus return, direct product links, gallery jumps, offer terms, booking disclosures, mobile tap targets, and the existing complete-site client journeys. Manual inspection complements those checks; passing tests alone is not evidence of client conversion.

## Validation before publication

- All 113 content/unit checks pass, and the production build still contains 48 canonical pages, eleven selected projects, and 73 responsive images.
- All 62 new or affected browser scenarios pass across desktop and phone configurations. These exercise 320/390-pixel layouts, native keyboard controls, no-JavaScript and failed-script fallbacks, actual local project pages opened through modified clicks, and unchanged original offer terms and gallery files.
- Testing exposed a desktop-to-phone menu focus race: CSS could hide a focused link before the breakpoint handler ran. The shared navigation now remembers that focus through implicit body focus loss and restores it to the visible mobile toggle, while explicit outside focus/click clears the memory.
- Manual phone inspection confirmed the early service jump, the caption picker landing on a real BitBinder screen with keyboard focus, full-color imagery, and the offer's upfront commitment terms. Key existing payment and ownership sentences are emphasized without changing their wording.
- No production form, booking, email, or planner submission was made. The complete automated workflow runs again when the release is pushed, before the GitHub Pages mirror is published.
