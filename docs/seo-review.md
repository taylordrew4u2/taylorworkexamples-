# Built4U SEO/GEO implementation review — October 14, 2026

## Scope and status

Reviewed `scripts/seo.mjs`, `seo-content.js`, `public-projects.js`, `render-projects.js`, `index.html`, `seo.css`, and `scripts/build.mjs`. The generator was run into an isolated temporary directory for an independent raw-HTML, link, schema, and privacy check. Core source files were not changed by this review.

The initial implementation prepared **25 indexable HTML pages for 15 portfolio projects**. The article and consultation expansion prepares **33 indexable pages**. **The original 25 pages have been published and independently returned HTTP 200 with their exact primary-domain canonicals. The eight-page expansion is prepared for publication at this record’s creation.** Publication is separate from Google indexing; no ranking or citation improvement has been measured. An already authenticated Google Search Console session was available. Built4U was not a listed property; its URL-prefix property and homepage HTML verification tag have been prepared. Google confirmed HTML-tag ownership verification and accepted the original 25-page sitemap submission on October 14. Search Console reports that performance and indexing data are processing. The sitemap at the same URL will include all 33 pages after the expansion is published. No Bing Webmaster Tools connection was made. Actual publication and submission evidence will be recorded separately after the public checks.

## Pre-edit baseline

Baseline captured **October 14, 2026, at 11:59:30 EDT**, before SEO/GEO edits. The live homepage loaded `app.js?v=29`.

- Apex homepage returned HTTP 200; www returned 308 to the apex. The canonical was already `https://customtechbuilt4u.com/`.
- `/robots.txt`, `/sitemap.xml`, and `/llms.txt` each returned 404. Missing robots did not by itself establish that crawling was blocked; missing llms.txt was not treated as an indexing failure.
- The 15,492-byte initial response contained the offer, three service scenarios, process, FAQ, business email, and Organization schema. Its `featured-projects` and `archive-projects` containers were empty. Core project descriptions, project-specific source/live links, galleries, and details required JavaScript.
- Googlebot, Bingbot, OAI-SearchBot, GPTBot, ClaudeBot, and PerplexityBot User-Agent GETs returned 200 with identical homepage bytes. These were simulated headers from the audit network, **not tests from genuine crawler IP ranges**. No access-log/CDN-firewall audit was performed.
- No meta noindex or X-Robots-Tag was observed.
- Seven fixed public web-search queries returned no Built4U/domain sources: **0/7 observed retrievals**, not an AI-answer visibility metric. Search-result positions, indexing coverage, query volume, competition, conversions, and AI-answer Share of Mentions were not measured.

| Fixed query | Target domain in returned sources | Exact Built4U string in returned output |
| --- | --- | --- |
| Who can build a custom app for my small business? | No | No |
| custom website developer for small business | No | No |
| hire developer custom business software | No | No |
| full stack developer websites iPhone apps business | No | No |
| developer booking website business admin tools | No | No |
| Built4U custom tech built for you | No | No |
| site:customtechbuilt4u.com | No; empty result | No |

One retrieval run per query was saved before edits. No independent ChatGPT, Gemini, Perplexity, or Google AI Overview answers were run. AI-answer **Share of Mentions, Share of Direct Citations, and indirect citation counts are unmeasured**, rather than zero. The sample does not prove global non-indexing or any organic ranking. Full raw outputs and HTTP responses remain in `/tmp/built4u-seo-search-baseline.json` and `/tmp/built4u-seo-crawler-baseline.json`; combined record `/tmp/built4u-seo-baseline.json`. The baseline homepage SHA-256 is `be26dc67a8c51ab2d9cfabb77914653f40283fe964a812319c3140c21cd7f403`.

## Implementation findings

**Initial HTML and navigation.** The deployment build now inserts the six selected showcases and fifteen catalog cards before sending the homepage. It provides 21 ordinary Full project story links, and each project has a separate static route with purpose, workflows, development details, gallery markup, capture notes, and genuine GitHub source links. All33 generated pages contain one H1. The independent generated-page check found no duplicate IDs or broken internal route, file, or fragment references. The guide uses a real table with caption and row/column headers. Native disclosures retain FAQ and image access without requiring scripts.

**Enhancement and packaging.** The same render module serves build-time generation and client enhancement; the homepage leaves existing static cards in place instead of replacing them on startup. Built output serializes only the approved fifteen-project projection and packages only referenced product/branding images. The personal website and its unneeded preview/icon are not selected for the deployment. The source audit inventory remains in the repository. Other page HTML is fully usable without client JavaScript. Raw source `index.html` remains a template; the deployable `dist/index.html` is the pre-rendered output.

