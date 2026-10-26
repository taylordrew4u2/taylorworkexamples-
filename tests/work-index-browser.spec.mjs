import { test, expect } from "@playwright/test";
import { projects } from "../public-projects.js";
import { projectSlugs } from "../seo-content.js";
import { bookingURL } from "../booking.js";
import { projectClientUses } from "../content/project-client-uses.js";

const typeOf = (project) => ["micro-short-website", "PinsAndNeedlesComedyWebsite"].includes(project.id)
  ? "website" : project.category === "ios" ? "ios" : project.category === "desktop" ? "desktop" : "web-app";
const types = ["all", "website", "web-app", "ios", "desktop"];
const cards = (page) => page.locator("#project-collection .work-page-grid .seo-project-card");
const filter = (page, type) => page.locator(`#project-browser-controls [data-project-filter="${type}"]`);

async function expectResults(page, expected) {
  await expect(cards(page)).toHaveCount(projects.length);
  await expect(cards(page).filter({ visible: true })).toHaveCount(expected.length);
  await expect.poll(async () => (await page.locator("#project-collection .seo-project-card:visible .seo-project-heading h3")
    .allTextContents()).sort()).toEqual(expected.map((project) => project.title).sort());
  await expect(page.locator("#project-browser-count")).toHaveText(`${expected.length} of ${projects.length} projects`);
  if (expected.length) await expect(page.locator("#project-browser-empty")).toBeHidden();
  else await expect(page.locator("#project-browser-empty")).toBeVisible();
}

test("dedicated portfolio filters work by pointer and keyboard without removing project links", async ({ page }) => {
  await page.goto("/work/");
  await expect(page.locator("#project-browser-controls")).toBeVisible();
  await expect(page.locator("#project-browser-count")).toHaveAttribute("role", "status");
  for (const type of types) {
    const choice = filter(page, type);
    await expect(choice).toHaveRole("button");
    await choice.click();
    await expect(choice).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('#project-browser-controls [data-project-filter][aria-pressed="true"]')).toHaveCount(1);
    await expectResults(page, projects.filter((project) => type === "all" || typeOf(project) === type));
  }
  await filter(page, "all").focus();
  await page.keyboard.press("Enter");
  await expect(filter(page, "all")).toBeFocused();
  await expectResults(page, projects);
  for (const project of projects) {
    const card = page.locator(`.seo-project-card[data-project-id="${project.id}"]`);
    await expect(card.locator("a[href]")).not.toHaveCount(0);
    for (const link of await card.locator("a[href]").all()) {
      expect(new URL(await link.getAttribute("href"), page.url()).pathname).toBe(`/work/${projectSlugs[project.id]}/`);
    }
  }
});

test("clients can search the capability and illustrative business context as well as project names", async ({ page }) => {
  await page.goto("/work/");
  const search = page.getByRole("searchbox", { name: "Search projects", exact: true });
  for (const [query, id] of [["Repayment planning", "Bill-Spilt"], ["suppliers", "nycstandupopenmicmaster"]]) {
    await search.fill(query);
    await expectResults(page, projects.filter((project) => project.id === id));
    const card = page.locator(`.seo-project-card[data-project-id="${id}"]`);
    await expect(card.locator(".work-project-capabilities li")).toHaveText(projectClientUses[id].capabilities);
    await expect(card.locator(".work-project-business-use")).toContainText(projectClientUses[id].businessUse);
  }
});

test("portfolio search combines with the selected type and offers a usable empty-state recovery", async ({ page }) => {
  await page.goto("/work/");
  const search = page.getByRole("searchbox", { name: "Search projects", exact: true });
  await filter(page, "website").click();
  await search.fill("  MiCrO  ");
  await expectResults(page, projects.filter((project) => project.id === "micro-short-website"));
  await search.fill("BitBinder");
  await expectResults(page, []);
  await expect(filter(page, "website")).toHaveAttribute("aria-pressed", "true");
  const reset = page.locator("#project-browser-reset");
  await reset.click();
  await expect(search).toHaveValue("");
  await expect(search).toBeFocused();
  await expect(filter(page, "all")).toHaveAttribute("aria-pressed", "true");
  await expectResults(page, projects);
  await search.fill("BitBinder");
  await expectResults(page, projects.filter((project) => project.id === "The-Bit-Binder"));
  const detail = page.locator('.seo-project-card[data-project-id="The-Bit-Binder"] .seo-project-heading a');
  await detail.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/work\/bitbinder\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("The BitBinder");
});

test("portfolio browsing fits narrow phones while preserving full-color artwork and direct booking", async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/work/");
    for (const type of types) {
      await filter(page, type).click();
      const expected = projects.filter((project) => type === "all" || typeOf(project) === type);
      await expectResults(page, expected);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.locator("#project-browser-controls [data-project-filter]").evaluateAll((elements) =>
        elements.every((element) => {
          const box = element.getBoundingClientRect();
          return box.width >= 44 && box.height >= 44 && box.left >= 0 && box.right <= innerWidth;
        })), "Every filter remains a full-size tap target inside the phone").toBe(true);
      const card = page.locator("#project-collection .seo-project-card:visible").first();
      const image = card.locator(".seo-project-cover img");
      await expect(image).toHaveCSS("filter", "none");
      await expect(image).toHaveCSS("mix-blend-mode", "normal");
      await expect(card.locator(".seo-project-cover")).toHaveCSS("filter", "none");
      const booking = page.locator(".mobile-consultation [data-booking-link]");
      const planner = page.locator(".planner-shortcut");
      await expect(booking).toHaveAttribute("href", bookingURL);
      await expect(booking).toBeInViewport({ ratio: 1 });
      await expect(planner).toBeInViewport({ ratio: 1 });
      const bookingBox = await booking.boundingBox();
      const plannerBox = await planner.boundingBox();
      expect(plannerBox.x + plannerBox.width).toBeLessThanOrEqual(bookingBox.x);
    }
  }
});

test.describe("the complete portfolio without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("all selected projects remain visible, illustrated, and reachable without filter controls", async ({ page }) => {
    await page.goto("/work/");
    await expect(page.locator("#project-browser-controls")).toBeHidden();
    await expect(cards(page)).toHaveCount(projects.length);
    await expect(cards(page).filter({ visible: true })).toHaveCount(projects.length);
    for (const project of projects) {
      const card = page.locator(`.seo-project-card[data-project-id="${project.id}"]`);
      await expect(card.locator(".seo-project-heading h3")).toHaveText(project.title);
      await expect(card.locator(".work-project-purpose")).toHaveText(project.purpose);
      await expect(card.locator(".work-project-capabilities li")).toHaveText(projectClientUses[project.id].capabilities);
      await expect(card.locator(".work-project-business-use")).toContainText("A similar business need");
      const image = card.locator(".seo-project-cover img");
      expect(new URL(await image.getAttribute("src"), page.url()).pathname)
        .toBe(`/${project.image.replace(/^\.\//, "")}`);
      await expect(image).toHaveAttribute("alt", project.imageAlt);
      await expect(image).toHaveCSS("filter", "none");
      const link = card.locator(".seo-project-heading a");
      await link.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp(`/work/${projectSlugs[project.id]}/$`));
      await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(project.title);
      await page.goto("/work/");
    }
  });
});
