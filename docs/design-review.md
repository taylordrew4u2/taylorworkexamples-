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

## 4u Digital identity and palette — v11, October 9, 2026

The user named the portfolio **4u Digital**, under **taylordrew4u**, and requested that purple never be used. The header, page/social titles, organization metadata, inquiry greeting, and footer now use the brand, with a small owner credit. The portfolio's own palette uses blue, teal, and cool neutrals. Lavender project stages become slate, and violet workflow illustration accents become teal. Genuine project screenshots retain their original interfaces. Repository instructions preserve the branding and color preferences for future work.

## Selected Open frame identity — v12, October 9, 2026

The user selected the Open frame logo from the Creative Production board and limited the brand palette to black, white, and red. The selected frame-and-cursor mark now forms the header lockup and browser icon. Its background was removed with built-in Imagegen; proportion-preserving exports trim transparent margins and provide a 256px header asset and 64px icon. The brand name remains ordinary HTML text for exact spelling and accessibility.

The site now uses pure white pages, black surfaces, neutral image stages, and red accents. The seven source workflow diagrams use the same palette with gray secondary strokes rather than translucent red. Their content and geometry remain unchanged. Original product screenshots retain their original interfaces and colors. The small owner credit, email-only contact, all project galleries, and existing interaction behavior remain available.

## Monochrome palette — v13, October 9, 2026

The user replaced the red palette with black, white, and gray only. The selected Open frame silhouette remains, with a gray cursor and black frame. The header, browser icon, links, controls, headings, and seven workflow illustrations are now monochrome. Project previews, galleries, and full-size originals retain their source colors; the user clarified that monochrome applies only to page accents and branding. No grayscale or recoloring filter is applied to the work. The updated preference is recorded in repository instructions; earlier red explorations remain historical design assets.

## GitHub project refresh — v14, October 9, 2026

The user approved the visual design and requested current GitHub projects. A fresh public inventory contains 16 project repositories, excluding the profile and portfolio repositories. All 16 are represented alongside eight earlier work examples whose repositories no longer resolve publicly. The catalog keeps 24 projects, removes unavailable source links from interactive controls, and labels their source status without guessing whether a repository is private or deleted. The personal-site repository and live URL are canonicalized; TLC's archived status is disclosed. Public metadata is a checked-in snapshot, with no GitHub request on page load.

Current source review expands Pins & Needles' live-show controls, Trip Handler's meal/bedmate/discussion workflows, SobStage's headphone routing and recording-stem alignment, and BitBinder's Siri/Shortcuts capture. Showrunner's encryption stack is corrected to crypto-js. BillSpilt's balances image is explicitly an admin view. The layout, brand, selected work ordering, and monochrome page accents remain as approved.

The gallery has 51 views and 55 image references. Trip Handler adds genuine board, itinerary, and paired mobile views; SobStage adds real interruption and saved-take captures using virtual microphones. Pins & Needles adds its audience countdown. Capture sources are pinned, their proportions and original colors are preserved, and dates or earlier UI versions are disclosed where appropriate. Twelve data checks pass, including asset dimensions and complete public-project representation. Browser regression coverage includes unavailable-source suppression while retaining working live-site and public-source links, alongside the existing desktop/phone gallery, navigation, focus, and inquiry checks.

## Public GitHub projects only — v15, October 12, 2026

The user requested removal of projects no longer on GitHub. A fresh public inventory still contains 16 project repositories. Eight unavailable entries are now removed from project data, visual metadata, archive search, and project details. The opening website preview uses Pins & Needles instead of Mark Vegas. The archive heading and count reflect the 16 remaining projects, and the catalog only accepts entries present in the public snapshot. TLC remains because its archived repository is still public.

The build now packages only images referenced by the current catalog and page, so removed-project media is omitted from the deployed site. Historical source assets remain recoverable in the repository. Existing layout, selected project order, full-color screenshots, monochrome page accents, and logo remain intact. The source snapshot was checked October 12; image evidence retains its original capture revisions and dates.

## Product identities and explanations — v16, October 12, 2026

The user requested more credible project presentation and actual product icons because screenshots did not explain enough. The 16 public projects now have plain-language purposes and three concrete workflow labels. Authentic icons from public source appear beside names in selected work, the archive, and dialogs. Fifteen projects have genuine marks; Micro-short uses neutral MS text initials because its source has no verified logo or favicon. No replacement brand was invented. Source URLs and original dimensions are recorded in identities.js and docs/project-icons.md.

