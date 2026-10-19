import { projects } from "./public-projects.js?v=44";
import { escape, external, projectIcon } from "./render-projects.js?v=44";

export const appStoreIds = ["The-Bit-Binder", "MyGigCalendar", "Open-Micer-Timer"];
export function publishedApps() {
  return appStoreIds.map((id) => projects.find((project) => project.id === id))
    .filter((project) => project?.demoLabel === "App Store" &&
      /^https:\/\/apps\.apple\.com\//.test(project.demoUrl || ""));
}

const capabilityCards = [
  { label: "CUSTOMER & TEAM WEB APPS", title: "A tool for customers and your team.",
    description: "Accounts, shared records, approvals, and connected payments. See how these projects bring everyday tasks into one place.",
    projects: ["the-trip-handler", "Bill-Spilt", "Showrunner-ICanRunAShow"] },
  { label: "BUSINESS WEBSITES", title: "A clear home for your business.",
    description: "Show what you offer, update your content, and give customers a way to get in touch. Explore websites with tools for the people running them.",
    projects: ["PinsAndNeedlesComedyWebsite", "tlcmassagewellness"] },
  { label: "DESKTOP SOFTWARE", title: "Software for the way you work.",
    description: "Explore Mac dictation and desktop audio tools, with real interface images and an explanation of what each project does.",
    projects: ["dictype", "usbmic"] },
];

export function renderRangeProof() {
  const apps = publishedApps();
  const links = (ids) => ids.map((id) => projects.find((project) => project.id === id)).filter(Boolean)
    .map((project) => `<a href="${escape(project.caseUrl)}">${escape(project.title)} <span aria-hidden="true">↗</span></a>`).join("");
  return `<div class="range-proof-heading"><p class="eyebrow">WEBSITES · APPS · SOFTWARE</p><h3>Find a starting point for your business.</h3><p>Explore published iPhone and iPad apps, websites, browser tools, and desktop software. Each example shows what it does and how it was built.</p></div><div class="range-proof-grid"><article id="app-store-proof" class="range-card range-store"><p class="eyebrow">${apps.length} PUBLISHED iOS APPS</p><h4>On the App Store.</h4><p>Explore iPhone and iPad apps published on Apple’s App Store.</p><ul class="range-apps">${apps.map((project) => `<li>${projectIcon(project)}<div><a class="range-app-title" href="${escape(project.caseUrl)}">${escape(project.title)}</a><a class="range-store-link" href="${escape(project.demoUrl)}" ${external} aria-label="View ${escape(project.title)} on the App Store">View on the App Store <span aria-hidden="true">↗</span></a></div></li>`).join("")}</ul></article>${capabilityCards.map((card) => `<article class="range-card"><p class="eyebrow">${escape(card.label)}</p><h4>${escape(card.title)}</h4><p>${escape(card.description)}</p><nav class="range-project-links" aria-label="${escape(card.label.toLowerCase())} examples">${links(card.projects)}</nav></article>`).join("")}</div>`;
}
