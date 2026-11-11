import test from "node:test";
import assert from "node:assert/strict";
import { publishedApps, renderRangeProof } from "../range-proof.js";

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
