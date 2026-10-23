import { test, expect } from "@playwright/test";

const route = "/project-brief/";
const endpoint = "**/functions/v1/project-brief";
const draftKey = "4u-digital-project-brief-v1";
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j6XcAAAAASUVORK5CYII=", "base64");
const image = { name: "brand-reference.png", mimeType: "image/png", buffer: png };

async function jump(page, index) {
  await page.locator(`[data-brief-go="${index}"]`).click();
  await expect(page.locator(`[data-brief-step="${index}"]`)).toBeVisible();
}

async function minimalReview(page, type = "website") {
  await page.goto(route);
  await expect(page.locator("#project-brief-form")).toBeVisible();
  await page.locator(`[name="projectType"][value="${type}"]`).check();
  await jump(page, 8);
  await page.locator("#brief-contactName").fill("Jordan Client");
  await page.locator("#brief-contactEmail").fill("jordan@example.com");
  await page.locator("#brief-next").click();
  await expect(page.locator("#brief-review")).toBeVisible();
}

async function expectFit(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator(".brief-main button, .brief-main input:not([type=color]), .brief-main textarea").evaluateAll((elements) => elements.filter((element) => element.getClientRects().length && element.offsetWidth > 2).every((element) => {
    const bounds = element.getBoundingClientRect();
    return bounds.left >= -1 && bounds.right <= innerWidth + 1;
  }))).toBe(true);
}

function requestBrief(request) {
  const content = request.postData()?.match(/name="brief"\r\n\r\n([\s\S]*?)\r\n--/);
  expect(content, "A structured brief is present in the multipart submission").not.toBeNull();
  return JSON.parse(content[1]);
}

test("the guided brief supports skipping, required validation, accessible review, and direct submission", async ({ page }) => {
  const requests = [];
  await page.route(endpoint, async (route) => {
    requests.push(route.request());
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, reference: "B4U-TEST-ONE", status: "sent" }) });
  });
  await page.goto(route);
  await expect(page).toHaveTitle(/Plan Your Website, App or Software Project.*4u Digital/);
  await page.locator("#brief-next").click();
  await expect(page.locator('[name="projectType"]').first()).toBeFocused();
  await expect(page.locator("#brief-status")).toContainText("choose an option");
  await page.locator('[name="projectType"][value="unsure"]').check();
  await page.locator("#brief-next").click();
  await expect(page.locator('[data-brief-step="1"]')).toBeVisible();
  await page.locator("#brief-skip").click();
  await expect(page.locator('[data-brief-step="2"]')).toBeVisible();
  await jump(page, 8);
  await page.locator("#brief-contactName").fill("Jordan Client");
  await page.locator("#brief-contactEmail").fill("not-an-email");
  await page.locator("#brief-next").click();
  await expect(page.locator("#brief-contactEmail")).toBeFocused();
  await page.locator("#brief-contactEmail").fill("jordan@example.com");
  await page.locator("#brief-next").click();
  await expect(page.locator("#brief-review")).toContainText("Left open for our conversation");
  await page.locator("#brief-send").click();
  await expect(page.locator("#brief-consent-error")).toBeVisible();
  expect(requests).toHaveLength(0);
  await page.locator("#brief-consent").check();
  await page.locator("#brief-send").click();
  await expect(page.locator("#brief-success")).toBeVisible();
  await expect(page.locator("#brief-success-title")).toContainText("on its way");
  expect(requests).toHaveLength(1);
  expect(requestBrief(requests[0])).toMatchObject({ version: 1, consent: true, honey: "", answers: { projectType: "unsure", contactName: "Jordan Client", contactEmail: "jordan@example.com" } });
  expect(requests[0].headers()["content-type"]).toContain("multipart/form-data; boundary=");
  expect(requests[0].headers().apikey).toMatch(/^sb_publishable_/);
  await expectFit(page);
});

