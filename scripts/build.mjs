import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { email, projects, featuredProjects, filterProjects } from "../public-projects.js";
import { generateSEO } from "./seo.mjs";
import { contactPages } from "../contact-pages.js";
import { optimizeImages } from "./optimize-images.mjs";
import { responsiveHTML, fingerprintAssets } from "./cache-assets.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "dist");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of [
  "index.html",
  "styles.css",
  "seo.css",
  "app.js",
  "navigation.js",
  "homepage-explore.js",
  "projects-page.js",
  "booking.js",
  "kickoff-form.js",
  "project-brief.js",
  "project-brief-schema.js",
  "project-brief-palettes.js",
  "project-brief-designs.js",
  "project-brief-config.js",
  "project-brief.css",
  "analytics.js",
  "contact-context.js",
  "render-projects.js",
  "range-proof.js",
  "responsive-images.js",
  "image-variants.js",
  ".nojekyll",
]) {
  await cp(path.join(root, name), path.join(output, name), { recursive: true });
}

// Publish only the 4u Digital catalog. The audited source inventory stays in the repo.
await writeFile(path.join(output, "public-projects.js"),
  `export const email = ${JSON.stringify(email)};\nexport const projects = ${JSON.stringify(projects)};\nexport const featuredProjects = ${JSON.stringify(featuredProjects.map((project) => project.id))}.map((id) => projects.find((project) => project.id === id));\nexport ${filterProjects.toString()}\n`,
);
const pages = await generateSEO(output);
await writeFile(path.join(output, "contact-pages.js"), `export const contactPages = ${JSON.stringify(contactPages)};\n`);

// Package only the current portfolio's images and branding assets.
const assets = new Set(projects.flatMap((project) => [
  project.image,
  project.icon,
  ...(project.promotion?.videos || []).flatMap(video => [video.src, video.poster, video.captions]),
  ...(project.promotion?.downloads || []).map(file => file.src),
  ...project.gallery.flatMap((frame) => [frame.image, frame.companion?.image]),
]).filter(Boolean));
const fontManifest = JSON.parse(await readFile(path.join(root, "assets/fonts/manifest.json"), "utf8"));
for (const filename of [...fontManifest.files.map((font) => font.file), ...fontManifest.licenses]) {
  assets.add(`./assets/fonts/${filename}`);
}
const html = await readFile(path.join(root, "index.html"), "utf8");
for (const match of html.matchAll(/(?:src|href)="(\.\/assets\/[^"?]+)(?:\?[^\"]*)?"/g)) {
  assets.add(match[1]);
}
await mkdir(path.join(output, "assets"));
for (const asset of assets) {
  const destination = path.join(output, asset);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(path.join(root, asset), destination);
}
const imageVariants = await optimizeImages({ root, output, assets });
await writeFile(path.join(output, "image-variants.js"), `export const imageVariants = ${JSON.stringify(imageVariants)};\n`);
const routes = [...pages.map((page) => page.path), "/404.html"];
for (const route of routes) {
  const file = path.join(output, route.replace(/^\//, ""), route.endsWith("/") ? "index.html" : "");
  await writeFile(file, responsiveHTML(await readFile(file, "utf8"), route, imageVariants));
}
const version = await fingerprintAssets({ output, routes, names: [
  "styles.css", "seo.css", "app.js", "navigation.js", "homepage-explore.js", "projects-page.js", "booking.js", "kickoff-form.js", "project-brief.js", "project-brief-schema.js", "project-brief-palettes.js", "project-brief-designs.js", "project-brief-config.js", "project-brief.css", "analytics.js",
  "contact-context.js", "contact-pages.js", "render-projects.js", "range-proof.js",
  "public-projects.js", "responsive-images.js", "image-variants.js",
] });
console.log(`4u Digital built in dist/: ${pages.length} indexable pages, ${projects.length} public projects, ${Object.keys(imageVariants).length} responsive images. Static version: ${version}.`);
