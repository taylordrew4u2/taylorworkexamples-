# Portfolio design review — October 7, 2026

This was a polish of the existing dark, lime, violet, and cobalt portfolio for prospective website and app clients. The existing typography and real project imagery were retained. No framework migration or new design-system purchase was needed.

The introduction now explains the offering briefly and names email as the action. The single identity byline follows the introduction. Featured projects share title, summary, capability, and action tracks using CSS subgrid; capability pills keep their intrinsic height. Source links sit below the live example and case-study actions. The footer address is secondary to its email action.

Lengths use rem, with device breakpoints remaining in px. Layout spacing follows a four-pixel rhythm. Hover changes screenshots inside stationary controls, and reduced motion preserves the screenshots' static positioning. Phone and coarse-pointer controls have expanded touch areas. Search keeps its accessible name and a 44-pixel input height.

## Evidence

- Matching before/after renders at 390×844, 1440×1000, and 1728×1000; expanded case-study renders on phone and desktop.
- All six featured entries, 24 archive entries, technical disclosures, and source links preserved. Project data is unchanged from the preceding version.
- Space Grotesk loaded at all intended weights. Minimum sampled text contrast was 7.11:1.
- Nine data checks and browser coverage for render/overflow, filtering/search, dialogs/focus, email drafts, clipboard fallback, navigation, card alignment, and hover/reduced motion.
- Better Design's comprehension check passed for the actual 35-word introduction with two actions. This is a text check, not user research or visual approval.
- Better Design's geometry inspection returned `completed` for all required widths, using five complete, unfiltered captured states. Screenshots received a separate visual review.

## Geometry finding disposition

The automated spacing report retains heuristic findings and is not a clean automated pass. Its 80-item output cap also truncates repeated findings. Independent review applied the rule exceptions and checked the rendered layout:

- Small project-title controls duplicate a large preview or a 44-pixel Details control for the same action, allowed by `rule/touch-target-min-44px`.
- Compact fine-pointer desktop links are covered by expanded controls on coarse-pointer devices; the touch-target rule applies to touch devices.
- Portraits deliberately crop within their preview frames; full images are available in the project dialog, allowed by `rule/no-unintended-overflow`.
- Absolutely positioned preview badges/arrows and nonvisual live-status text are not flow siblings. Their reported gap differences are capture-scope false positives.
- The real search and archive-link target-size issues were corrected. Services use an explicit text/icon grid, eliminating the asymmetric-inset trigger.

No supported serious or critical defect remained after the source, interaction, and screenshot reviews. This review does not claim conversion gains, client outcomes, or a Better Design certification.