test("project choices show relevant questions and review editing keeps every applicable answer", async ({ page }) => {
  await page.goto(route);
  await page.locator('[name="projectType"][value="website"]').check();
  await page.locator("#brief-idea").fill("An approachable site for our neighborhood shop.");
  await jump(page, 2);
  await expect(page.locator('[data-field-container="websitePages"]')).toBeVisible();
  await expect(page.locator('[data-field-container="appPlatforms"]')).toBeHidden();
  await expect(page.locator('[data-field-container="softwareTasks"]')).toBeHidden();
  await page.locator('[name="websitePages"][value="gallery"]').check();
  await jump(page, 0);
  await expect(page.locator("#brief-idea")).toHaveValue("An approachable site for our neighborhood shop.");
  await page.locator('[name="projectType"][value="app"]').check();
  await jump(page, 2);
  await expect(page.locator('[data-field-container="websitePages"]')).toBeHidden();
  await expect(page.locator('[data-field-container="appPlatforms"]')).toBeVisible();
  await page.locator('[name="appPlatforms"][value="ios"]').check();
  await page.locator('[data-brief-step="2"] .brief-advanced summary').click();
  await expect(page.locator('[data-field-container="appCapabilities"]')).toBeVisible();
  await jump(page, 8);
  await page.locator("#brief-contactName").fill("Jordan Client");
  await page.locator("#brief-contactEmail").fill("jordan@example.com");
  await page.locator("#brief-next").click();
  await expect(page.locator("#brief-review-content")).toContainText("iPhone / iPad");
  await expect(page.locator("#brief-review-content")).not.toContainText("Gallery, work, or portfolio");
  await page.locator('[data-brief-edit="0"]').click();
  await page.locator("#brief-idea").fill("A useful native app for our customers.");
  await page.locator("#brief-next").click();
  await expect(page.locator("#brief-review-content")).toContainText("A useful native app for our customers.");
  await expect(page.locator("#brief-review-content")).toContainText("Jordan Client");
  await expectFit(page);
});

test("uploaded references stay full color and support limits, captions, and removal", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto(route);
  await page.locator('[name="projectType"][value="website"]').check();
  await jump(page, 4);
  await page.locator("#brief-colors").fill("Forest green and cream");
  await page.locator("#brief-color-picker").fill("#163d2a");
  await page.locator("#brief-add-color").click();
  await expect(page.locator("#brief-colors")).toHaveValue("Forest green and cream, #163d2a");
  await expect(page.locator("#brief-color-swatches")).toContainText("#163d2a");
  await jump(page, 5);
  await page.locator("#brief-files").setInputFiles([image, { name: "brand-guidelines.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nbrief reference\n%%EOF") }]);
  await expect(page.locator(".brief-file-card")).toHaveCount(2);
  await expect(page.locator(".brief-file-preview")).toHaveCSS("filter", "none");
  await page.locator("[data-file-caption]").first().fill("Use this photograph on the homepage.");
  await page.locator("#brief-files").setInputFiles({ name: "camera-photo.heic", mimeType: "image/heic", buffer: Buffer.from("not a supported format") });
  await expect(page.locator("#brief-file-error")).toContainText("export a JPEG");
  await page.locator("#brief-files").setInputFiles({ name: "too-large.png", mimeType: "image/png", buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
  await expect(page.locator("#brief-file-error")).toContainText("over 5 MB");
  await expect(page.locator(".brief-file-card")).toHaveCount(2);
  await page.getByRole("button", { name: "Remove brand-guidelines.pdf", exact: true }).click();
  await expect(page.locator(".brief-file-card")).toHaveCount(1);
  await expect(page.locator("[data-file-caption]")).toHaveValue("Use this photograph on the homepage.");
  await page.locator("#brief-files").setInputFiles(Array.from({ length: 6 }, (_, index) => ({ ...image, name: `reference-${index}.png` })));
  await expect(page.locator(".brief-file-card")).toHaveCount(6);
  await expect(page.locator("#brief-file-error")).toContainText("up to 6 files");
  for (let index = 0; index < 6; index += 1) await page.locator("[data-remove-file]").first().click();
  await page.locator("#brief-files").setInputFiles(Array.from({ length: 3 }, (_, index) => ({ name: `large-reference-${index}.jpg`, mimeType: "image/jpeg", buffer: Buffer.alloc(3 * 1024 * 1024) })));
  await expect(page.locator(".brief-file-card")).toHaveCount(2);
  await expect(page.locator("#brief-file-error")).toContainText("8 MB combined limit");
  await expectFit(page);
});

