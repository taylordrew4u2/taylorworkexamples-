import test from "node:test";
import assert from "node:assert/strict";
import { responsiveHTML } from "../scripts/cache-assets.mjs";
import { gallerySizes } from "../responsive-images.js";

const manifest = {
  "./assets/project.png": [
    { src: "./assets/optimized/project-400.webp", width: 400 },
    { src: "./assets/optimized/project-800.webp", width: 800 },
  ],
};

test("minimal homepage previews advertise their stacked-phone and three-column desktop width", () => {
  const original = '<img class="simple-project-image" src="./assets/project.png" width="1600" height="1000" loading="lazy" />';
  const result = responsiveHTML(original, "/", manifest);
  assert.match(result, /sizes="\(max-width: 700px\) calc\(100vw - 2\.5rem\), \(max-width: 1232px\) calc\(33\.333vw - 2\.667rem\), 368px"/);
  assert.match(result, /src="\.\/assets\/project\.png" width="1600" height="1000" loading="lazy"/,
    "Responsive delivery keeps the original artwork source and proportions intact");
  assert.match(result, /srcset="\.\/assets\/optimized\/project-400\.webp 400w, \.\/assets\/optimized\/project-800\.webp 800w"/);
});

test("full project galleries retain automatic sizing and page-relative optimized image paths", () => {
  const result = responsiveHTML('<img src="../../assets/project.png" loading="lazy" />', "/work/example/", manifest);
  assert.ok(result.includes(`sizes="${gallerySizes}"`));
  assert.match(result, /srcset="\.\.\/\.\.\/assets\/optimized\/project-400\.webp 400w, \.\.\/\.\.\/assets\/optimized\/project-800\.webp 800w"/);
});

test("service examples deliver sharp stacked-phone and two-column artwork without replacing originals", () => {
  const result = responsiveHTML('<img class="service-example-artwork" src="../../assets/project.png" width="1600" height="1000" loading="lazy" />', "/services/website-development/", manifest);
  assert.match(result, /sizes="\(max-width: 600px\) calc\(100vw - 58px\), \(max-width: 700px\) calc\(100vw - 66px\)/);
  assert.match(result, /\(max-width: 1408px\) calc\(50vw - 90px\), 614px"/);
  assert.match(result, /src="\.\.\/\.\.\/assets\/project\.png" width="1600" height="1000"/);
  assert.match(result, /srcset="\.\.\/\.\.\/assets\/optimized\/project-400\.webp 400w, \.\.\/\.\.\/assets\/optimized\/project-800\.webp 800w"/);
});
