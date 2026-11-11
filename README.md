# 4u Digital — Developer Portfolio

[4u Digital](https://customtechbuilt4u.com/) builds websites for businesses and people, plus web apps, native Apple apps, and custom software. The homepage links directly to examples. The Projects page has 13 selected personal projects, with separate case studies and original full-color galleries.

## Run and verify locally

Requires Node.js 20 or newer. Use the built preview for generated routes such as Services, Projects, and the planner.

```sh
npm ci
npm run check
npm run preview
```

`check` validates the source, content, links, and assets and builds `dist/`. Open `http://127.0.0.1:5173` to preview the build. To run the desktop and mobile browser suite, install Chromium with `npx playwright install chromium`, then run `npm run test:browser`.

## Update the portfolio

- Edit `index.html` for the homepage and `scripts/seo.mjs` for its search metadata and generated pages. Service and guide content lives in `seo-content.js`, `seo-articles.js`, and `seo-local.js`.
- Edit `portfolio-selection.js` for the public selection. Project descriptions, visual evidence, and icons live in `projects.js`, `visuals.js`, and `identities.js`. Keep the original project art in full color and the site itself monochrome.
- Consultation buttons open [BriefBooth](https://briefbooth.com/book/4u-digital) in a new tab. The portfolio does not handle appointments. General inquiries draft an email to `admin@customtechbuilt4u.com`.
- The optional Project planner is separate from scheduling. If online delivery is unavailable, clients can open a populated email draft and download their full brief. The later kickoff form also uses email and download, without submitting to a server.

## Deployment

The primary domain runs on the existing Cloudflare Pages project `4u-digital`. The GitHub Pages workflow in `.github/workflows/pages.yml` also verifies and builds the repository. Publish `dist/` for a static release. Keep the generated HTML, versioned scripts and styles, responsive images, and 404 page together.

The free planner Worker is configured separately in `cloudflare/project-brief/wrangler.toml`. It handles `/api/project-brief` on the primary domain and sends submissions to the verified business address through Cloudflare Email Routing. The sender uses `planner-mail.customtechbuilt4u.com`, which has its own mail records. Keep the main domain's ImprovMX forwarding in place.

## Content and asset sources

Descriptions and stacks are based on [the public GitHub profile](https://github.com/taylordrew4u2) and reviewed public repository source, READMEs, or descriptions. Evidence references stay beside each project in `projects.js` and `visuals.js`; `repository-state.js` controls current public source and documentation links. The October 12 public-inventory verification and clearly dated October 9 research are documented in [the GitHub refresh record](docs/github-refresh.md). Inventory verification does not imply that every feature was re-reviewed or every image recaptured at the latest HEAD. App Store links and live demos were checked during creation; known unavailable demos remain omitted.

The selected projects include original product artwork, interface captures, and genuine icons where available. Three owner-supplied banners introduce The BitBinder, My Gig Calendar, and Open Micer Timer; BillSpilt and I Can Run A Show use artwork from their pinned repositories. Pins & Needles, The Trip Handler, and SobStage lead with their original README product overviews. Original app and development captures remain available in the galleries, with source links and context. Artwork is not a new runtime validation. No app screenshot was generated with an image model or repainted.

`identities.js` records authentic icon paths, dimensions, provenance, and context. Original artwork and colors remain unchanged. The [project icon record](docs/project-icons.md) also retains the historical internal inventory.
BitBinder retains native library, writing-editor, and set-rehearsal captures made on October 8, 2026 at revision `4328005`, with fictional sample material. The original SwiftUI screens ran in an isolated local model store; cloud sync and transcription were not exercised by those captures. Public source reviewed on October 9 was `48e78c25d1d46bd8443cc19c7df37754d0570a8d`. Open Micer Timer retains its real native ready, running, and final-minute simulator captures at revision `4f0271b019682f54a00fcaa561b6e2b99a590590`; its seven supplied promotional images are labeled product artwork and do not establish a fresh native capture or new runtime validation. My Gig Calendar uses published native captures with fictional examples. Showrunner's eight repository app-capture files show the original production-build interfaces against a mock API with sample show data. Trip Handler's repository gallery added during the October 9 refresh shows meal voting, approvals, the shared board, itinerary, and paired mobile dashboard/sleeping views with seeded demo data. BillSpilt's five repository app captures show balances, settlement, expense entry, expense history, and spending statistics with sample household data.

Pins & Needles shows its published audience phone screen alongside the website and Control Center. SobStage's gallery includes recording, take alerts, a saved take, and recovery, with older UI captures using virtual microphones. Its current repository describes a **v1.13.29 release candidate**; physical-microphone validation remains pending. The desktop project is explicitly presented as engineering work with that status. Descriptions do not imply testimonials, paying-client relationships, revenue gains, or measured time savings.


## Client acquisition and free source attribution

The current public brand is **4u Digital**, with **Custom tech build for you.** as the tagline. Homepage links lead to dedicated salon booking and restaurant ordering services. Consultation buttons say **Book a consultation** and open https://briefbooth.com/book/4u-digital. General inquiry drafts include their originating public page. Paid visitor analytics remains disabled at the owner’s request. See [the implementation record](docs/client-acquisition.md).


The [project kickoff checklist](https://customtechbuilt4u.com/project-kickoff/) is used after consultation. Clients can complete an on-page form for scope, acceptance examples, approving contacts, assets, accounts, and handover, review the result, and open an email draft, copy it, or download a text file. The form does not submit or persist their answers; the client sends the final email. Long briefs use copy/download rather than an oversized email link. With JavaScript unavailable, the existing checklist and prefilled email template remain usable. The initial consultation is booked through BriefBooth. Make a separate copy of the [internal kickoff template](docs/client-kickoff-template.md) and [asset/access register](docs/client-asset-register.md) for each agreed project; client-specific decisions remain unconfirmed until recorded with the client.

## README product overview refresh

Six original 2400 × 1500 overview PNGs were reviewed and retained in the internal evidence inventory. The current public selection uses the SobStage, Pins & Needles, and The Trip Handler overviews as their main covers and first gallery frames. The opening also uses Pins & Needles and SobStage. BleepKit, DicType, and RoleCall artwork and prior captures remain internal and are excluded from the published site. Earlier gallery frames for the retained projects remain available with their own capture labels, captions, and sources. Complete product artwork keeps its native ratio and original colors without page text over it. The pinned sources, byte counts, Git blob hashes, and SHA-256 checksums are recorded in [the overview manifest](docs/readme-overviews.json); [the refresh record](docs/readme-overviews.md) explains the capture context.

## Historical site polish — October 19, 2026

The homepage leads its work section with the six product stories, followed by grouped platform evidence and the eight-project collection. Shared typography, spacing, controls, disclosures, and inquiry surfaces are refined across all 30 pages. Homepage navigation switches to its menu at 900px and remains available at desktop scroll positions. Each quick project preview links directly to its full story. Inner pages include active navigation, service section links, article contents, grouped footer navigation, and improved project, contact, and kickoff layouts. All original project artwork, evidence disclosures, booking destinations, email attribution, and the eight-project publishing boundary remain intact.

## FreeScript brand & portfolio addition — October 27, 2026

The owner explicitly added FreeScript as a selected personal project at `/work/freescript/`. Its complete case preserves the site’s monochrome layout while displaying original paper-and-ink product artwork: 12 gallery images, six genuine Mac captures with fictional writing, two playable silent/captioned videos, and a complete brand/promotion ZIP. The standalone Mac app remains distinct from its stateless ChatGPT/Claude companion. Captions disclose the AI-generated editorial photograph, and release notes retain signed/not-notarized and text-based-PDF/OCR limits. Brand asset sources are pinned to the public FreeScript repository; see `docs/freescript-brand-assets.md`.

FreeScript’s primary purpose is easy screenplay writing with formatting while you write. The case, brand copy, social graphics and videos lead with this writing workflow and explain Enter/Tab controls; paste and PDF import support existing drafts.