test("draft saving is opt in, preserves answers after reload, and never stores uploaded image data", async ({ page }) => {
  await page.goto(route);
  await page.locator('[name="projectType"][value="software"]').check();
  await page.locator("#brief-idea").fill("An inventory tool for our team.");
  expect(await page.evaluate((key) => localStorage.getItem(key), draftKey)).toBeNull();
  if (!(await page.locator("#brief-draft-settings").evaluate((element) => element.open))) await page.locator("#brief-draft-settings > summary").click();
  await page.locator("#brief-save-draft").check();
  await jump(page, 5);
  await page.locator("#brief-files").setInputFiles(image);
  await expect(page.locator("#brief-draft-status")).toContainText("reselect");
  const stored = await page.evaluate((key) => localStorage.getItem(key), draftKey);
  expect(stored).toContain("An inventory tool");
  expect(stored).not.toMatch(/base64|blob:|iVBOR|brand-reference\.png/);
  await page.reload();
  await expect(page.locator("#brief-draft-restored")).toContainText("reselect");
  await expect(page.locator(".brief-file-card")).toHaveCount(0);
  await jump(page, 0);
  await expect(page.locator("#brief-idea")).toHaveValue("An inventory tool for our team.");
  if (!(await page.locator("#brief-draft-settings").evaluate((element) => element.open))) await page.locator("#brief-draft-settings > summary").click();
  await page.locator("#brief-remove-draft").click();
  expect(await page.evaluate((key) => localStorage.getItem(key), draftKey)).toBeNull();
  await expect(page.locator("#brief-idea")).toHaveValue("An inventory tool for our team.");
  await page.locator("#brief-clear").click();
  await page.locator("#brief-clear-yes").click();
  await expect(page.locator("#brief-idea")).toHaveValue("");
  await expect(page.locator('[name="projectType"]:checked')).toHaveCount(0);
});

test("an interrupted submission keeps answers and files and an unchanged retry keeps its request ID", async ({ page }) => {
  const payloads = [];
  await page.route(endpoint, async (route) => {
    payloads.push(requestBrief(route.request()));
    if (payloads.length === 1) await route.abort("failed");
    else await route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ ok: true, reference: "B4U-RETRY-TEST", status: "received" }) });
  });
  await minimalReview(page);
  await page.locator('[data-brief-edit="5"]').click();
  await page.locator("#brief-files").setInputFiles(image);
  await page.locator("[data-file-caption]").fill("Our original product photograph.");
  await page.locator("#brief-next").click();
  await page.locator("#brief-consent").check();
  await page.locator("#brief-send").click();
  await expect(page.locator("#brief-status")).toContainText("could not confirm receipt");
  await expect(page.locator("#brief-success")).toBeHidden();
  await expect(page.locator("#brief-review-content")).toContainText("Our original product photograph");
  await page.locator("#brief-send").click();
  await expect(page.locator("#brief-success")).toBeVisible();
  await expect(page.locator("#brief-success-title")).toContainText("safely received");
  await expect(page.locator("#brief-success-message")).toContainText("notification is still pending");
  await expect(page.locator("#brief-success-message")).not.toContainText("accepted for delivery");
  expect(payloads).toHaveLength(2);
  expect(payloads[0].requestId).toBe(payloads[1].requestId);
  expect(payloads[0].requestId).toMatch(/^[\da-f-]{36}$/);
  const pendingDownload = page.waitForEvent("download");
  await page.locator("#brief-success-download").click();
  const download = await pendingDownload;
  expect(download.suggestedFilename()).toContain("project-brief");
});

