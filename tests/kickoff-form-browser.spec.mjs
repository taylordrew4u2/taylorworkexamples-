import { test, expect } from "@playwright/test";

const route = "/project-kickoff/";
const recipient = "admin@customtechbuilt4u.com";
const source = `Source page: https://customtechbuilt4u.com${route}`;
const brief = {
  company: "Juniper Salon",
  contactName: "Jordan Client",
  contactEmail: "jordan@example.com",
  projectName: "Client booking portal",
  problem: "Clients currently call to find available appointments.",
  workflow: "Choose a service and stylist, then request an appointment.",
  included: "Service list, staff availability, and appointment requests.",
  excluded: "Loyalty points can wait until a later version.",
  success: "A client can request a service without calling the salon.",
  approver: "Jordan gives final approval; Alex reviews the staff calendar.",
  feedback: "One shared list of feedback after each agreed review.",
  assets: "Jordan will supply approved service descriptions and photographs.",
  accounts: "The salon owns the domain and will arrange an account invitation.",
  budget: "Please discuss options around $5,000.",
  targetDate: "Discuss a launch before the winter booking season.",
  handover: "Include an editing guide and agree maintenance separately.",
};

function field(page, name) {
  return page.locator(`#kickoff-form [name="${name}"]`);
}

async function fillBrief(page, values = brief) {
  for (const [name, value] of Object.entries(values)) await field(page, name).fill(value);
}

async function reviewBrief(page) {
  await page.locator("#kickoff-form").getByRole("button", { name: "Review your brief", exact: true }).click();
  await expect(page.locator("#kickoff-review")).toBeVisible();
  return page.locator("#kickoff-summary").inputValue();
}

async function downloadBrief(page) {
  const pendingDownload = page.waitForEvent("download");
  await page.locator("#kickoff-download").click();
  const download = await pendingDownload;
  expect(download.suggestedFilename()).toMatch(/\.txt$/i);
  const stream = await download.createReadStream();
  expect(stream, "The complete brief is available as a text download").not.toBeNull();
  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

async function expectFormFit(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    "The kickoff form fits the page on this device").toBe(true);
  const controlsFit = await page.locator("#kickoff-form, #kickoff-review")
    .locator("input, textarea, button, a").evaluateAll(elements => elements
      .filter(element => element.getClientRects().length > 0)
      .every(element => {
        const bounds = element.getBoundingClientRect();
        return bounds.width > 0 && bounds.left >= -1 && bounds.right <= window.innerWidth + 1;
      }));
  expect(controlsFit, "Visible kickoff fields and review actions fit the viewport").toBe(true);
}

test("clients can fill in the kickoff form with native required-field and email validation", async ({ page }) => {
  await page.goto(route);
  const form = page.locator("#kickoff-form");
  await expect(form).toBeVisible();
  await expect(page).toHaveTitle(/Project Kickoff.*4u Digital/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("A clear plan before the build.");
  for (const name of ["company", "contactName", "contactEmail", "problem"]) {
    await expect(field(page, name)).toHaveAttribute("required", "");
  }
  await expect(field(page, "contactEmail")).toHaveAttribute("type", "email");
  await form.getByRole("button", { name: "Review your brief", exact: true }).click();
  await expect(page.locator("#kickoff-review")).toBeHidden();
  await expect(field(page, "company")).toBeFocused();

  await fillBrief(page, {
    company: brief.company, contactName: brief.contactName,
    contactEmail: "not-an-email", problem: brief.problem,
  });
  await form.getByRole("button", { name: "Review your brief", exact: true }).click();
  expect(await field(page, "contactEmail").evaluate(element => element.validity.typeMismatch)).toBe(true);
  await expect(field(page, "contactEmail")).toBeFocused();
  await expect(page.locator("#kickoff-review")).toBeHidden();

  await field(page, "contactEmail").fill(brief.contactEmail);
  const summary = await reviewBrief(page);
  expect(summary).toContain(brief.company);
  expect(summary).toContain(brief.problem);
  await expectFormFit(page);
});

test("the review, email, copy, and download retain the complete client brief without sending it", async ({ page }) => {
  await page.addInitScript(() => {
    window.kickoffCopiedText = null;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async value => { window.kickoffCopiedText = value; } },
    });
  });
  await page.goto(route);
  const sentRequests = [];
  page.on("request", request => {
    if (!["GET", "HEAD"].includes(request.method())) sentRequests.push(request.url());
  });
  await fillBrief(page);
  const summary = await reviewBrief(page);
  await expect(page.locator("#kickoff-summary")).toHaveAttribute("readonly", "");
  expect(summary).toContain(`To: ${recipient}`);
  expect(summary).toMatch(/Subject: .*4u Digital.*kickoff/i);
  expect(summary).toContain(source);
  for (const value of Object.values(brief)) expect(summary).toContain(value);

  const email = page.locator("#kickoff-email");
  await expect(email).toBeVisible();
  const draft = new URL(await email.getAttribute("href"));
  expect(draft.protocol).toBe("mailto:");
  expect(draft.pathname).toBe(recipient);
  expect(draft.searchParams.get("subject")).toMatch(/4u Digital.*kickoff/i);
  expect(draft.searchParams.get("body")).toContain(source);
  for (const value of Object.values(brief)) expect(draft.searchParams.get("body")).toContain(value);

  await page.locator("#kickoff-copy").click();
  expect(await page.evaluate(() => window.kickoffCopiedText)).toBe(summary);
  expect(await downloadBrief(page)).toBe(summary);
  expect(sentRequests, "Reviewing, copying, and downloading do not submit the client's answers").toEqual([]);
  await expectFormFit(page);
});