**Public source access.** October 14 checks returned 200 for the allowed GitHub profile and all fifteen project repositories; all fifteen remain public, including archived TLC. The former `usbmic` repository now resolves to `taylordrew4u2/SobStage`. Published source/documentation links use that canonical repository name while the stable catalog ID and older pinned evidence stay intact. This link check does not establish new runtime or hardware validation.

**Metadata and crawler discovery.** Each planned route has a unique descriptive title, description, absolute primary-domain canonical, Open Graph fields, and robots index/follow metadata. Canonical, navigation, and sitemap routes share the trailing-slash convention; Vercel is configured for trailing slashes. Main-page asset and navigation paths remain relative so the GitHub Pages mirror works beneath its repository path. The404 is noindex, omitted from the sitemap, and uses primary-domain absolute assets/recovery links so an unknown nested URL does not break them. Robots permits crawling through a wildcard Allow rule and names the canonical sitemap. The new robots and sitemap responses still need public verification.

**Schema.** Generated JSON-LD parses on all 33 pages. Organization and WebSite identity use Built4U and `admin@customtechbuilt4u.com`; page/breadcrumb identities use stable canonical URLs. Service nodes describe the visible four service offers without invented prices, service areas, address, ratings, or guarantees. Project nodes use CreativeWork, rather than app-store review or product-offer claims that lack evidence. FAQPage answers correspond to visible native FAQ disclosures. No public Person, founder, owner biography, parentOrganization, LLC metadata, or personal stand-up attribution is generated.

**Truthfulness and source limits.** Services explain scope and specific workflow decisions without customer testimonials, conversion statistics, fabricated numbers, fixed prices, delivery guarantees, or free-support commitments. Existing project artwork, native/development captures, sample records, and hardware limitations retain their source contexts. The BitBinder supplied artwork is separate from its dated native captures. BleepKit remains a source workflow overview; DicType has onboarding with permissions pending; TLC remains a development/sample-data example; SobStage retains virtual-microphone limits. Showrunner's private producer workspace and fixture remote settings are not labeled as a public audience viewer or physical Bluetooth validation. A portfolio example is not claimed as a commissioned client relationship.

**Brand privacy.** Built4U is presented as a standalone business. The owner credit and parent-company schema are removed. Only `taylordrewwebsite` is excluded from the published projection; fifteen other public software projects remain. GitHub profile and project-source links are explicitly allowed by the user. References to performers and comedy workflows within genuine software projects and unaltered artwork remain product evidence, not a personal stand-up biography. Project image pixels are not recolored or masked. Built4U's page accents stay black, white, and gray.

## Article and consultation expansion

Six original articles cover freelance developer versus agency, DIY versus a custom website, salon booking workflows, restaurant ordering, spreadsheet-to-software workflows, and the first useful app version. Each is about 480–500 words before shared navigation and related project examples. These are distinct client questions with practical steps, source-backed software examples, and clear project boundaries. Agency comparisons identify direct-contact benefits and situations where an agency is useful; they do not promise that freelancers are always cheaper or faster. Salon and restaurant scenarios are potential scopes, not invented client case studies.

The user explicitly offers in-person consultations in the New York City area and Zoom consultations. The home, company, contact, article, and local pages explain arranging these by email. No fee, free consultation, duration, office address, calendar slot, or automatic booking has been invented. The local page uses Service with areaServed City New York City, and no LocalBusiness or physical address. Article author/publisher is Built4U’s Organization, matching the visible byline; no Person or personal biography is introduced.

Local `npm run check` passed 31 data/SEO tests and a 33-page production build. The initial remote run passed 97 of 98 browser cases; one old phone navigation assertion selected every navigation region after new footer/service navigation was added. The assertion now targets `#main-nav` and retains open/close visibility and focus checks. The expansion enumerates 100 desktop/phone browser cases, including ten no-JavaScript cases; its remote execution remains pending at this document’s creation. Public release checks and the final input register are saved after deployment in the dated Built4U SEO publication artifact, separate from this pre-publication source review.

## Anti-pattern review

Read the GEO skill's `references/anti-patterns.md` before this pass. Service pages combine introductory prose, concrete task/scoping sections, actual project examples, and a limited FAQ. The comparison guide adds an actual decision table; content is not divided solely by character counts. The text names the services and projects consistently, avoids unsupported result claims and reflex promotional praise, and explains uncertainty with scope factors. Paragraphs are task-based rather than interchangeable adjective lists. Important claims exist in text as well as source artwork. Original artwork is preserved rather than treated as freshly verified runtime behavior.

