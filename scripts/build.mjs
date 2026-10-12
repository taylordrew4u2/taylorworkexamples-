import { cp, mkdir, readFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { projects } from "../projects.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "dist");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of [
  "index.html",
  "styles.css",
  "app.js",
  "projects.js",
  "visuals.js",
  "identities.js",
  "repository-state.js",
  ".nojekyll",
]) {
  await cp(path.join(root, name), path.join(output, name), { recursive: true });
}

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
console.log("Portfolio built in dist/");
