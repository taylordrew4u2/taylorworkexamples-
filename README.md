# Taylor Drew — Developer Portfolio

A responsive portfolio for Taylor Drew's full stack, native iOS, desktop, and audio work. Six featured products lead into a searchable archive of 24 public project repositories. Contact is by email: **taylordrew4u@gmail.com**.

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

- **Projects:** edit `projects.js`. Each entry contains a summary, technology stack, engineering features, source repository, optional working demo, and content sources. `featuredProjects` controls the six cards on the home page.
- **Previews:** place images in `assets/` and use a relative `./assets/…` path. Preserve the image's aspect ratio and provide an accurate `imageAlt`. Set `portrait: true` for phone screens. Label concept images as UI previews.
- **Writing and contact:** edit `index.html`; keep the exported `email` in `projects.js`, all email links, and structured metadata consistent.
- **Design:** edit `styles.css`. Reduced motion, keyboard focus, mobile navigation, and native dialogs are included.

The repository inventory is a deliberate snapshot, researched on October 6, 2026. It excludes the profile README and this portfolio repository. It does not fetch GitHub on every page load; update the data when publishing new work.

## Deployment

`.github/workflows/pages.yml` verifies the source and browser behavior, builds `dist/`, and deploys it to GitHub Pages when `main` changes. In the repository's **Settings → Pages**, choose **GitHub Actions** as the source. The workflow can also be run manually.

All site references are relative, so the same build works at the GitHub Pages repository path or another static host. To use Vercel or Netlify, use `npm run build` and publish `dist/`.

## Content and asset sources

Descriptions and stacks are based on [Taylor's GitHub profile](https://github.com/taylordrew4u2) and each linked repository's README or public description. Specific source links stay beside each project in `projects.js`. App Store links and live demos were checked during creation; unavailable demos were omitted.

Project screenshots were extracted from [the profile's demonstration GIFs](https://github.com/taylordrew4u2/taylordrew4u2/tree/main/assets), preserving their aspect ratios. The Trip Handler screenshot comes from its [project documentation](https://github.com/taylordrew4u2/the-trip-handler/tree/main/docs/screenshots). RoleCall's SVG is a [repository UI preview](https://github.com/taylordrew4u2/Role-Call/tree/main/docs/screenshots) and is labeled accordingly. The BitBinder images originate from its App Store screenshot walkthrough; My Gig Calendar shows its public fan calendar. The illustrated avatar is from the public GitHub profile.

The visual layout is custom. Fonts are DM Sans and DM Mono via Google Fonts, with local system fallbacks. Email links open the visitor's mail app; the copy button uses the browser clipboard with a selection fallback. No analytics or contact-form submission service is included.
