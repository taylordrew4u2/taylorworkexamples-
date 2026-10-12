# Built4U — Developer Portfolio

Public portfolio brand: **Built4U**, with the tagline **Custom tech. Built for you.**, descriptor **Apps, websites, and software for your business.**, and a small **by taylordrew4u** owner credit. The homepage opens with **You know your business. I’ll build the technology.** and explains that clients can start without a technical background or finished plan. The user’s palette preference is permanent: use only black, white, and gray for site styling and custom illustrations; never add purple. The selected Open frame logo appears in the header and browser tab; its historical asset filenames remain unchanged. Genuine project icons and app screenshot files preserve their original artwork, interfaces, colors, and proportions. Project previews, galleries, and full-size images all retain their original full colors; the monochrome palette applies to page accents and branding only.

A portfolio for prospective website and app clients. A visual opening pairs the Pins & Needles Comedy website with the native My Gig Calendar app. Three expanded product stories lead with I Can Run A Show, The BitBinder, and The Trip Handler, followed by BillSpilt, RoleCall, and My Gig Calendar. The lead stories show real product screens, three concrete capabilities, and source-based case details. All 16 current public GitHub projects have visual covers in an expandable, searchable gallery. Project details include image galleries and links to the uncropped full-size assets. The offer is framed around business problems: a clear online presence, connected workflows, and native iPhone experiences. Contact is by email: **taylordrew4u@gmail.com**. Inquiry drafts ask for the problem, intended users, optional budget range, and timing; scope and pricing are discussed by email.

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

`check` validates JavaScript syntax, project data, search/filter behavior, and builds the distributable site in `dist/`. Browser tests build the site and check desktop and phone interactions against the production build on an isolated preview port. `preview` serves the built site.

## Update the portfolio

- **Projects:** edit `projects.js`. Each entry contains a summary, technology stack, engineering features, source repository, optional working demo, and content sources. Featured examples also have `clientSummary`, `projectType`, `demonstrates`, `challenge`, and `build` fields. The first three selected products also have `highlights` with evidence URLs and `gallery` frames with captions, dimensions, and screenshot provenance. Select leads for the strength of their implementation; there is no platform quota.
- **Public source status:** update `repository-state.js` with the reviewed public inventory, default-branch HEADs, README availability, archived flags, and verification date. Keep `projects.js` and `visuals.js` aligned with those public project keys; projects no longer publicly available are excluded from the displayed portfolio. Public archived repositories remain eligible work examples. Record source and live-link changes in [the GitHub refresh record](docs/github-refresh.md).
- **Previews:** edit `visuals.js` and place files in `assets/`. Visual metadata merges into the canonical project entries. Each cover has accurate dimensions, `imageKind`, a visible `imageLabel`, caption, and a gallery with evidence URLs. Preserve original aspect ratios and label development captures or source overviews accurately. `portrait: true` selects a phone frame. The detail view offers every gallery frame and its full-size original.
- **Project identities:** edit `identities.js` for each project's plain-language purpose, three workflows, preview context, and authentic icon metadata. Icons appear beside selected-work, archive, and dialog names. Archive cards include clear descriptions, workflow labels, and direct live-site or App Store links where available. Preserve icon source URLs, intrinsic dimensions, colors, and proportions; see [the icon evidence record](docs/project-icons.md).
- **Writing and contact:** edit `index.html`; keep the exported `email` in `projects.js`, all email links, and structured metadata consistent.
- **Design:** edit `styles.css`. Reduced motion, keyboard focus, mobile navigation, and native dialogs are included.

