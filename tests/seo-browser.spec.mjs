import { test, expect } from "@playwright/test";
import { projects } from "../public-projects.js";
import { services, guide, projectSlugs } from "../seo-content.js";

test.use({ javaScriptEnabled: false });

async function linkTo(page, pathname) {
  const links = page.locator("a[href]");
  const index = await links.evaluateAll((elements, target) => elements.findIndex((element) =>
    new URL(element.getAttribute("href"), location.href).pathname === target), pathname);
  expect(index, `A real navigation link reaches ${pathname}`).toBeGreaterThanOrEqual(0);
  return links.nth(index);
}

async function expectPageFit(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    "The complete page fits the viewport").toBe(true);
  const controls = await page.locator(".page-nav a, .breadcrumbs, .page-actions a").evaluateAll((elements) =>
    elements.every((element) => {
      const box = element.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && box.left >= -1 && box.right <= window.innerWidth + 1;
    }));
  expect(controls, "Navigation and inquiry controls stay readable inside the viewport").toBe(true);
}

async function expectOriginalImage(image, frame) {
  await image.scrollIntoViewIfNeeded();
  await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
  await expect(image).toHaveAttribute("alt", frame.imageAlt);
  await expect(image).toHaveAttribute("width", String(frame.width));
  await expect(image).toHaveAttribute("height", String(frame.height));
  await expect(image).toHaveCSS("object-fit", "contain");
  await expect(image).toHaveCSS("filter", "none");
  await expect(image).toHaveCSS("mix-blend-mode", "normal");
  await expect(image).toHaveCSS("opacity", "1");
  const geometry = await image.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const figure = element.closest("figure").getBoundingClientRect();
    return {
      source: new URL(element.getAttribute("src"), location.href).pathname,
      width: element.naturalWidth, height: element.naturalHeight,
      fits: box.width > 0 && box.height > 0 && box.left >= figure.left - 1 && box.right <= figure.right + 1 &&
        box.top >= figure.top - 1 && box.bottom <= figure.bottom + 1,
    };
  });
  expect(geometry.source).toBe(`/${frame.image.replace(/^\.\//, "")}`);
  expect(geometry.width).toBe(frame.width);
  expect(geometry.height).toBe(frame.height);
  expect(geometry.fits, "The full original remains inside its figure").toBe(true);
}

test("the homepage exposes the portfolio and project navigation without JavaScript", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("You know your business. I’ll build the technology.");
  await expect(page.locator("#featured-projects .project-card")).toHaveCount(6);
  await expect(page.locator("#archive-projects .archive-card")).toHaveCount(projects.length);
  await expect(page.locator(".owner-credit")).toHaveCount(0);
  await page.locator(".archive-disclosure summary").click();
  await expect(page.locator(".archive-disclosure")).toHaveAttribute("open", "");
  const project = projects.find((entry) => entry.id === "Bill-Spilt");
  const story = page.locator(`.archive-card[data-showcase-id="${project.id}"] .case-page-link`);
  await expect(story).toBeVisible();
  await story.click();
  await expect(page).toHaveURL(new RegExp(`/work/${projectSlugs[project.id]}/$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(project.title);
  const portfolio = await linkTo(page, "/work/");
  await portfolio.click();
  await expect(page.locator(".work-page-grid .seo-project-card")).toHaveCount(projects.length);
  await expectPageFit(page);
});

test("a service page leads to relevant project proof and a complete business inquiry without JavaScript", async ({ page }) => {
  const service = services.find((entry) => entry.slug === "website-development");
  const project = projects.find((entry) => entry.id === service.projectIds[0]);
  await page.goto("/");
  const serviceLink = await linkTo(page, `/services/${service.slug}/`);
  await serviceLink.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(service.heading);
  await expectPageFit(page);
  const proof = await linkTo(page, `/work/${projectSlugs[project.id]}/`);
  await proof.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(project.title);
  await expect(page.getByRole("link", { name: `${project.title} source code on GitHub`, exact: false })).toHaveAttribute("href", project.repoUrl);
  const inquiry = page.locator(".page-actions a[href^='mailto:']");
  await expect(inquiry).toBeVisible();
  const draft = new URL(await inquiry.getAttribute("href"));
  expect(draft.pathname).toBe("admin@customtechbuilt4u.com");
  expect(draft.searchParams.get("subject")).toBe(`Project inspired by ${project.title}`);
  expect(draft.searchParams.get("body")).toContain("The problem:");
  expect(draft.searchParams.get("body")).toContain("Who will use it:");
  await expectPageFit(page);
});

test("a project case preserves authentic cover and paired captures with native gallery controls", async ({ page }) => {
  const project = projects.find((entry) => entry.id === "Showrunner-ICanRunAShow");
  await page.goto(`/work/${projectSlugs[project.id]}/`);
  const cover = page.locator(".project-page-gallery > figure");
  await expectOriginalImage(cover.locator("img"), project.gallery[0]);
  await expect(cover.locator("figcaption p")).toHaveText(project.gallery[0].caption);
  const native = project.gallery.find((frame) => frame.label === "Workspace & cues");
  const details = page.locator(".project-gallery-detail").filter({ has: page.locator("summary", { hasText: native.label }) });
  const summary = details.locator("summary");
  await summary.scrollIntoViewIfNeeded();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(details).toHaveAttribute("open", "");
  await expect(summary).toBeFocused();
  await expect(details.locator("img")).toHaveCount(2);
  await expectOriginalImage(details.locator("img").nth(0), native);
  await expectOriginalImage(details.locator("img").nth(1), native.companion);
  await expect(details.locator("figcaption p")).toHaveText(native.caption);
  const original = details.getByRole("link", { name: "Open full-size image", exact: false });
  expect(new URL(await original.getAttribute("href"), page.url()).pathname).toBe(`/${native.image.replace(/^\.\//, "")}`);
  await expect(original).toHaveAttribute("target", "_blank");
  await expect(original).toHaveAttribute("rel", /noopener/);
  await expectPageFit(page);
});

test("the comparison guide, business information, and contact remain usable without JavaScript", async ({ page }) => {
  await page.goto("/guides/website-or-app/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(guide.title);
  await expect(page.locator(".table-scroll table tbody tr")).toHaveCount(4);
  await expectPageFit(page);
  const about = await linkTo(page, "/about/");
  await about.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("You know your business. I’ll build the technology.");
  await expect(page.locator("main")).not.toContainText(/Taylor Drew|stand-up biography/i);
  await expectPageFit(page);
  const contact = await linkTo(page, "/contact/");
  await contact.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What would you like to build?");
  for (const link of await page.locator("main a[href^='mailto:']").all()) {
    expect(new URL(await link.getAttribute("href")).pathname).toBe("admin@customtechbuilt4u.com");
  }
  await expectPageFit(page);
});
