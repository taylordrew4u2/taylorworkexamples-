# Attention-friendly browsing

Updated October 20, 2026, following the request to make the site engaging and easier to explore for visitors who can lose focus during long pages.

## Design choices

- Shorten the homepage introduction and all six service introductions. Preserve the actual service scope, platform boundaries, and detailed explanations further down each service page.
- Reuse the homepage capability strip for three clear shortcuts: choose a service, see project examples, or read client feedback. Each link reaches an existing section and works without JavaScript.
- Keep project screenshots, short descriptions, and practical workflows visible. Move repeated capability labels into the existing native “More project details” disclosure, where visitors can choose to read them.
- Use “View project” for a dedicated page and “Quick preview” for the dialog. Accessible names identify the individual project.
- Put project-page navigation before the large cover image. Visitors can choose the workflow, project images, or build details without scrolling through every image first.
- Collapse the contents list on short articles under “Jump to a section.” Keep the article itself visible, and retain the existing summaries for salon, restaurant, and shop guides.
- Keep the mobile consultation link reachable, with space beneath the page and automatic hiding during text entry or project dialogs. All booking continues directly on BriefBooth.
- Make the homepage opening a visitor-controlled project explorer. Native radio choices switch between BriefBooth, Micro-short Film Website, and SobStage; genuine thumbnails keep the range visible. Each active preview has an original-color image, an authentic icon or neutral initials when no project icon exists, a purpose, an accurate capture/status label, and a visible project link below the image. The two supplied native-app banners remain separate and upright alongside it on desktop, then below it on mobile.
- Bring the mobile explorer earlier by putting supporting introduction and consultation copy after the artwork. Keep the service descriptor and primary booking link above it. Selection works with mouse, touch, native keyboard controls, and JavaScript disabled. Selecting a project never hides the mobile booking dock; text-entry controls still do.
- Keep responsive lossless images and content-versioned caching. Update image sizing for the larger visual stage and small choice thumbnails without changing any original artwork. Selection has no autoplay or added script dependency.

Browsers without CSS relational selector support show all three linked project previews and omit the unavailable switcher. Modern browsers retain the same native selection with JavaScript enabled or disabled.

## Exploring the rest of the homepage

- Each service has an optional native “What could this look like?” example with a short customer journey, genuine project artwork, an accurate source label, and a dedicated project link. The core service description and action stay visible.
- Native radio filters focus the eight featured projects by website, web app, or iPhone/iPad app. The website choice includes Micro-short and Pins & Needles. All projects remain the default; a dedicated link keeps the desktop engineering example discoverable. Filtering hides existing cards rather than rebuilding them, preserving a visitor’s gallery selections. The archive keeps its separate filters and search. JavaScript adds only the current result announcement; CSS filtering works without it. Older browsers show all featured work.
- All nine client reviews are visible in one grid, with a Reviews link in the top navigation. Mobile uses a readable single column without sliders or disclosures. Every quote and attribution stays unchanged and remains available without JavaScript.
- Keep the project, feedback, process, FAQ, consultation, and guide sections in their established order. Native FAQ and gallery disclosures remain available; booking stays a direct BriefBooth link.

These enhancements add no dependencies, autoplay, paid tools, or tracking. The small work-filter module is delivered through the existing versioned caching pipeline. Reviews render directly in HTML without an extra module.

The full-color artwork, neutral site palette, reduced-motion support, testimonials, and section order are preserved. The curated selection now contains ten projects following the owner's Micro-short addition. No autoplay, rotating copy, extra tracking, or paid services are added.

## Basis and limits

The direction follows W3C’s supplemental guidance on [succinct text](https://www.w3.org/WAI/WCAG2/supplemental/patterns/o3p05-succinct-text/), [summaries](https://www.w3.org/WAI/WCAG2/supplemental/patterns/o3p08-summary-provided/), and [manageable amounts of content](https://www.w3.org/WAI/WCAG2/supplemental/patterns/o5p03-manageable-quantity/).

These are usability choices, not an ADHD certification or a guarantee of attention or bookings. Automated checks and visual review verify navigation, disclosure behavior, narrow-screen layout, and preservation of project evidence. They do not replace feedback from people using the site.
