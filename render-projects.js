import { bookingURL } from "./booking.js?v=50";
import { email } from "./public-projects.js?v=50";
import { addInquirySource } from "./contact-context.js?v=50";

export const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
export const external = 'target="_blank" rel="noopener noreferrer"';
export function enquiryURL(topic = "general", reference = "", source = "/") {
  if (topic === "consultation") return bookingURL;
  const topics = {
    general: "website, app, or business software",
    website: "website",
    "web-app": "web application",
    ios: "iOS app",
    software: "custom app or business software",
    salon: "salon booking website or app",
    restaurant: "restaurant ordering website or app",
  };
  const selected = topics[topic] || topics.general;
  const subjects = {
    general: "Website, app, or software project",
    website: "Website project",
    "web-app": "Web application project",
    ios: "iOS app project",
    software: "Custom app or software project",
    salon: "Salon booking project",
    restaurant: "Restaurant ordering project",
  };
  const subject = reference
    ? `Project inspired by ${reference}`
    : subjects[topic] || subjects.general;
  const introduction = reference
    ? `I saw ${reference} in your portfolio and would like to discuss something similar.`
    : `I'm looking for help with ${topic === "ios" ? "an" : "a"} ${selected}.`;
  const body = `Hi 4u Digital,\n\n${introduction}\n\nCompany/project:\nThe problem:\nWho will use it:\nWhat I need:\nExisting website (if any):\nBudget range (if known):\nTarget launch date:\n\nThanks!`;
  return addInquirySource(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, source);
}

export function projectIcon(project) {
  return `<span class="project-icon-frame" aria-hidden="true">${project.icon
    ? `<img class="project-icon" src="${escape(project.icon)}" alt="" width="${project.iconWidth}" height="${project.iconHeight}" loading="lazy" decoding="async">`
    : `<span class="project-initials">${escape(project.iconFallback || project.title.slice(0, 2))}</span>`}</span>`;
}
