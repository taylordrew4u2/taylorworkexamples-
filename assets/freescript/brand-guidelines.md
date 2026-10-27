# FreeScript brand guidelines

Version 1.0 · October 27, 2026

## The idea

**Your story. Your page.**

FreeScript is a quiet writing room for screenwriters. It combines the familiar rhythm of a typewriter with practical Mac software: paste a draft, import a text-based PDF, keep writing, and export a formatted screenplay. The desktop app works offline. A separate hosted companion brings screenplay formatting, revision, analysis, and export to ChatGPT and Claude.

The promise is control over your writing, without a subscription to the desktop editor. The audience is independent screenwriters, filmmakers, students, and anyone moving an existing screenplay into an editable writing space.

## Positioning and messaging

- Category: free Mac screenwriting software, with an optional AI-chat companion.
- Main line: **Your story. Your page.**
- Supporting line: **Free. Offline. Yours.** This line describes the desktop app, not the hosted companion.
- Functional line: **Paste a script. Keep writing.**
- Product description: FreeScript is a free, offline screenwriting app for Mac, with automatic screenplay formatting, editable PDF import, local autosave, and Fountain/PDF export.
- Short description: A quiet place to write your next scene.
- Primary action: **Download for Mac**.
- Secondary action: **Connect ChatGPT or Claude**.
- Portfolio credit: **A selected personal project in the 4u Digital portfolio.** Keep the public business name exactly “4u Digital.”

## Identity

The mark reduces a manual typewriter to paper, carriage, body, and keys. It extends the existing application icon, keeping the installed product and promotional identity recognizable. Use `logos/freescript-mark.svg` for scalable layouts and the original `logos/freescript-app-icon.png` for product identification. The SVG mark is a faithful vector interpretation; the PNG is the actual app icon.

`freescript-wordmark.svg` is the primary horizontal lockup. `freescript-wordmark-reverse.svg` is for dark backgrounds. Matching transparent PNG exports are included. SVG wordmarks use live Courier text: retain the specified font or outline the text in a vector editor for an external print workflow.

- Minimum icon size: 24 px; use 48 px or larger where possible.
- Minimum wordmark width: 180 px.
- Clear space: at least one paper-sheet width around the mark, approximately one third of its height.
- Never stretch, tilt, add a drop shadow to, recolor with bright accents, redraw the keys, or place the mark on a busy image.
- Keep the actual app icon’s original transparent outer padding and proportions.

## Palette

| Role | Name | Hex | Use |
| --- | --- | --- | --- |
| Primary | Typewriter ink | `#342F29` | Headlines, body text, buttons, dark fields |
| Primary | Manuscript paper | `#F7F2E8` | Page and campaign backgrounds |
| Surface | Fresh sheet | `#FFFDF6` | Writing surface and light panels |
| Secondary | Ribbon | `#766852` | Secondary labels and restrained detail |
| Structure | Paper edge | `#CFC4B2` | Dividers and borders |

Use dark ink for readable copy. Secondary colors are for large labels, rules, and nonessential details, not small low-contrast body text. Never use green, neon, saturated startup gradients, or a rainbow of accents. FreeScript project artwork retains this palette when displayed inside the otherwise monochrome 4u Digital website.

## Typography

- Brand, UI, labels, and screenplay: **Courier New**, with Courier and monospace fallbacks.
- Editorial emphasis: **Georgia italic**, used for a short phrase rather than full paragraphs.
- Logo weight: bold Courier; headline weight: regular Courier.
- Labels: uppercase, generous tracking. Body: sentence case, plain language, comfortable line height.
- No font download is needed for the system-font templates. A substituted system font may slightly change wordmark metrics on another platform.

## Layout and imagery

Use an eight-pixel spacing rhythm, wide margins, thin rules, and a visible hierarchy. Let a single headline and one meaningful image carry each composition. Keep screenshots upright, at their native proportions, and legible. Label real app captures, promotional compositions, and AI-generated imagery accurately.

Campaign photography evokes paper, ink, the carriage of a typewriter, and morning light. `promotional/typewriter-campaign.png` is an AI-generated editorial photograph, not a software screenshot or a photograph of a physical FreeScript product. Its generation prompt and provenance are in `ASSET-MANIFEST.md`.

Screenshots use fictional writing. Never publish a user's private draft, library, filename, or account screen as promotional evidence.

## Voice

Write like a helpful editor: direct, calm, specific, and writer-first. “Paste a script. Keep writing.” is better than an abstract promise about productivity. Give the next action without talking down to the reader. Use “your draft” and “your next scene.” Avoid hype, guaranteed results, invented popularity, awards, testimonials, or suggestions that AI independently creates a screenplay inside the desktop app.

## Accurate feature claims

The desktop application is free and works offline without an account. It runs on macOS 13+ in a universal Apple Silicon/Intel bundle. Runtime testing was on Apple Silicon; physical Intel hardware was not tested. The installer is Developer ID signed, currently not notarized.

PDF import extracts selectable text; scanned documents need OCR elsewhere first. Imports are limited to 10 MB. Formatting is inferred and should be reviewed. Advanced Fountain features are not fully supported. Page counts in the editor are estimates. Exported PDF determines final pagination.

The hosted ChatGPT/Claude companion is online, stateless, and separate from the Mac app's autosave library. It receives screenplay text shared through chat. The host may sleep when idle. Chat-provider subscriptions, access requirements, and free-host limits may apply; do not promise the chat providers themselves are free. There is no automatic desktop/chat synchronization. The optional local Claude extension exposes a separately selected Fountain folder.

## Delivered formats

- Master SVG and transparent PNG logo family; original app icon.
- Wide product banner: 1920 × 1080.
- README hero: 1600 × 740.
- Square social post: 1080 × 1080.
- Vertical social story: 1080 × 1920.
- Editorial campaign poster: 1600 × 1000.
- Nine-panel brand overview: 1600 × 1200.
- Landscape workflow video and vertical promotional video, with burned-in captions and companion WebVTT transcripts. Silent by design; no unlicensed music or voice recordings.
- Reusable HTML layouts, design tokens, launch copy, and capture/render scripts.

## Use and export

Run the capture and render scripts from the repository root after installing development dependencies. HTML templates reference their neighboring screenshots and campaign image; keep the folder structure when moving the kit. Marketing artwork is distinct from genuine app captures. The brand kit does not change the installed app's code or icon.
