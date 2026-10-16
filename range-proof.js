import { projects } from "./public-projects.js?v=38";
import { escape, external, projectIcon } from "./render-projects.js?v=38";

export const appStoreIds = ["The-Bit-Binder", "MyGigCalendar", "Open-Micer-Timer"];
export function publishedApps() {
  return appStoreIds.map((id) => projects.find((project) => project.id === id))
    .filter((project) => project?.demoLabel === "App Store" &&
      /^https:\/\/apps\.apple\.com\//.test(project.demoUrl || ""));
}

const capabilityCards = [
  { label: "FULL-STACK WEB PLATFORMS", title: "The interface and the systems behind it.",
    description: "Customer and team accounts, access rules, shared records, approvals, and payment integrations. Explore how complete applications fit those parts together.",
    projects: ["the-trip-handler", "Bill-Spilt", "Showrunner-ICanRunAShow"] },
  { label: "BUSINESS WEBSITES", title: "Public websites with useful working tools.",
    description: "Clear customer-facing pages, editable content, inquiry flows, and controls for the people running the business.",
    projects: ["PinsAndNeedlesComedyWebsite", "tlcmassagewellness"] },
  { label: "DESKTOP SOFTWARE", title: "Native Mac apps and desktop audio tools.",
    description: "Explore native dictation and multitrack audio development, with original interface captures and the engineering context behind each project.",
    projects: ["dictype", "usbmic"] },
];

export function renderRangeProof() {
  const apps = publishedApps();
  const links = (ids) => ids.map((id) => projects.find((project) => project.id === id)).filter(Boolean)
    .map((project) => `<a href="${escape(project.caseUrl)}">${escape(project.title)} <span aria-hidden="true">↗</span></a>`).join("");
  return `<div class="range-proof-heading"><p class="eyebrow">NATIVE APPS · WEB · DESKTOP</p><h3>Built across devices. From interface to backend.</h3><p>Published iPhone and iPad apps, full-stack web platforms, business websites, and desktop software. See the products and the development behind them.</p></div><div class="range-proof-grid"><article id="app-store-proof" class="range-card range-store"><p class="eyebrow">${apps.length} PUBLISHED iOS APPS</p><h4>On the App Store.</h4><p>Real iPhone and iPad products you can explore on Apple’s App Store.</p><ul class="range-apps">${apps.map((project) => `<li>${projectIcon(project)}<div><a class="range-app-title" href="${escape(project.caseUrl)}">${escape(project.title)}</a><a class="range-store-link" href="${escape(project.demoUrl)}" ${external} aria-label="View ${escape(project.title)} on the App Store">View on the App Store <span aria-hidden="true">↗</span></a></div></li>`).join("")}</ul></article>${capabilityCards.map((card) => `<article class="range-card"><p class="eyebrow">${escape(card.label)}</p><h4>${escape(card.title)}</h4><p>${escape(card.description)}</p><nav class="range-project-links" aria-label="${escape(card.label.toLowerCase())} examples">${links(card.projects)}</nav></article>`).join("")}</div>`;
}
