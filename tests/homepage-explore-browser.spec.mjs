import { test, expect } from "@playwright/test";
import { featuredProjects } from "../public-projects.js";

const bookingURL = "https://briefbooth.com/book/4u-digital";
const projectType = (project) => ["micro-short-website", "PinsAndNeedlesComedyWebsite"].includes(project.id)
  ? "website" : project.category === "ios" ? "ios" : "web-app";
const values = ["all", "website", "web-app", "ios"];
const matchingProjects = (value) => featuredProjects.filter((project) => value === "all" || projectType(project) === value);
const radio = (page, value) => page.locator(`#work .work-filter input[name="work-type"][value="${value}"]`);

async function chooseType(page, value) {
  await page.locator(`#work .work-filter label:has(input[value="${value}"])`).click();
  await expect(radio(page, value)).toBeChecked();
}

async function expectSelectedWork(page, value, checkCount = true) {
  const expected = matchingProjects(value);
  const cards = page.locator("#featured-projects .project-card");
  await expect(cards).toHaveCount(featuredProjects.length);
  await expect(page.locator("#featured-projects .project-card:visible .project-title"))
    .toHaveText(expected.map((project) => project.title));
  for (const card of await cards.all()) {
    const type = await card.getAttribute("data-work-type");
    if (value === "all" || type === value) await expect(card).toBeVisible();
    else await expect(card).toBeHidden();
  }
  const primaryCount = expected.filter((project) => featuredProjects.indexOf(project) < 3).length;
  const supportingCount = expected.length - primaryCount;
  if (primaryCount === 0) await expect(page.locator("#featured-projects .product-stories")).toBeHidden();
  if (supportingCount === 0) await expect(page.locator("#featured-projects .supporting-section")).toBeHidden();
  if (checkCount) await expect(page.locator("#work-filter-status"))
    .toHaveText(`${expected.length} featured ${expected.length === 1 ? "project" : "projects"}`);
}

test("featured work switches by pointer and native keyboard without affecting the archive", async ({ page }) => {
  await page.goto("/#work");
  const names = ["All projects", "Websites", "Web apps", "iPhone & iPad"];
  await expect(page.locator('#work .work-filter input[name="work-type"]')).toHaveCount(4);
  for (const [index, value] of values.entries()) {
    await expect(radio(page, value)).toHaveAccessibleName(names[index]);
    await expect(radio(page, value)).toHaveAttribute("aria-controls", "featured-projects");
  }
  await expect(page.locator("#work-filter-status")).toBeVisible();
  await expect(page.locator("#work-filter-status")).toHaveAttribute("role", "status");
  await expect(radio(page, "all")).toBeChecked();
  await expectSelectedWork(page, "all");
  for (const value of values.slice(1)) {
    await chooseType(page, value);
    await expect(radio(page, value)).toBeFocused();
    await expectSelectedWork(page, value);
    await expect(page.locator('.archive-controls [data-filter="all"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("dialog")).toBeHidden();
  }
  await radio(page, "all").focus();
  await page.keyboard.press("Space");
  await expectSelectedWork(page, "all");
  for (const value of values.slice(1)) {
    await page.keyboard.press("ArrowRight");
    await expect(radio(page, value)).toBeFocused();
    await expect(radio(page, value)).toBeChecked();
    await expectSelectedWork(page, value);
  }
  await page.keyboard.press("ArrowRight");
  await expect(radio(page, "all")).toBeChecked();
  await expectSelectedWork(page, "all");
});

test("changing work filters retains gallery selections and full-color original previews", async ({ page }) => {
  await page.goto("/#work");
  const project = featuredProjects.find((entry) => entry.id === "The-Bit-Binder");
  const card = page.locator(`#featured-projects .project-card:is([data-case-id="${project.id}"], [data-supporting-id="${project.id}"])`);
  const disclosure = card.locator("details.gallery-disclosure");
  await disclosure.locator("summary").click();
  const choice = card.locator("button[data-gallery]").last();
  await choice.click();
  await expect(choice).toHaveAttribute("aria-pressed", "true");
  const frame = project.gallery.at(-1);
  const image = card.locator(".primary-screen");
  await expect(image).toHaveAttribute("src", frame.image);
  await chooseType(page, "website");
  await expect(card).toBeHidden();
  await chooseType(page, "ios");
  await expect(card).toBeVisible();
  await expect(disclosure).toHaveAttribute("open", "");
  await expect(choice).toHaveAttribute("aria-pressed", "true");
  await expect(image).toHaveAttribute("src", frame.image);
  await expect(image).toHaveCSS("filter", "none");
  await expect(image).toHaveCSS("opacity", "1");
  await expect(image).toHaveCSS("mix-blend-mode", "normal");
  await expect(card.locator(".project-visual")).toHaveCSS("filter", "none");
  await chooseType(page, "all");
  await expectSelectedWork(page, "all");
  await expect(image).toHaveAttribute("src", frame.image);
});

test("work exploration fits small phones and keeps booking within reach", async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#work");
    for (const value of values) {
      await chooseType(page, value);
      await expectSelectedWork(page, value);
      await expect(page.locator(".mobile-consultation")).toBeVisible();
      const booking = page.locator(".mobile-consultation [data-booking-link]");
      await expect(booking).toHaveAttribute("href", bookingURL);
      await expect(booking).toHaveAttribute("target", "_blank");
      await expect(booking).toHaveAttribute("rel", /noopener/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.locator("#work .work-filter label").evaluateAll((labels) => labels.every((label) => {
        const box = label.getBoundingClientRect();
        return box.left >= -1 && box.right <= innerWidth + 1 && box.height >= 44;
      }))).toBe(true);
      const image = page.locator("#featured-projects .project-card:visible .primary-screen").first();
      await expect(image).toHaveCSS("filter", "none");
      await expect(image).toHaveCSS("mix-blend-mode", "normal");
    }
  }
});

test.describe("native featured-work browsing without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("project choices work on phones and retain real story links without JavaScript", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/#work");
    await expect(page.locator("#work-filter-status")).toBeHidden();
    for (const value of values) {
      // Native keyboard activation works while the initial section scroll settles.
      await radio(page, value).focus();
      await page.keyboard.press("Space");
      await expect(radio(page, value)).toBeChecked();
      await expectSelectedWork(page, value, false);
      const project = matchingProjects(value)[0];
      const link = page.locator("#featured-projects .project-card:visible").first()
        .getByRole("link", { name: `View project: ${project.title}`, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", project.caseUrl);
      await expect(page.locator(".mobile-consultation")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await radio(page, "all").focus();
    await page.keyboard.press("Space");
    await expectSelectedWork(page, "all", false);
    await page.keyboard.press("ArrowRight");
    await expect(radio(page, "website")).toBeChecked();
    await expect(radio(page, "website")).toBeFocused();
    await expectSelectedWork(page, "website", false);
    const website = matchingProjects("website")[0];
    await page.locator("#featured-projects .project-card:visible").first()
      .getByRole("link", { name: `View project: ${website.title}`, exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/work\/micro-short-film-website\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(website.title);
  });
});
