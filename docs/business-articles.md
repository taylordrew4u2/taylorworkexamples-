# Short business articles

The October 19 update adds ten short articles alongside the six existing guides at `/insights/`.

- Websites: a simple business website, one page versus several, and the existing DIY/custom guide.
- Pricing: hourly/fixed arrangements, comparing website quotes, ongoing costs, and project changes.
- Planning: preparing for a conversation, choosing existing tools, client portals, launch checks, and the existing application guides.

The homepage previews three articles. All sixteen are grouped on the guide index, with native topic links that work without JavaScript. Short articles use compact portfolio links so a small read does not become a large image gallery. Booking remains a direct link to BriefBooth.

New copy lives in `content/website-notes.js`, `content/pricing-notes.js`, and `content/business-notes.js`. `seo-articles.js` combines it with the original guides and defines the topic labels and homepage selection. These are build-time modules; they do not add a browser framework, service, subscription, or tracking script.

Use an article's own `published` date for both its visible byline and structured metadata. Preserve original publication dates when changing old articles. Update `modified` only for actual changes. Article routes are included in the sitemap, search manifest, and free inquiry-source attribution list.

Pricing articles describe possible arrangements, not a published 4u Digital rate card. They contain no invented prices, client results, delivery promises, or commercial terms. Website-only readers are explicitly welcome.

Local validation: 68 Node checks passed and the production build generated 41 indexable pages. Desktop and 390px phone layouts were reviewed in the browser; the website article had no horizontal overflow and its booking targets were at least 44px high. The CI browser suite verifies the new website/pricing journey with JavaScript disabled alongside the existing portfolio checks.