The repository inventory is a deliberate snapshot, reverified on **October 12, 2026**. The displayed portfolio now contains **16 current public project repositories**. Projects no longer publicly available were removed at the user's request. The profile README and this portfolio repository are excluded. TLC Massage Wellness remains included because its archived repository is still public. The personal site's canonical repository is `taylordrewwebsite`, with its live site at [taylordrew4u.com](https://www.taylordrew4u.com/). The site uses packaged local data and does not fetch GitHub repository state at runtime. See [the public inventory and pinned HEAD table](docs/github-refresh.md); update the snapshot when publishing new work.

## Deployment

The primary public address is [customtechbuilt4u.com](https://customtechbuilt4u.com/), with `www.customtechbuilt4u.com` redirecting to the apex address. Canonical, social, and organization metadata use this domain. The hosting project's internal name and historical logo filenames do not change with the public Built4U brand.

`.github/workflows/pages.yml` verifies the source and browser behavior, builds `dist/`, and deploys it to GitHub Pages when `main` changes. In the repository's **Settings → Pages**, choose **GitHub Actions** as the source. The workflow can also be run manually.

All site references are relative, so the same build works at the GitHub Pages repository path or another static host. The build packages only assets referenced by the current catalog or page; images belonging solely to removed projects are excluded from `dist/`. `vercel.json` configures an additional static Vercel mirror with no framework preset, `npm ci`, `npm run build`, and `dist/` output. The Vercel mirror uses the `taylordrew4u2s-projects` team. Its verified production URL is reported with the release. For Netlify, use `npm run build` and publish `dist/`.

## Content and asset sources

Descriptions and stacks are based on [Taylor's GitHub profile](https://github.com/taylordrew4u2) and reviewed public repository source, READMEs, or descriptions. Evidence references stay beside each project in `projects.js` and `visuals.js`; `repository-state.js` controls current public source and documentation links. The October 12 public-inventory verification and clearly dated October 9 research are documented in [the GitHub refresh record](docs/github-refresh.md). Inventory verification does not imply that every feature was re-reviewed or every image recaptured at the latest HEAD. App Store links and live demos were checked during creation; known unavailable demos remain omitted.

All 16 displayed projects have visual evidence: 15 use genuine app, website, or development captures, and BleepKit uses an explicitly labeled source-based workflow overview. The image metadata and source links live in `visuals.js`; [the image evidence record](docs/image-evidence.md) lists each cover and its provenance. No app screenshot was generated with an image model or repainted. Development captures render original app views or components with sample records. Format conversion preserves the original proportions.

Fifteen projects also use authentic logos, native app icons, or favicons from public source or the canonical website. `identities.js` records their paths, dimensions, provenance, and context. Native raster icons were reduced proportionally; original artwork and colors are retained without recoloring. Micro-short has no verified logo/favicon and uses neutral **MS** initials, which are not presented as an official film logo. The [project icon record](docs/project-icons.md) documents all 15 assets and the fallback separately from screenshot evidence.

BitBinder retains native library, writing-editor, and set-rehearsal captures made on October 8, 2026 at revision `4328005`, with fictional sample material. The original SwiftUI screens ran in an isolated local model store; cloud sync and transcription were not exercised by those captures. Public source reviewed on October 9 was `48e78c25d1d46bd8443cc19c7df37754d0570a8d`. Open Micer Timer has real native ready, running, and final-minute screens. My Gig Calendar and VlogNudge use published native captures with fictional examples. Showrunner uses higher-resolution running-app screens with sample show data. Trip Handler's repository gallery added during the October 9 refresh shows meal voting, approvals, the shared board, itinerary, and paired mobile dashboard/sleeping views with seeded demo data. BillSpilt adds settlement and expense-entry views.

RoleCall uses its actual script and shot-list components rendered in an isolated development build with a fictional screenplay and its real parser. Archived TLC and the retro personal website use local development captures with sample/default content; the personal capture is tied to `9938dd84487780d2df51a1a33960de0e7b2b76a1` under the canonical repository name `taylordrewwebsite`. Pins & Needles shows its published audience phone screen alongside the website and Control Center, and its website image appears in the opening. Micro-short uses a source render with the actual film imagery; film laurels are not software results. NYC Open Mic uses published running-app captures. SobStage's gallery includes recording, take alerts, a saved take, and recovery, with evidence pinned to `5c64a7da3ef2a47603c17564e66f4610da8f3154`; the UI captures depict an earlier application version with virtual microphones. The October 12 public HEAD is `d436566608aef36974e99f98657910b2700c6400`. Physical-microphone validation was still pending in the October 9 source review; these images do not represent a new hardware validation.

BleepKit's source-derived overview depicts its implemented workflow, not an app screen. Descriptions do not imply testimonials, paying-client relationships, revenue gains, or time savings.

The visual layout uses white backgrounds, black surfaces, gray accents, Manrope headings, DM Sans body text, and wide image-led product stories. Authentic website and iPhone previews introduce the work; each lead story has visible screen-choice buttons, an image caption, and three factual capability points. A compact supporting grid, text-led service rows, and black contact panel complete the page. Real screenshots retain their original proportions; preview frames are presentation only and open project details. Fonts use system fallbacks, and motion respects reduced-motion preferences. General, service-specific, and project-specific inquiry links prepare an email draft with a subject and a short project brief. They do not send email automatically. The plain email link and clipboard button remain available. No analytics or contact-form submission service is included.
