import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { email, projects, featuredProjects, filterProjects } from "../public-projects.js";
import { generateSEO } from "./seo.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "dist");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of [
  "index.html",
  "styles.css",
  "seo.css",
  "app.js",
  "consultation.js",
  "render-projects.js",
  ".nojekyll",
]) {
  await cp(path.join(root, name), path.join(output, name), { recursive: true });
}

// Publish only the Built4U catalog. The audited source inventory stays in the repo.
await writeFile(path.join(output, "public-projects.js"),
  `export const email = ${JSON.stringify(email)};\nexport const projects = ${JSON.stringify(projects)};\nexport const featuredProjects = ${JSON.stringify(featuredProjects.map((project) => project.id))}.map((id) => projects.find((project) => project.id === id));\nexport ${filterProjects.toString()}\n`,
);
const pages = await generateSEO(output);

// Package only the current portfolio's images and branding assets.
const assets = new Set(projects.flatMap((project) => [
  project.image,
  project.icon,
  ...project.gallery.flatMap((frame) => [frame.image, frame.companion?.image]),
]).filter(Boolean));
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
console.log(`Built4U built in dist/: ${pages.length} indexable pages, ${projects.length} public projects.`);
