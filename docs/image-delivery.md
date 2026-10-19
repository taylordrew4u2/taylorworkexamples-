# Image delivery and consultation clarity

The production build uses the free local Sharp library. It creates lossless WebP display copies of selected project artwork at 480, 800, 1200, and 1600 pixels, plus the source width up to 2560 pixels. Native-size existing WebP images reuse their original encoded bytes. It never enlarges, crops, desaturates, or overwrites a source image. The largest display size remains available for sharp high-density screens. Original files and all full-size links stay intact.

Every generated HTML page gets responsive `srcset` and `sizes` attributes. Interactive galleries and dialogs use the same generated image manifest when a visitor changes screens. Lazy images can use their actual rendered width; other browsers use the explicit size fallback. Source previews still work with the originals; use `npm run build` and `npm run preview` to inspect optimized production delivery.

Encoded image bytes determine their filenames. The complete browser module graph, generated catalog and image map, and stylesheets share a content-based version directory. Vercel sends a one-year immutable browser cache only for these versioned paths. HTML and unversioned original files retain their normal revalidation behavior. GitHub Pages uses its own cache headers and the same versioned URLs. No image API, server function, paid optimizer, or paid analytics service is involved.

The ignored `.image-cache/` folder reuses local encodes. Its key includes the original image bytes, encoder versions, and encoding settings. Removing it only makes the next build regenerate the display copies.

Consultation links open exactly `https://briefbooth.com/book/4u-digital`. All booking, intake, scheduling, and confirmation stay on BriefBooth. The portfolio provides direct outbound links and basic Zoom/NYC service information, with no booking form or booking-steps walkthrough. General project email remains available. This does not submit a booking or alter the BriefBooth application.