Archive entries place product identity and purpose before their screenshots, retain honest capture context, and expose direct live-site or App Store links where available. Technical stacks remain in project details and search. Product icons and screenshots retain original colors and proportions, while the page's branding and accents stay monochrome. The production build includes nested icon assets, and vercel.json supports an additional static Vercel deployment. Eighteen data checks pass; browser coverage adds icon rendering, workflow explanations, and purpose-based search to the existing gallery and interaction checks.

## Built4U offer and homepage — v17, October 12, 2026

The user selected the exact public name **Built4U**, tagline **Custom tech. Built for you.**, and descriptor **Apps, websites, and software for your business.** The opening headline now reads **You know your business. I’ll build the technology.** The supplied body copy explains the app, website, and software offer, development from start to finish, and getting started without a technical background or finished plan. Header, footer, social/page metadata, organization data, and inquiry greetings use Built4U consistently. Canonical and social URLs point to the user-owned https://customtechbuilt4u.com/ domain.

The longer headline uses a narrower measure, smaller responsive type, balanced line wrapping, and an earlier one-column hero breakpoint. The header brand is compact, the tagline is prominent, and the business descriptor sits immediately below the headline. The existing work sections, sixteen public projects, genuine product icons, screenshots, Open frame mark, monochrome page palette, and email-only interactions are retained. Historical logo filenames and previous design records remain unchanged. No customer outcomes, audience preference, or conversion improvement are claimed.

Local verification covers JavaScript syntax, the eighteen data tests, and production packaging. Browser assertions cover the approved opening copy, visible and accessible Built4U identity, headline containment, and new inquiry greeting alongside existing gallery, navigation, focus, and search checks. Local browser access remains restricted by the earlier URL-policy block, so this source review does not claim a fresh rendered visual pass; desktop and phone browser verification belongs to remote CI and the public deployment review.

## Client scenarios and My Gig Calendar showcase — v19, October 12, 2026

The v20 responsive follow-up reduces the mobile canvas to 20rem for the supplied landscape banner while retaining the 36rem portrait canvas. Original image pixels and proportions remain unchanged. The exhaustive catalog/gallery browser check has a specific 60-second test limit to cover all 48 serial gallery views; assertion timeouts and all assertions are unchanged. The user confirmed that only the seven supplied product images should be added.

The user asked for a more intriguing client-facing website. The existing service section now precedes selected work as three compact business scenarios, each connected to a genuine project example and a topic-specific email draft. Selected work has a concise introduction relating websites, apps, and software to practical tasks. The three-step process explains discussing the problem, agreeing scope and price, and building, reviewing, and launching. Native FAQ disclosures near contact address an unfinished idea, scope-based pricing, and discussing maintenance and hosting/service costs during project definition. Hero and contact inquiry links invite clients to tell the developer what they need.

The approved Built4U headline, body, tagline, descriptor, Open frame identity, admin@customtechbuilt4u.com recipient, sixteen public projects, and selected-project order remain intact. Page accents remain monochrome; genuine icons and screenshots retain their original colors. No testimonials, client relationships, measured outcomes, rates, fixed timelines, ownership commitments, or free ongoing support are introduced. Email links prepare drafts; the site does not send email.

The user also supplied seven My Gig Calendar promotional images. They follow its two native captures in a nine-view gallery, with explicit supplied-product-artwork captions and provenance. My Gig Calendar's supporting card now spans the available width below BillSpilt and RoleCall, with a large preview beside its information and visible image choices on desktop; phone layouts stack the content. Gallery selection updates the genuine image, caption, orientation, and selected state without opening a dialog. The initial native calendar cover, project dialog, App Store link, and full-size originals remain available. The supplied open-mic performance video is not embedded as an app demo. No image was generated, repainted, or recolored.

Local checks cover source syntax, data, exact image dimensions/provenance, and production packaging; browser assertions cover proof-dialog focus, email topics, native FAQ keyboard behavior, the process and section order, viewport fit, and My Gig Calendar's on-page gallery. No local browser is run because the earlier URL-policy restriction still applies. Fresh rendered verification remains with remote CI and the public deployment review; this update makes no claim of tested conversion improvement.