test("a malformed success never claims delivery and editing a failed attempt creates a new request ID", async ({ page }) => {
  const payloads = [];
  await page.route(endpoint, async (route) => {
    payloads.push(requestBrief(route.request()));
    if (payloads.length === 1) await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    else await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, reference: "B4U-EDIT-TEST", status: "sent" }) });
  });
  await minimalReview(page);
  await page.locator("#brief-consent").check();
  await page.locator("#brief-send").click();
  await expect(page.locator("#brief-status")).toContainText("could not be confirmed");
  await expect(page.locator("#brief-success")).toBeHidden();
  await page.locator('[data-brief-edit="0"]').click();
  await page.locator("#brief-idea").fill("This is the amended project idea.");
  await page.locator("#brief-next").click();
  await page.locator("#brief-send").click();
  await expect(page.locator("#brief-success")).toBeVisible();
  expect(payloads).toHaveLength(2);
  expect(payloads[0].requestId).not.toBe(payloads[1].requestId);
  expect(payloads[1].answers.idea).toBe("This is the amended project idea.");
});

test("the entire brief fits a 320px viewport and native choices work from a keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route);
  const firstChoice = page.locator('[name="projectType"][value="website"]');
  await firstChoice.focus();
  await page.keyboard.press("Space");
  await expect(firstChoice).toBeChecked();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator('[name="projectType"][value="app"]')).toBeChecked();
  for (let step = 0; step < 9; step += 1) {
    await jump(page, step);
    await expectFit(page);
    const details = page.locator(`[data-brief-step="${step}"] .brief-advanced:not([hidden])`);
    if (await details.count()) { await details.locator("summary").click(); await expectFit(page); }
  }
  await page.locator("#brief-contactName").fill("Jordan Client");
  await page.locator("#brief-contactEmail").fill("jordan@example.com");
  await page.locator("#brief-next").click();
  await expectFit(page);
  const consentBounds = await page.locator(".brief-consent label").boundingBox();
  expect(consentBounds.height).toBeGreaterThanOrEqual(44);
});

test("server field errors stay editable and saved delivery exceptions never masquerade as sent email", async ({ page }) => {
  let attempts = 0;
  await page.route(endpoint, async (route) => {
    attempts += 1;
    if (attempts === 1) await route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ ok: true, status: "sent", reference: "B4U-INVALID-STATE" }) });
    else if (attempts === 2) await route.fulfill({ status: 422, contentType: "application/json", body: JSON.stringify({ ok: false, field: "contactEmail", message: "Please check your reply address." }) });
    else await route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ ok: true, status: "received", delivery: "uncertain", reference: "B4U-RECEIVED-TEST", message: "Your brief is saved. The email notification needs attention; you do not need to submit again." }) });
  });
  await minimalReview(page);
  await page.locator("#brief-consent").check();
  await page.locator("#brief-send").click();
  await expect(page.locator("#brief-status")).toContainText("could not be confirmed");
  await expect(page.locator("#brief-success")).toBeHidden();
  await page.locator("#brief-send").click();
  await expect(page.locator("#brief-contactEmail")).toBeFocused();
  await expect(page.locator("#brief-contactEmail-error")).toContainText("check your reply address");
  await page.locator("#brief-contactEmail").fill("jordan.updated@example.com");
  await page.locator("#brief-next").click();
  await page.locator("#brief-send").click();
  await expect(page.locator("#brief-success")).toBeVisible();
  await expect(page.locator("#brief-success-message")).toContainText("notification needs attention");
  await expect(page.locator("#brief-success-message")).not.toContainText("still pending");
  await expect(page.locator("#brief-success-title")).not.toContainText("on its way");
});
