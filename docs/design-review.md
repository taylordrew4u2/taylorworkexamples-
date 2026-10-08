# Portfolio design review — October 7, 2026

This record describes successive revisions. The v10 image update below is the current image/provenance record; earlier limitations and geometry findings are retained as history. They do not describe the current gallery.

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

## Business pitch update — October 8, 2026

The user asked to apply the Investor Panel's four pitch prompts: problem, offer, target audience, and charging. The copy now identifies businesses and teams, connects the services to online presence and disconnected workflows, and invites a project brief. Existing service headings, project evidence, email-only contact, and the single name byline remain intact. No industry niche, rates, billing model, testimonials, or measured business outcomes were invented. Scope and pricing are discussed by email; a budget range is explicitly optional.

General, service-specific, and project-specific email drafts now ask for the problem and intended users alongside the existing project, requested work, website, and launch date. This is a copy and inquiry update to the reviewed portfolio; it is not a new redesign or investor endorsement.

The updated introduction and contact invitation passed the text clarity checks. Four focused desktop/phone browser checks passed for rendering and inquiry drafts. Fresh 390- and 1440-pixel screenshots confirm readable service/contact copy without horizontal overflow. The longer technical case stories retain the previously documented reading-time limitation.


## Visual redesign — October 8, 2026

The user said the design did not represent their work well. This revision changes the composition as well as the palette: cool white and cobalt, Manrope display type with DM Sans body text, a short mixed-case opening beside authentic website and native iPhone previews, wide project images, and compact capability evidence below each image. The Mark Vegas preview represents the website implementation; the illustrated artwork shown in it is not presented as artwork by the developer. My Gig Calendar shows its populated native app. The name remains in one small identity byline.

Selected work retains the same three lead cases and three supporting projects, all 24 archive entries, factual implementation copy, live links, and email-only inquiries. Native dropdowns are replaced by visible screen-choice buttons in labeled groups. Each button exposes its selected state with aria-pressed, uses native keyboard activation, updates the real image and caption, and leaves the case dialog closed. Preview frames open the existing detailed project case. No testimonials, client logos, usage metrics, commercial results, pricing commitments, or fabricated product screens were added.

Independent screenshot and source review confirmed that the hierarchy and scan rhythm differ substantially from v8. Eighteen desktop and phone browser checks pass, covering the new hero previews and screen controls along with existing navigation, filters, dialogs, focus restoration, reduced motion, clipboard behavior, and email drafts. Thirty-nine complete rendered states at 390, 1440, and 1728 pixels fit their viewport without horizontal overflow. The review found a decorative hero label obscured by the overlapping frames; it was removed. Footer focus indicators now use white against cobalt so keyboard navigation remains visible.

The earlier automated Better Design geometry receipts above describe v7, not this new composition. They are retained as history, not reused as certification for the redesign. Original screenshot provenance and the missing current BitBinder workflow screen remain documented. The new layout is visually checked and functionally tested; it does not establish measured conversion improvement or audience preference.


## Full project imagery update — v10, October 8, 2026

The user asked for better images of everything they built. The text-only archive becomes a visual grid with a cover for every one of the 24 projects. Each project detail offers its image gallery, accurate captions, and full-size originals. Search, filters, selected-case evidence, native dialog focus behavior, and email-only contact remain available. A direct link to `#project-archive` opens the complete collection.

Seventeen covers are actual app, website, or development captures; seven are explicitly labeled source-derived overviews. Current native BitBinder captures replace the empty legacy home/settings and import illustration. Native Open Micer Timer screenshots replace the need for HTML replicas. RoleCall's old SVG preview is replaced by original script/shot-list components rendered with a fictional screenplay in a development harness. Other captures use original source views, published sample-data screenshots, or virtual microphone inputs, with those distinctions recorded in the captions. [Image evidence](image-evidence.md) records sources and limits by project.

Image acquisition used isolated local copies and fresh simulator data. Original app repositories and real user data were not changed. No production form was submitted, email sent, payment made, or native permissions granted for dictation. The Mac lock prevented a Laugh Extractor window capture; its cover remains a labeled source overview. Unavailable source/runtime surfaces are described as such rather than illustrated as fabricated app screenshots.

The image gallery preserves screenshot proportions, labels development and overview material, keeps full-resolution originals available, and retains keyboard focus while changing images. All 50 image references match their actual file dimensions. Eleven data tests and 24 desktop/phone browser scenarios pass. Sixty rendered states at 390, 1440, and 1728 pixels have no horizontal overflow or page errors. Phone landscape and paired-native galleries use shorter frames to avoid excess empty space; four affected phone checks and the final production build pass. Earlier Better Design geometry receipts are not reused as certification for v10.