## Consistent project showcases — v21, October 12, 2026

The user asked to bring the other showcases up to My Gig Calendar’s presentation standard. All six selected projects now use wide image-led rows with the original product icon, clear purpose, visible screen choices, honest capture captions, and full-size originals. BillSpilt and RoleCall gain full-width galleries and visible workflow steps. The leading three retain their factual capability explanations beside the media; their controls and captions match the supporting showcase treatment.

The expandable collection changes from three small columns to two larger columns on desktop and one below 800px. All sixteen projects receive visible source captions and original-image links; twelve projects have inline image choices and four single-frame projects omit redundant selectors. Gallery changes keep keyboard focus, update the caption and full-size link, and only change their own card. Filter/search rebuilds reset archive galleries to their original covers without affecting selected work. Project details remain accessible from the preview and title.

No new app screenshots, product claims, recoloring, or fabricated marketing graphics were introduced. Original screenshots, icons, supplied My Gig Calendar artwork, source-overview disclosures, and all sixteen project records remain intact. Local syntax, data, and production-build checks pass; rendered verification is performed by remote browser CI and the public HTTPS deployment.

The v22 public visual review follow-up makes landscape image elements follow their intrinsic height inside the contained stage. This keeps shadows around the actual screenshot instead of an unnecessarily tall image box, including desktop-and-phone pairs. Portrait stages and source pixels remain unchanged.

The v23 follow-up keeps the archive image type and capture context in sync when switching between My Gig Calendar’s native captures and supplied product artwork. Returning to a native view restores its original context. The gallery regression helper verifies both fields along with the image, caption, original link, and selection. The v22 full run passed all 78 desktop/phone browser checks and 19 data checks before this focused label correction.

## The BitBinder supplied artwork — v24, October 12, 2026

The user asked to add the images from their `Downloads/bb` folder to The BitBinder. Nine original PNGs extend its three native development views to twelve gallery choices across selected work, the expandable collection, and project details. The supplied banner and feature illustrations keep their original pixels, colors, and proportions. They have descriptive alternatives, supplied-product-artwork captions, and full-size original links. Existing native captures and their dated sample-data context remain intact; the new artwork does not establish new runtime, transcription, AI, or cloud validation. The direct showcase anchor is `#the-bit-binder-showcase`.

The asset record contains dimensions and original SHA-256 hashes. All nine source assets and packaged copies match the supplied files byte-for-byte. Twenty data checks and syntax/build checks pass locally. The browser gallery checks are split by lead project so each complete image sweep stays bounded as the gallery grows. Public HTTPS rendering and remote desktop/phone verification complete the release review.

## Banner-first project covers — v25, October 12, 2026

The user selected the supplied product banners as the main showcase images for The BitBinder and My Gig Calendar. Each banner is now the first gallery entry and the canonical cover, so it appears by default in selected work, the project collection, and project details. The banner dimensions, original colors, and original files are unchanged. All other gallery entries retain their relative order and remain available.

Both covers are identified as supplied product artwork. Native frames retain their original capture labels and context so changing between artwork and app captures keeps the archive description accurate. Existing gallery counts remain twelve and nine respectively; total visual evidence stays at 57 views and 61 image references. The repository preference record preserves the user's choice for future edits. Twenty data checks, syntax checks, and the production build pass; focused browser assertions check first-load banner selection across all three surfaces, alongside the retained gallery regressions.


## Cohesive opening product preview — v26, October 13, 2026

The user found the Pins & Needles/My Gig Calendar opening collage unconvincing and its overlay treatment incoherent. The opening now gives the full preview area to one complete, upright Showrunner workspace. Its original screenshot has no crop, rotation, recoloring, or overlapping device. The authentic project icon, name, short workflow description, and “Web application · Sample workspace” label sit in a separate row below the image. The whole preview opens the matching project dialog using the existing accessible control behavior.

The decorative orbit, asterisk, fake browser chrome, overlapping phone, and absolute caption have been removed. Mobile stacks the approved introduction, preview, and caption. The selected My Gig Calendar and BitBinder banner covers and their galleries remain unchanged. All page accents stay black, white, and gray; source colors remain intact. The preview depicts sample show data and does not claim a new runtime validation or client outcome.