test("editing an answer invalidates the old review while keeping the client's answers", async ({ page }) => {
  await page.goto(route);
  await fillBrief(page);
  const firstSummary = await reviewBrief(page);
  const changedProblem = "Customers need to request group appointments without a phone call.";
  await field(page, "problem").fill(changedProblem);
  await expect(page.locator("#kickoff-review")).toBeHidden();
  await expect(page.locator("#kickoff-email")).toBeHidden();
  for (const [name, value] of Object.entries(brief)) {
    await expect(field(page, name)).toHaveValue(name === "problem" ? changedProblem : value);
  }
  const updatedSummary = await reviewBrief(page);
  expect(updatedSummary).not.toBe(firstSummary);
  expect(updatedSummary).toContain(changedProblem);
  expect(updatedSummary).not.toContain(brief.problem);
  expect(await downloadBrief(page)).toBe(updatedSummary);
});

test("a denied clipboard leaves the complete review selected for manual copying", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => { throw new Error("Clipboard unavailable for kickoff test"); } },
    });
  });
  await page.goto(route);
  await fillBrief(page);
  const summary = await reviewBrief(page);
  await page.locator("#kickoff-copy").click();
  const textarea = page.locator("#kickoff-summary");
  await expect(textarea).toHaveValue(summary);
  await expect(textarea).toBeFocused();
  expect(await textarea.evaluate(element => ({ start: element.selectionStart, end: element.selectionEnd })))
    .toEqual({ start: 0, end: summary.length });
  await expect(page.locator("#kickoff-status")).toContainText(/select|manually|yourself/i);
  await expect(page.locator("#kickoff-status")).not.toContainText(/brief copied|copied to (?:your |the )?clipboard/i);
});

test("long answers stay complete in copy and download when they exceed email-link capacity", async ({ page }) => {
  await page.addInitScript(() => {
    window.kickoffCopiedText = null;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async value => { window.kickoffCopiedText = value; } },
    });
  });
  await page.goto(route);
  const longBrief = {
    ...brief,
    problem: `Start of problem ${"—".repeat(700)} End of problem.`,
    workflow: `Start of workflow ${"→".repeat(700)} End of workflow.`,
  };
  await fillBrief(page, longBrief);
  const summary = await reviewBrief(page);
  expect(encodeURIComponent(summary).length).toBeGreaterThan(6000);
  for (const value of Object.values(longBrief)) expect(summary).toContain(value);
  await expect(page.locator("#kickoff-email")).toBeHidden();
  await expect(page.locator("#kickoff-review")).toContainText(/too long|longer|copy|download/i);
  await page.locator("#kickoff-copy").click();
  expect(await page.evaluate(() => window.kickoffCopiedText)).toBe(summary);
  expect(await downloadBrief(page)).toBe(summary);
  await expectFormFit(page);
});
