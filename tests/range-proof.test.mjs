import test from "node:test";
import assert from "node:assert/strict";
import { publishedApps, renderRangeProof } from "../range-proof.js";
import { isProductCover } from "../render-projects.js";

test("the range proof identifies three real App Store products and distinct engineering examples", () => {
  const apps = publishedApps();
  assert.deepEqual(apps.map(({ id }) => id), ["The-Bit-Binder", "MyGigCalendar", "Open-Micer-Timer"]);
  const html = renderRangeProof();
  for (const app of apps) {
    assert.equal(new URL(app.demoUrl).hostname, "apps.apple.com");
    assert.ok(html.includes(app.demoUrl));
    assert.ok(html.includes(app.icon));
    assert.ok(html.includes(app.caseUrl));
  }
  for (const route of ["trip-handler", "bill-spilt", "micro-short-film-website", "pins-and-needles-comedy", "freescript", "sobstage"]) {
    assert.ok(html.includes(`./work/${route}/`));
  }
  assert.match(html, /FreeScript: a signed Mac screenplay editor, not notarized/);
  assert.match(html, /SobStage: desktop audio engineering, with physical microphone validation pending/);
  assert.ok(html.includes("3 PUBLISHED iOS APPS"));
  assert.doesNotMatch(html, /DicType|TLC Massage Wellness|RoleCall|BleepKit|VlogNudge|dictype|tlc-massage-wellness/i);
  assert.doesNotMatch(html, /\bsenior\b|years of experience|client results|\bdownloads\b/i);
});


test("full composition cover mode excludes portrait artwork, native captures, and paired workflows", () => {
  const banner = { width: 1920, height: 1080, sourceKind: "owner-supplied-product-artwork" };
  assert.equal(isProductCover(banner), true);
  assert.equal(isProductCover({ ...banner, width: 2560, height: 1440, sourceKind: "repository-product-artwork" }), true);
  assert.equal(isProductCover({ ...banner, width: 2400, height: 1500, sourceKind: "repository-product-artwork" }), true,
    "Repository artwork preserves its native 8:5 composition");
  assert.equal(isProductCover({ ...banner, width: 1800, height: 800 }), true,
    "Explicit landscape artwork is not restricted to one aspect ratio");
  for (const [reason, overrides] of [
    ["explicit portrait mode", { portrait: true }],
    ["portrait promotional dimensions", { width: 1320, height: 2868 }],
    ["square artwork", { width: 1000, height: 1000 }],
    ["missing width", { width: undefined }],
    ["zero height", { height: 0 }],
    ["negative height", { height: -1000 }],
    ["non-finite width", { width: Infinity }],
    ["invalid height", { height: NaN }],
    ["unparsed dimension strings", { width: "2400", height: "1500" }],
    ["a companion image", { companion: { image: "./native-screen.png" } }],
    ["a workflow illustration", { workflow: ["Import", "Review"] }],
    ["a native capture at the same aspect ratio", { sourceKind: "repository-app-capture" }],
    ["unverified artwork", { sourceKind: undefined }],
  ]) {
    assert.equal(isProductCover({ ...banner, ...overrides }), false, reason);
  }
  assert.equal(isProductCover(banner), true, "classifying other views leaves the original cover unchanged");
});
