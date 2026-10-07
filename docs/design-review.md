# Portfolio design review — October 7, 2026

The user needed stronger evidence of their work when approaching companies about websites and apps. The revision replaces six equal-weight previews with three expanded product stories: I Can Run A Show, The BitBinder, and The Trip Handler. BillSpilt, RoleCall, and My Gig Calendar form a compact supporting row. The complete 24-project catalog remains searchable behind an accessible native disclosure. The dark, lime, violet, and cobalt design, email contact, and single identity byline are retained.

The trade-off is deliberate: deeper projects get more room; browsing every project takes one additional click. Real product screens and specific implemented behavior are more useful to this audience than a fixed website/web-app/iOS quota. No new framework, icon pack, or purchased design system was introduced.

## Content and imagery

Three brief capability points are visible in each lead story. Source links in `projects.js` trace the claims to public implementation files. A labeled native screen selector changes each preview and caption without opening a dialog. The live example and project details remain beside the story; longer descriptions, technology details, and source code are available in the project dialog.

Showrunner uses real production-build screens with sample data, including an active cue timer, soundboard, and performer agreements. Trip Handler uses running-app screens of seeded demo trips; no payment transaction was performed. My Gig Calendar now shows its populated native iPhone calendar rather than its public fan website. RoleCall remains explicitly labeled UI PREVIEW.

BitBinder's publicly available images are from an earlier App Store release and do not show its current transcription or import-review interfaces. A clearly labeled diagram explains the source-verified document/image import path beside one authentic screen. Audio transcription is a separate path; the diagram does not imply that audio imports pass through document review. This remains a visual evidence limitation, not a claim of a newly captured app screen.

## Render and interaction evidence

Matching before/after default renders at 390×844, 1440×1000, and 1728×1000 compare the earlier grid with the expanded stories. Each lead's gallery states received separate screenshots and source comparisons. A 1440×1150 proof shows the introduction and complete first story. The supporting cards share title, description, capability, and action tracks. Explicit case rows prevent a tall screenshot from separating its title from its proof points.

Nine data checks pass. Sixteen browser scenarios cover preview loading, overflow, visible proof, accurate native/preview imagery, screen selection, the archive disclosure, search/filters, dialogs, focus restoration, email drafts, clipboard fallback, navigation, hover stability, and reduced motion. Layout-dependent render checks were repeated after the final spacing fixes. Fonts load with system fallbacks; lengths use rem except device queries, and touch controls are at least 44 pixels.

## Better Design review

Better Design's text check passed for the actual 34-word introduction with two actions. Its first product-story checks prompted shorter copy and replacing multiple gallery buttons with one labeled selector. The three on-page capability points are retained to fulfill the user's request for evidence of their best work. The tool's estimated reading-time heuristic still treats a detailed portfolio story as longer than a 15-second task screen. This is not a claim of a clean automated comprehension pass for every case story, user research, conversion improvement, or Better Design certification.

The rendered geometry review and independent screenshot review are recorded below. Source review alone is not visual approval. Complete default, expanded archive, gallery, and expanded dialog states were captured; no shortened DOM fixture stands in for the portfolio.

## Geometry finding disposition

Better Design returned `completed`, captured all required widths, and reviewed nine complete rendered states (231–663 visible elements). Its six-state input limit required separate batches; per-state reviews provide more specific evidence. There were no critical geometry findings. Output caps still truncate repeated findings, including 35 in the open desktop archive; this is not a clean automated score.

The remaining heuristic families were checked against source and screenshots:

- Native screen selectors reserve additional right padding for their platform caret. The deliberate asymmetry is documented here and preserves readable labels.
- Preview badges, arrows, and screen-reader-only live-status text are positioned outside normal flow; their measured sibling gaps do not describe actual content spacing.
- Fine-pointer desktop links have compact targets. Phone and coarse-pointer layouts expand them to 44 pixels. Small title triggers duplicate large previews or full-sized Details controls for the same action.
- The dialog's same-color inner header is not a distinct nested rounded surface; its square corners are clipped within the parent dialog.
- Actual excessive case-header and supporting-card gaps were fixed in the source and rechecked in fresh renders.

Independent source and screenshot reviews verify the supported fixes and intentional treatments. Automated findings, the missing current BitBinder workflow screenshot, and the case-story reading-time heuristic remain disclosed rather than represented as tool certification.
