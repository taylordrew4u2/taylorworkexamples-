import {
  email,
  projects,
  featuredProjects,
  filterProjects,
} from "./projects.js?v=5";

const $ = (selector) => document.querySelector(selector);
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
const external = 'target="_blank" rel="noopener noreferrer"';
function enquiryURL(topic = "general", reference = "") {
  const topics = {
    general: "website or app",
    website: "website",
    "web-app": "web application",
    ios: "iOS app",
  };
  const selected = topics[topic] || topics.general;
  const subjects = {
    general: "Website or app project",
    website: "Website project",
    "web-app": "Web application project",
    ios: "iOS app project",
  };
  const subject = reference
    ? `Project inspired by ${reference}`
    : subjects[topic] || subjects.general;
  const introduction = reference
    ? `I saw ${reference} in your portfolio and would like to discuss something similar.`
    : `I'm looking for help with ${topic === "ios" ? "an" : "a"} ${selected}.`;
  const body = `Hi Taylor,\n\n${introduction}\n\nCompany/project:\nWhat I need:\nExisting website (if any):\nTarget launch date:\n\nThanks!`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
document.querySelectorAll(".enquiry-link").forEach((link) => {
  link.href = enquiryURL(link.dataset.enquiry);
});
const labels = {
  web: "WEB DEVELOPMENT",
  ios: "NATIVE iOS",
  desktop: "DESKTOP & AUDIO",
  tools: "TOOLS & EXPERIMENTS",
};
const tags = (stack, limit = stack.length) =>
  stack
    .slice(0, limit)
    .map((item) => `<span class="tag">${escape(item)}</span>`)
    .join("");
const detailsButton = (project, text = "Project details", className = "") =>
  `<button type="button" class="${className}" data-project="${escape(project.id)}" aria-label="${escape(text)} for ${escape(project.title)}">${escape(text)} <span aria-hidden="true">↗</span></button>`;
const liveLink = (project) =>
  project.demoUrl
    ? `<a href="${escape(project.demoUrl)}" ${external}>${escape(project.demoLabel || "Live site")} <span aria-hidden="true">↗</span></a>`
    : "";

function featuredCard(project, index) {
  const preview = project.image
    ? `<img src="${escape(project.image)}" alt="${escape(project.imageAlt)}" width="${project.portrait ? 260 : 960}" height="${project.portrait ? 563 : 600}" loading="lazy" decoding="async">`
    : `<div class="concept-preview" aria-hidden="true">${escape(project.title)}</div>`;
  return `<article class="project-card"><button class="project-visual ${escape(project.tone)} ${project.portrait ? "portrait" : ""}" data-project="${escape(project.id)}" aria-label="Explore ${escape(project.title)}"><span class="visual-badge mono">${escape(project.badge || labels[project.category])}</span>${preview}<span class="preview-arrow" aria-hidden="true">↗</span></button><div class="project-meta"><span class="mono project-category">${escape(project.projectType || labels[project.category])}</span><span class="mono project-id">${String(index + 1).padStart(2, "0")}</span></div><h3 class="project-title"><button data-project="${escape(project.id)}">${escape(project.title)}</button></h3><p class="project-description">${escape(project.clientSummary || project.summary)}</p><div class="project-tags capability-tags" aria-label="Capabilities demonstrated">${tags(project.demonstrates || project.stack, 3)}</div><div class="project-links">${liveLink(project)}${detailsButton(project, "About this project", "case-link")}<a class="source-link" href="${escape(project.repoUrl)}" ${external}>Source code <span aria-hidden="true">↗</span></a></div></article>`;
}

function archiveCard(project) {
  return `<article class="archive-card"><div class="archive-description"><h3><button data-project="${escape(project.id)}">${escape(project.title)}</button></h3><p>${escape(project.summary)}</p></div><div><div class="project-meta"><span class="mono project-category">${labels[project.category]}</span></div><div class="project-tags">${tags(project.stack, 3)}</div></div><div class="project-links">${detailsButton(project, "Details", "case-link")}<a href="${escape(project.repoUrl)}" ${external}>Source <span aria-hidden="true">↗</span></a></div></article>`;
}

$("#featured-projects").innerHTML = featuredProjects.map(featuredCard).join("");
$("#year").textContent = new Date().getFullYear();

let activeFilter = "all";
function renderArchive() {
  const visible = filterProjects(
    projects,
    activeFilter,
    $("#project-search").value,
  );
  $("#archive-projects").innerHTML = visible.map(archiveCard).join("");
  $("#result-count").textContent =
    `${visible.length} OF ${projects.length} PROJECTS`;
  $("#empty-state").hidden = visible.length > 0;
}
renderArchive();

function setFilter(category) {
  activeFilter = category;
  document.querySelectorAll("[data-filter]").forEach((button) => {
    const selected = button.dataset.filter === category;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  renderArchive();
}
$(".filter-group").addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (button) setFilter(button.dataset.filter);
});
$("#project-search").addEventListener("input", renderArchive);
$("#clear-filters").addEventListener("click", () => {
  $("#project-search").value = "";
  setFilter("all");
  $("#project-search").focus();
});

const dialog = $("#project-dialog");
document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-project]");
  if (!trigger) return;
  const project = projects.find((item) => item.id === trigger.dataset.project);
  if (!project) return;
  const image = project.image
    ? `<div class="dialog-preview"><img src="${escape(project.image)}" alt="${escape(project.imageAlt)}"></div>`
    : "";
  const source =
    project.sources.find((url) => url.includes("/blob/")) || project.repoUrl;
  const caseStudy = project.challenge
    ? `<div class="dialog-case"><section><h3>The need</h3><p>${escape(project.challenge)}</p></section><section><h3>What I built</h3><p>${escape(project.build)}</p></section></div>`
    : "";
  const technical = `<div class="technical-content"><div class="project-tags">${tags(project.stack)}</div><ul>${project.features.map((item) => `<li>${escape(item)}</li>`).join("")}</ul><a class="text-link" href="${escape(project.repoUrl)}" ${external}>View source code <span aria-hidden="true">↗</span></a></div>`;
  $("#dialog-content").innerHTML =
    `<p class="mono dialog-category">${escape(project.projectType || labels[project.category])}</p><h2 id="dialog-title" class="dialog-title">${escape(project.title)}</h2><p class="dialog-summary">${escape(project.clientSummary || project.summary)}</p>${project.demonstrates ? `<div class="project-tags capability-tags">${tags(project.demonstrates)}</div>` : ""}${image}${caseStudy}<details class="technical-details"><summary>Technical details</summary>${technical}</details>${project.notes ? `<p class="dialog-note">${escape(project.notes)}</p>` : ""}<div class="dialog-actions"><a class="button button-dark project-enquiry" href="${escape(enquiryURL("general", project.title))}">Discuss something similar <span aria-hidden="true">↗</span></a>${project.demoUrl ? `<a class="button button-outline" href="${escape(project.demoUrl)}" ${external}>${escape(project.demoLabel || "See it live")} <span aria-hidden="true">↗</span></a>` : ""}</div><p class="dialog-source"><a href="${escape(source)}" ${external}>Project documentation ↗</a></p>`;
  dialog.showModal();
  dialog.scrollTop = 0;
});
$(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  )
    dialog.close();
});