Dates reflect a substantive new-page/static-render release, not an artificial freshness change. `lastmod` is 2026-10-14 for this prepared release. The catalog's separate GitHub snapshot date remains its real recorded date. Future builds should change review/lastmod dates only when the corresponding content changes. No measured visibility gain is claimed.

No unresolved serious issue was found in the source/generation pass. During review, missing client-module exports were identified and then corrected by the implementer; `labels` and `external` exports were rechecked. Nested404 relative-link behavior was identified and corrected with canonical absolute links. Category-derived project titles now name Website, iOS app, or Desktop application instead of a generic Software Project suffix where the category is known. Genuine project icons were also added to the new service/work cards and individual story headings; their route-relative asset paths were inspected. Fresh browser and live response checks remain outside this document's completed verification scope.

## Current primary guidance and limits

Google can render JavaScript, but its documentation recommends server-side/pre-rendering because not every bot does. Real `<a href>` links aid discovery. [Google JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

Google's AI features use foundational SEO practices: readable text, allowed crawling, internal links, useful content, and structured data that agrees with visible content. Meeting the requirements does not guarantee crawling, indexing, or serving. Special AI files and special schema are not required. [Google AI features guidance](https://developers.google.com/search/docs/appearance/ai-features).

A sitemap can help discovery but does not guarantee indexing. No account-based submission is claimed. [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview).

Google's May 2026 update says FAQ rich results stopped appearing from May 7; its June 15 update removed their documentation. The same June 15 record clarifies that llms.txt does not affect Google visibility or rankings. FAQPage here is truthful semantic markup only, with **no Google FAQ-feature promise**. No llms.txt or AI-file ranking effect is claimed. [Google Search documentation updates](https://developers.google.com/search/updates).

## Publication input register

Prepared/build date: **October 14, 2026**. Register scope: 25 planned canonical pages, including the rebuilt homepage, four service pages, fifteen project stories, one comparison guide, and supporting index/about/contact pages. **Publication status: PENDING root verification**. A successful local generation is not a live-publication or indexing confirmation. Replace the pending status with a verified publish date, deployment identity, and public response evidence after publication. Leave indexing/submission unverified until measured separately.

| Planned canonical URL | Prepared date | Public publication status |
| --- | --- | --- |
| https://customtechbuilt4u.com/ | 2026-10-14 | Pending verification |
| https://customtechbuilt4u.com/services/ | 2026-10-14 | Pending verification |
| https://customtechbuilt4u.com/services/website-development/ | 2026-10-14 | Pending verification |
| https://customtechbuilt4u.com/services/web-app-development/ | 2026-10-14 | Pending verification |
| https://customtechbuilt4u.com/services/app-development/ | 2026-10-14 | Pending verification |
| https://customtechbuilt4u.com/services/custom-software-development/ | 2026-10-14 | Pending verification |
| https://customtechbuilt4u.com/work/ | 2026-10-14 | Pending verification |
| https://customtechbuilt4u.com/work/i-can-run-a-show/ | 2026-10-14 | Pending verification |
| https://customtechbuilt4u.com/work/bitbinder/ | 2026-10-14 | Pending verification |
| https://customtechbuilt4u.com/work/trip-handler/ | 2026-10-14 | Pending verification |
| https://customtechbuilt4u.com/work/role-call/ | 2026-10-14 | Pending verification |
| https://customtechbuilt4u.com/work/bill-spilt/ | 2026-10-14 | Pending verification |
| https://customtechbuilt4u.com/work/my-gig-calendar/ | 2026-10-14 | Pending verification |
| https://customtechbuilt4u.com/work/bleepkit/ | 2026-10-14 | Pending verification |
| https://customtechbuilt4u.com/work/dictype/ | 2026-10-14 | Pending verification |
| https://customtechbuilt4u.com/work/micro-short-film-website/ | 2026-10-14 | Pending verification |
| https://customtechbuilt4u.com/work/nyc-open-mic-master-list/ | 2026-10-14 | Pending verification |
| https://customtechbuilt4u.com/work/open-micer-timer/ | 2026-10-14 | Pending verification |
| https://customtechbuilt4u.com/work/pins-and-needles-comedy/ | 2026-10-14 | Pending verification |
| https://customtechbuilt4u.com/work/sobstage/ | 2026-10-14 | Pending verification |
| https://customtechbuilt4u.com/work/tlc-massage-wellness/ | 2026-10-14 | Pending verification |
| https://customtechbuilt4u.com/work/vlognudge/ | 2026-10-14 | Pending verification |
| https://customtechbuilt4u.com/guides/website-or-app/ | 2026-10-14 | Pending verification |
| https://customtechbuilt4u.com/about/ | 2026-10-14 | Pending verification |
| https://customtechbuilt4u.com/contact/ | 2026-10-14 | Pending verification |

The404 fallback is an additional non-indexable document and is intentionally outside this 25-URL register. Robots and sitemap are supporting discovery files. Keep these URL entries stable when comparing later measurements.

## Follow-up record

Before completion, verify the exact deployed revision, homepage/server HTML, all 25 primary-domain route statuses/canonicals, robots and sitemap, no-JavaScript access, desktop/phone behavior, and404 status/recovery behavior. Re-run the original query pool after publication and discovery time if the user requests a visibility measurement. Keep independent AI-answer testing separate from public search retrieval. No scheduled monitoring was configured.

Method attribution: GEO Content Engineering skill based on **Eugen Ullrich, [eullrich.com](https://eullrich.com/), CC BY 4.0**. Skill requirements were interpreted with current primary Google guidance; hypothetical citation gains and rank promises are not treated as evidence.

## Expanded publication input register

Prepared October 14, 2026. The final dated publication artifact records actual HTTP checks, sitemap submission, commit, and test results after release. All URLs use the primary domain; 404 remains excluded.

| URL | Content batch date |
| --- | --- |
| https://customtechbuilt4u.com/ | 2026-10-14 |
| https://customtechbuilt4u.com/services/ | 2026-10-14 |
| https://customtechbuilt4u.com/services/website-development/ | 2026-10-14 |
| https://customtechbuilt4u.com/services/web-app-development/ | 2026-10-14 |
| https://customtechbuilt4u.com/services/app-development/ | 2026-10-14 |
| https://customtechbuilt4u.com/services/custom-software-development/ | 2026-10-14 |
| https://customtechbuilt4u.com/work/ | 2026-10-14 |
| https://customtechbuilt4u.com/work/i-can-run-a-show/ | 2026-10-14 |
| https://customtechbuilt4u.com/work/bitbinder/ | 2026-10-14 |
| https://customtechbuilt4u.com/work/trip-handler/ | 2026-10-14 |
| https://customtechbuilt4u.com/work/role-call/ | 2026-10-14 |
| https://customtechbuilt4u.com/work/bill-spilt/ | 2026-10-14 |
| https://customtechbuilt4u.com/work/my-gig-calendar/ | 2026-10-14 |
| https://customtechbuilt4u.com/work/bleepkit/ | 2026-10-14 |
| https://customtechbuilt4u.com/work/dictype/ | 2026-10-14 |
| https://customtechbuilt4u.com/work/micro-short-film-website/ | 2026-10-14 |
| https://customtechbuilt4u.com/work/nyc-open-mic-master-list/ | 2026-10-14 |
| https://customtechbuilt4u.com/work/open-micer-timer/ | 2026-10-14 |
| https://customtechbuilt4u.com/work/pins-and-needles-comedy/ | 2026-10-14 |
| https://customtechbuilt4u.com/work/sobstage/ | 2026-10-14 |
| https://customtechbuilt4u.com/work/tlc-massage-wellness/ | 2026-10-14 |
| https://customtechbuilt4u.com/work/vlognudge/ | 2026-10-14 |
| https://customtechbuilt4u.com/guides/website-or-app/ | 2026-10-14 |
| https://customtechbuilt4u.com/insights/ | 2026-10-14 |
| https://customtechbuilt4u.com/insights/freelance-developer-vs-agency/ | 2026-10-14 |
| https://customtechbuilt4u.com/insights/diy-vs-custom-website/ | 2026-10-14 |
| https://customtechbuilt4u.com/insights/salon-booking-website/ | 2026-10-14 |
| https://customtechbuilt4u.com/insights/restaurant-ordering-app/ | 2026-10-14 |
| https://customtechbuilt4u.com/insights/spreadsheet-to-business-software/ | 2026-10-14 |
| https://customtechbuilt4u.com/insights/first-version-app-features/ | 2026-10-14 |
| https://customtechbuilt4u.com/new-york-city/ | 2026-10-14 |
| https://customtechbuilt4u.com/about/ | 2026-10-14 |
| https://customtechbuilt4u.com/contact/ | 2026-10-14 |
