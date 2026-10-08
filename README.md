# Taylor Drew — Developer Portfolio

A portfolio for prospective website and app clients. A visual opening pairs the Mark Vegas website with the native My Gig Calendar app. Three expanded product stories lead with I Can Run A Show, The BitBinder, and The Trip Handler, followed by BillSpilt, RoleCall, and My Gig Calendar. The lead stories show real product screens, three concrete capabilities, and source-based case details. All 24 projects remain available in an expandable, searchable archive. The offer is framed around business problems: a clear online presence, connected workflows, and native iPhone experiences. Contact is by email: **taylordrew4u@gmail.com**. Inquiry drafts ask for the problem, intended users, optional budget range, and timing; scope and pricing are discussed by email.

## Run locally

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. The site uses standard HTML, CSS, and browser JavaScript. There are no production dependencies, accounts, API keys, or database requirements.

## Verify and build

```sh
npm run check
npx playwright install chromium
npm run test:browser
npm run preview
```

`check` validates JavaScript syntax, project data, search/filter behavior, and builds the distributable site in `dist/`. Browser tests cover desktop and phone interactions. `preview` serves the built site.

## Update the portfolio

- **Projects:** edit `projects.js`. Each entry contains a summary, technology stack, engineering features, source repository, optional working demo, and content sources. Featured examples also have `clientSummary`, `projectType`, `demonstrates`, `challenge`, and `build` fields. The first three selected products also have `highlights` with evidence URLs and `gallery` frames with captions, dimensions, and screenshot provenance. Select leads for the strength of their implementation; there is no platform quota.
- **Previews:** place images in `assets/` and use a relative `./assets/…` path. Preserve the image's aspect ratio and provide an accurate `imageAlt`. Set `portrait: true` for phone screens. Label concept images as UI previews.
- **Writing and contact:** edit `index.html`; keep the exported `email` in `projects.js`, all email links, and structured metadata consistent.
- **Design:** edit `styles.css`. Reduced motion, keyboard focus, mobile navigation, and native dialogs are included.

The repository inventory is a deliberate snapshot, researched on October 6, 2026. It excludes the profile README and this portfolio repository. It does not fetch GitHub on every page load; update the data when publishing new work.

## Deployment

`.github/workflows/pages.yml` verifies the source and browser behavior, builds `dist/`, and deploys it to GitHub Pages when `main` changes. In the repository's **Settings → Pages**, choose **GitHub Actions** as the source. The workflow can also be run manually.

All site references are relative, so the same build works at the GitHub Pages repository path or another static host. To use Vercel or Netlify, use `npm run build` and publish `dist/`.

## Content and asset sources

Descriptions and stacks are based on [Taylor's GitHub profile](https://github.com/taylordrew4u2) and each linked repository's README or public description. Specific source links stay beside each project in `projects.js`. App Store links and live demos were checked during creation; unavailable demos were omitted.

The lead screenshots come from their repositories' real running-app captures. I Can Run A Show uses production-build screenshots and a still from its demonstration recording. The Trip Handler uses captures of a seeded demo trip; no purchase was made. The BitBinder uses earlier App Store home/settings screens, clearly labeled; its adjacent import diagram is a source-based explanation, not an app screenshot. My Gig Calendar uses its populated native iPhone calendar, rather than its separate public fan website. BillSpilt uses its real household balance screen. RoleCall's SVG remains explicitly labeled **UI PREVIEW**. Each gallery image records its source URL in `projects.js`.

The Mark Vegas preview was captured from its live public website on October 7, 2026. The Pins & Needles preview comes from its repository's real homepage screenshot. Featured demonstrations were verified on that date. Featured engineering claims were checked against public source on October 7, 2026. Project descriptions explain implemented features; they do not claim paying-client relationships, testimonials, revenue gains, or time savings.

The visual layout uses a cool white background, cobalt accents, Manrope headings, DM Sans body text, and wide image-led product stories. Authentic website and iPhone previews introduce the work; each lead story has visible screen-choice buttons, an image caption, and three factual capability points. A compact supporting grid, text-led service rows, and cobalt contact panel complete the page. Real screenshots retain their original proportions; preview frames are presentation only and open project details. Fonts use system fallbacks, and motion respects reduced-motion preferences. General, service-specific, and project-specific inquiry links prepare an email draft with a subject and a short project brief. They do not send email automatically. The plain email link and clipboard button remain available. No analytics or contact-form submission service is included.