const menuButton = $(".menu-toggle");
const navigation = $("#main-nav");
function closeMenu() {
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open navigation");
  navigation.classList.remove("is-open");
}
menuButton.addEventListener("click", () => {
  const expanded = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(expanded));
  menuButton.setAttribute(
    "aria-label",
    expanded ? "Close navigation" : "Open navigation",
  );
  navigation.classList.toggle("is-open", expanded);
});
navigation.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu();
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".site-header")) closeMenu();
});
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    menuButton.getAttribute("aria-expanded") === "true"
  ) {
    closeMenu();
    menuButton.focus();
  }
});
window.matchMedia("(min-width: 601px)").addEventListener("change", closeMenu);

let copyReset;
$("#copy-email").addEventListener("click", async () => {
  clearTimeout(copyReset);
  try {
    await navigator.clipboard.writeText(email);
    $("#copy-email").textContent = "COPIED ✓";
    $("#copy-status").textContent = "Email address copied to clipboard.";
  } catch {
    $("#copy-email").textContent = "SELECT EMAIL TO COPY";
    const selection = window.getSelection();
    const range = document.createRange();
    range.setStart($(".email-link").firstChild, 0);
    range.setEnd($(".email-link").firstChild, email.length);
    selection.removeAllRanges();
    selection.addRange(range);
    $("#copy-status").textContent =
      `Clipboard unavailable. Select and copy ${email}, or use the email link.`;
  }
  copyReset = setTimeout(() => {
    $("#copy-email").textContent = "COPY EMAIL";
  }, 3000);
});
