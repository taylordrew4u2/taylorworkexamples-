import { clientCare } from "../client-care.js";
import { launchOffer, launchOfferPaymentTerms, launchOfferContentChangeTerms } from "../seo-offer.js";

export const pricing = {
  path: "/pricing/",
  title: "Website, App & Custom Software Pricing | 4u Digital",
  description: "Explore 4u Digital starting budgets for custom websites, focused web apps, Apple apps, business software, and separately agreed hourly work. Scope and total price are agreed before building.",
  heading: "Project pricing.",
  intro: "Starting budgets for a focused website, app, or business tool.",
  modified: "2026-10-27",
  currency: "USD",
  entries: [
    {
      id: "business-website", title: "Custom business website", amount: 1200, kind: "nyc-offer",
      summary: "Up to five pages, designed and built for phones first.",
      includes: ["Your services, menu, hours, location, and work", "A contact or request form", "Three months of content changes after launch"],
    },
    {
      id: "website-workflow", title: "Website + booking or ordering", amount: 1900, kind: "nyc-offer",
      summary: "The website, plus one complete customer workflow and a staff view.",
      includes: ["Appointment requests or a pickup-order flow", "Staff controls to review and manage requests", "The same website-offer benefits"],
    },
    {
      id: "web-app", title: "Focused web app", amount: 3750, kind: "starting-budget",
      summary: "One core user workflow, with accounts and shared data where agreed.",
      includes: ["The screens and access roles for that workflow", "A useful first version for phones and computers", "Additional workflows and integrations scoped separately"],
    },
    {
      id: "apple-app", title: "iPhone / iPad or Mac app", amount: 4750, kind: "starting-budget",
      summary: "One Apple platform and a focused first-release workflow.",
      includes: ["Native screens, testing, and release preparation", "Other platforms, backend, payments, or sync scoped separately", "Submission preparation; store approval is an external review"],
    },
    {
      id: "business-software", title: "Focused business software", amount: 4750, kind: "starting-budget",
      summary: "One defined staff workflow, specialist tool, or integration.",
      includes: ["A complete task with a result your team can check", "Data, access, and deployment needs agreed together", "Complex legacy systems, migration, or more workflows quoted separately"],
    },
    {
      id: "additional-work", title: "Additional work", amount: 70, kind: "hourly",
      summary: "Separately agreed improvements, updates, or additional project work.",
      includes: ["The work and hourly arrangement agreed in writing", "Included guarantee changes remain included", "Existing contracted support commitments still apply"],
    },
  ],
  budgetNote: "All figures are in USD. These are budgets for defined starting scopes, not blanket flat fees for an unlimited build. Your written quote confirms the included work, total price, and timeline.",
  runningCosts: "There is no required maintenance subscription. Any third-party costs—such as domain renewals, hosting, app-store accounts, payment processing, or other services—are discussed and agreed before the build.",
  websiteOffer: {
    compactEligibility: "NYC offers: first 10 eligible projects agreed by November 30, 2026. Subject to scope and capacity.",
    outsideOffer: "Outside the offer or need more? Websites are quoted for your scope.",
    eligibility: "The $1,200 and $1,900 website packages are for the first ten eligible New York City business projects agreed by November 30, 2026, subject to scope and capacity.",
    page: "/offer/",
    sections: launchOffer.sections,
    paymentTerms: launchOfferPaymentTerms,
    contentChangeTerms: launchOfferContentChangeTerms,
  },
  care: clientCare,
  hourlySupportExample: "If an optional six-month support agreement uses the $70 standard hourly rate, the 50% discount makes additional changes $35/hour during that arrangement. Your contract sets the actual coverage and arrangement.",
};
