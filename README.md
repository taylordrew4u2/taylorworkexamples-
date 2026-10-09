# 4u Digital — Developer Portfolio

Public portfolio brand: **4u Digital**, with a small **by taylordrew4u** owner credit. The user’s palette preference is permanent: use only black, white, and gray for site styling and custom illustrations; never add purple. The selected Open frame logo appears in the header and browser tab. Genuine app screenshot files preserve their original interfaces and colors. Project previews, galleries, and full-size images all retain their original full colors; the monochrome palette applies to page accents and branding only.

A portfolio for prospective website and app clients. A visual opening pairs the Mark Vegas website with the native My Gig Calendar app. Three expanded product stories lead with I Can Run A Show, The BitBinder, and The Trip Handler, followed by BillSpilt, RoleCall, and My Gig Calendar. The lead stories show real product screens, three concrete capabilities, and source-based case details. All 24 projects have visual covers in an expandable, searchable gallery. Project details include image galleries and links to the uncropped full-size assets. The offer is framed around business problems: a clear online presence, connected workflows, and native iPhone experiences. Contact is by email: **taylordrew4u@gmail.com**. Inquiry drafts ask for the problem, intended users, optional budget range, and timing; scope and pricing are discussed by email.

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
- **Previews:** edit `visuals.js` and place files in `assets/`. Visual metadata merges into the canonical project entries. Each cover has accurate dimensions, `imageKind`, a visible `imageLabel`, caption, and a gallery with evidence URLs. Preserve original aspect ratios and label development captures or source overviews accurately. `portrait: true` selects a phone frame. The detail view offers every gallery frame and its full-size original.
- **Writing and contact:** edit `index.html`; keep the exported `email` in `projects.js`, all email links, and structured metadata consistent.
- **Design:** edit `styles.css`. Reduced motion, keyboard focus, mobile navigation, and native dialogs are included.

The repository inventory is a deliberate snapshot, researched on October 6, 2026. It excludes the profile README and this portfolio repository. It does not fetch GitHub on every page load; update the data when publishing new work.

## Deployment

`.github/workflows/pages.yml` verifies the source and browser behavior, builds `dist/`, and deploys it to GitHub Pages when `main` changes. In the repository's **Settings → Pages**, choose **GitHub Actions** as the source. The workflow can also be run manually.

All site references are relative, so the same build works at the GitHub Pages repository path or another static host. To use Vercel or Netlify, use `npm run build` and publish `dist/`.

## Content and asset sources

Descriptions and stacks are based on [Taylor's GitHub profile](https://github.com/taylordrew4u2) and each linked repository's README or public description. Specific source links stay beside each project in `projects.js`. App Store links and live demos were checked during creation; unavailable demos were omitted.

All 24 projects now have visual evidence: 17 use genuine app, website, or development captures, and seven use explicitly labeled source-based workflow overviews. The image metadata and source links live in `visuals.js`; [the image evidence record](docs/image-evidence.md) lists each cover and its provenance. No app screenshot was generated with an image model or repainted. Development captures render original app views or components with sample records. Format conversion preserves the original proportions.

BitBinder now shows its current native library, writing editor, and set rehearsal with fictional sample material. The original SwiftUI screens ran in an isolated local model store; cloud sync and transcription were not exercised by the captures. Open Micer Timer has real native ready, running, and final-minute screens. My Gig Calendar and VlogNudge use published native captures with fictional examples. Showrunner uses higher-resolution running-app screens with sample show data. Trip Handler leads with populated meal voting, and BillSpilt adds settlement and expense-entry views.

RoleCall now uses its actual script and shot-list components rendered in an isolated development build with a fictional screenplay and its real parser. Controller shows its original desktop renderer with sample performers. TLC and the retro personal website use local development captures with sample/default content. Micro-short uses a current source render with the actual film imagery; film laurels are not software results. NYC Open Mic and SobStage use published running-app captures; SobStage's inputs are virtual microphones, with physical validation still pending. Mark Vegas retains its authentic public website capture from October 7, 2026; the artist owns the displayed artwork.

BleepKit, Laugh Map, StayBusy, Heal Your Heart, and Laugh Extractor have source-derived workflow overviews. My Story and Submissions use previously reviewed source summaries because their current repositories are unavailable; My Story is clearly in development. These diagrams depict workflows, not app screens. Desktop capture for Laugh Extractor was blocked by the Mac lock screen, so no runtime capture is claimed. Descriptions do not imply testimonials, paying-client relationships, revenue gains, or time savings.

The visual layout uses white backgrounds, black surfaces, gray accents, Manrope headings, DM Sans body text, and wide image-led product stories. Authentic website and iPhone previews introduce the work; each lead story has visible screen-choice buttons, an image caption, and three factual capability points. A compact supporting grid, text-led service rows, and black contact panel complete the page. Real screenshots retain their original proportions; preview frames are presentation only and open project details. Fonts use system fallbacks, and motion respects reduced-motion preferences. General, service-specific, and project-specific inquiry links prepare an email draft with a subject and a short project brief. They do not send email automatically. The plain email link and clipboard button remain available. No analytics or contact-form submission service is included.
