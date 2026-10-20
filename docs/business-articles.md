# Short business articles

The October 19 update adds ten short articles alongside the six existing guides at `/insights/`.

- Websites: a simple business website, one page versus several, and the existing DIY/custom guide.
- Pricing: hourly/fixed arrangements, comparing website quotes, ongoing costs, and project changes.
- Planning: preparing for a conversation, choosing existing tools, client portals, launch checks, and the existing application guides.

The October 20 update adds three website-only articles for salons, restaurants, and local shops. They cover useful public information, photographs, mobile contact routes, and links to existing business tools. These are distinct from the older salon booking-system and restaurant ordering-app guides.

The homepage previews three articles and links directly to the new “By business” topic. All nineteen are grouped on the guide index, with native topic links that work without JavaScript. Short articles use compact portfolio links so a small read does not become a large image gallery. Booking remains a direct link to BriefBooth.

New copy lives in `content/website-notes.js`, `content/industry-website-notes.js`, `content/pricing-notes.js`, and `content/business-notes.js`. `seo-articles.js` combines it with the original guides and defines the topic labels and homepage selection. These are build-time modules; they do not add a browser framework, service, subscription, or tracking script.

Use an article's own `published` date for both its visible byline and structured metadata. Preserve original publication dates when changing old articles. Update `modified` only for actual changes. Article routes are included in the sitemap, search manifest, and free inquiry-source attribution list.

Pricing articles describe possible arrangements, not a published 4u Digital rate card. They contain no invented prices, client results, delivery promises, or commercial terms. Website-only readers are explicitly welcome.

Validation covers production metadata, all article copy, the complete nineteen-article topic index, 44 indexable routes, and inquiry-source attribution. The browser suite follows the homepage topic link through all three industry articles on desktop and phone with JavaScript disabled. Existing publication dates and unchanged-page sitemap dates are preserved.
