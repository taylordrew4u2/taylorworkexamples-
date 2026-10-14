import { test, expect } from "@playwright/test";

function readDraft(href) {
  const url = new URL(href);
  expect(url.protocol).toBe("mailto:");
  expect(url.pathname).toBe("admin@customtechbuilt4u.com");
  return { subject: url.searchParams.get("subject"), body: url.searchParams.get("body") };
}

async function expectConsultationFit(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    "The consultation section fits the page on this device").toBe(true);
  const section = page.locator("#consultation");
  const controlsFit = await section.locator("input:not([type='radio']), textarea, button, a")
    .evaluateAll((elements) => elements.filter((element) => element.getClientRects().length > 0).every((element) => {
      const bounds = element.getBoundingClientRect();
      return bounds.width > 0 && bounds.left >= -1 && bounds.right <= window.innerWidth + 1;
    }));
  expect(controlsFit, "Visible consultation fields and actions fit the viewport").toBe(true);
}

test("the homepage prepares a chosen consultation and provides a usable copy fallback", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => { throw new Error("Clipboard unavailable for consultation test"); } },
    });
  });
  await page.goto("/");
  expect(await page.locator("#consultation").evaluate((section) => Boolean(
    document.querySelector("#process").compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING,
  )), "Clients can see services and selected work before the full consultation form").toBe(true);
  const heroAction = page.locator(".intro-actions").getByRole("link", { name: "Book a consultation", exact: false });
  await expect(heroAction).toHaveAttribute("href", "#consultation");
  const menu = page.locator(".menu-toggle");
  if (testInfo.project.name === "phone") await menu.click();
  const navAction = page.locator("#main-nav").getByRole("link", { name: "Book a consultation", exact: false });
  await expect(navAction).toHaveAttribute("href", "#consultation");
  if (testInfo.project.name === "phone") {
    await navAction.click();
    await expect(menu).toHaveAttribute("aria-expanded", "false");
  } else {
    await heroAction.click();
  }
  await expect(page).toHaveURL(/#consultation$/);

  const form = page.locator("#consultation-form");
  const times = form.getByLabel("Preferred days and times", { exact: false });
  const project = form.getByLabel("About your project (optional)", { exact: false });
  const email = page.locator("#consultation-email");
  await expect(form).toBeVisible();
  await expect(form.getByRole("radio", { name: /^Zoom(?:\s|$)/ })).toBeChecked();
  await expect(times).toHaveAttribute("required", "");
  await expect(times).toHaveAttribute("maxlength", "300");
  await expect(project).toHaveAttribute("maxlength", "1000");

  // Keep the test inside the page even when the product opens its prepared email.
  await email.evaluate((element) => element.addEventListener("click", (event) => event.preventDefault()));
  await form.getByRole("button", { name: "Open email request", exact: true }).click();
  expect(await times.evaluate((element) => element.validity.valueMissing)).toBe(true);
  await expect(email).toBeHidden();
  await expect(times).toBeFocused();

  await form.getByRole("radio", { name: /^In person · NYC(?:\s|$)/ }).check();
  const preferredTimes = "Tuesday or Thursday after 2 pm, Eastern time";
  const brief = "A salon booking website with a clear staff calendar & customer reminders.";
  await times.fill(preferredTimes);
  await project.fill(brief);
  const draft = readDraft(await email.getAttribute("href"));
  expect(draft.subject).toBe("Built4U in-person consultation");
  expect(draft.body).toContain("In person in the New York City area");
  expect(draft.body).toContain(preferredTimes);
  expect(draft.body).toContain(brief);
  await form.getByRole("button", { name: "Open email request", exact: true }).click();
  await expect(email).toBeVisible();
  expect(readDraft(await email.getAttribute("href"))).toEqual(draft);

  await page.locator("#consultation-copy").click();
  const manualDraft = page.locator("#consultation-draft");
  await expect(manualDraft).toBeVisible();
  await expect(manualDraft).toHaveAttribute("readonly", "");
  await expect(manualDraft).toHaveValue(new RegExp("Built4U in-person consultation"));
  await expect(manualDraft).toHaveValue(new RegExp(preferredTimes));
  expect(await manualDraft.inputValue()).toContain(brief);
  await expect(page.locator("#consultation-status")).toContainText(/clipboard|copy|select/i);
  await expectConsultationFit(page);
});

test("clients can request either consultation directly from the homepage without JavaScript", async ({ browser }, testInfo) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: testInfo.project.use.viewport,
  });
  try {
    const page = await context.newPage();
    await page.goto(new URL("/", testInfo.project.use.baseURL || "http://127.0.0.1:4173").href);
    await expect(page.locator(".intro-actions").getByRole("link", { name: "Book a consultation", exact: false }))
      .toHaveAttribute("href", "#consultation");
    const fallback = page.locator("#consultation .consultation-fallback");
    await expect(fallback).toBeVisible();
    await expect(page.locator("#consultation-form")).toBeHidden();
    for (const [label, subject, format] of [
      ["Zoom", "Built4U Zoom consultation", "Zoom"],
      ["In person · NYC", "Built4U in-person consultation", "In person in the New York City area"],
    ]) {
      const link = fallback.getByRole("link", { name: label, exact: false });
      await expect(link).toBeVisible();
      const draft = readDraft(await link.getAttribute("href"));
      expect(draft.subject).toBe(subject);
      expect(draft.body).toContain(format);
      expect(draft.body).toMatch(/preferred.*(?:days|times)|(?:days|times).*preferred/i);
    }
    await expect(page.locator("#consultation")).toContainText(/confirm|arrange|by email/i);
    await expectConsultationFit(page);
  } finally {
    await context.close();
  }
});
