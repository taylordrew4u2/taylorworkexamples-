# Website offer and client care

Updated October 23, 2026 at the owner's request.

The homepage opening, navigation, website service card, dedicated pricing panel, and footer link directly to `/offer/`. The website, salon, and restaurant service pages also link to the offer. All consultation actions continue to use the exact BriefBooth link, with no booking controls embedded on the portfolio.

The offer separates consultation requests from committing to a paid project. Scope, price, project start, and target launch are agreed in writing. It does not invent a start date or promise that a consultation reserves a project place. The offer's earlier fifteen-minute wording was removed after the live BriefBooth page showed a thirty-minute Zoom consultation.

The owner approved the all-project guarantee and support policy in this conversation: the thirty-day window starts at completed product launch, reasonable changes are included during that window, and an optional six-month debugging/support arrangement discounts changes by fifty percent. Each client's contract specifies the project details. `client-care.js` is the shared copy source for the homepage, offer, and service pages. The existing design-review deposit refund and three-month website-offer content benefit remain.

Offer proof uses an original Micro-short website image and Sarah T.'s exact approved quote from a separate client engagement. Alistair F.'s compact client account is derived only from the approved testimonial. Neither addition invents client results or publishes private client material.

Free lead tracking is provided as an internal CSV template and instructions. No paid services, new dependencies, visitor tracking, or on-site booking questions were added.

Focused browser checks exposed a slow external Google Fonts request. The existing DM Sans and Manrope variable fonts are now served locally with `font-display: swap`, their original unicode subsets, content-hashed filenames, and the original SIL Open Font License notices. Provenance and hashes are in `assets/fonts/manifest.json`. The portfolio no longer requests Google Fonts during page loading.
