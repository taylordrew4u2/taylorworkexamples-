import test from "node:test";
import assert from "node:assert/strict";
import { pricing } from "../content/pricing.js";
import { clientCare } from "../client-care.js";
import { launchOffer, launchOfferPaymentTerms, launchOfferContentChangeTerms } from "../seo-offer.js";

test("pricing distinguishes the limited website offers, focused starting scopes, and additional hourly work", () => {
  assert.equal(pricing.path, "/pricing/");
  assert.equal(pricing.currency, "USD");
  assert.deepEqual(pricing.entries.map(({ amount }) => amount), [1200, 1900, 3750, 4750, 4750, 70]);
  assert.deepEqual(pricing.entries.map(({ kind }) => kind), ["nyc-offer", "nyc-offer", "starting-budget", "starting-budget", "starting-budget", "hourly"]);
  assert.match(pricing.entries.find(({ id }) => id === "web-app").summary, /one core user workflow/i);
  const apple = pricing.entries.find(({ id }) => id === "apple-app");
  assert.match(apple.summary, /one Apple platform/i);
  assert.match(apple.includes.join(" "), /store approval is an external review/i);
  assert.match(pricing.entries.find(({ id }) => id === "business-software").summary, /one defined staff workflow/i);
  const hourly = pricing.entries.find(({ id }) => id === "additional-work");
  assert.match(hourly.summary, /separately agreed/i);
  assert.match(hourly.includes.join(" "), /included guarantee changes remain included/i);
  assert.match(pricing.budgetNote, /total price.*timeline/i);
  assert.match(pricing.runningCosts, /no required maintenance subscription/i);
});

test("pricing preserves the original NYC offer and shared refund, change, ownership, and support commitments", () => {
  assert.equal(pricing.websiteOffer.sections, launchOffer.sections);
  assert.equal(pricing.websiteOffer.paymentTerms, launchOfferPaymentTerms);
  assert.equal(pricing.websiteOffer.contentChangeTerms, launchOfferContentChangeTerms);
  assert.match(pricing.websiteOffer.eligibility, /first ten eligible New York City business projects agreed by November 30, 2026, subject to scope and capacity/);
  assert.equal(launchOffer.validUntil, "2026-11-30");
  assert.equal(Number(launchOffer.price), pricing.entries[0].amount);
  assert.equal(pricing.care, clientCare);
  assert.match(pricing.care.guarantee.text, /full refund.*within 30 days after it launches/i);
  assert.match(pricing.care.changes.text, /reasonable changes are included/i);
  assert.match(pricing.care.support.text, /50% discount on the agreed standard rate/i);
  assert.match(pricing.care.handover.text, /custom code is 100% yours/i);
  assert.match(pricing.hourlySupportExample, /^If an optional six-month support agreement uses the \$70 standard hourly rate/);
  assert.match(pricing.hourlySupportExample, /\$35\/hour/);
});
