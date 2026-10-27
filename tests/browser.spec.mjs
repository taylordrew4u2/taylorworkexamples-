import { test, expect } from "@playwright/test";
import { projects } from "../public-projects.js";

// Detailed gallery behavior is covered on the dedicated project routes.
test("the homepage loads a concise hiring offer and original project artwork without script errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveTitle("Custom App, Website & Software Development | 4u Digital");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("You know your business. I’ll build the technology.");
  await expect(page.locator(".simple-kicker")).toHaveText("Custom tech build for you.");
  await expect(page.locator(".simple-descriptor")).toHaveText("Apps, websites, and software for your business.");
  await expect(page.getByRole("banner").getByRole("link", { name: "4u Digital, home", exact: true })).toBeVisible();
  await expect(page.locator(".simple-project img")).toHaveCount(3);
  for (const image of await page.locator(".simple-project img").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
    await expect(image).toHaveCSS("filter", "none");
    await expect(image).toHaveCSS("mix-blend-mode", "normal");
    await expect(image).toHaveCSS("object-fit", "contain");
    expect(await image.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const ratio = Number(element.getAttribute("width")) / Number(element.getAttribute("height"));
      return box.width > 0 && box.height > 0 && Math.abs(element.naturalWidth / element.naturalHeight - ratio) < .02;
    }), "Original project artwork retains its proportions").toBe(true);
  }
  await expect(page.locator("#project-dialog, [role='tablist'], input[name='hero-project'], .hero-chooser, .planner-shortcut")).toHaveCount(0);
  await expect(page.locator(".owner-credit")).toHaveCount(0);
  await expect(page.locator("footer")).toContainText("4u Digital is operated by TaylorDrew4u LLC.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("old homepage portfolio links reach the complete projects page", async ({ page }) => {
  for (const [hash, destination] of [["#work", "/work/"], ["#project-archive", "/work/"], ["#app-store-proof", "/work/#app-store-proof"]]) {
    await page.goto(`/${hash}`);
    await expect(page).toHaveURL(new RegExp(`${destination}$`));
    await expect(page.locator(".work-page-grid .seo-project-card")).toHaveCount(projects.length);
  }
});

test("dedicated project pages show the need, build evidence, and a project-specific inquiry", async ({ page }) => {
  const project = projects.find((entry) => entry.id === "PinsAndNeedlesComedyWebsite");
  await page.goto("/work/");
  const card = page.locator(`.work-page-grid .seo-project-card[data-project-id="${project.id}"]`);
  await card.getByRole("link", { name: `See how it works: ${project.title}`, exact: true }).click();
  await expect(page).toHaveURL(/\/work\/pins-and-needles-comedy\/$/);
  await expect(page.locator("#overview .project-summary")).toHaveText(project.clientSummary);
  await expect(page.locator("#development .project-context")).toContainText(project.challenge);
  await expect(page.locator("#development .project-context")).toContainText(project.build);
  await expect(page.locator("#development .project-stack .tag")).toHaveText(project.stack);
  await expect(page.locator("#development").getByRole("link", { name: /source code on GitHub/ }))
    .toHaveAttribute("href", project.repoUrl);
  const inquiry = page.locator('.project-story-hero .page-actions a[href^="mailto:"]');
  const draft = new URL(await inquiry.getAttribute("href"));
  expect(draft.pathname).toBe("admin@customtechbuilt4u.com");
  expect(draft.searchParams.get("subject")).toBe(`Project inspired by ${project.title}`);
  expect(draft.searchParams.get("body")).toContain(`Source page: https://customtechbuilt4u.com/work/pins-and-needles-comedy/`);
  await expect(page.locator(".project-page-frame")).toHaveCount(project.gallery.length);
});
