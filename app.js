import {
  email,
  projects,
  featuredProjects,
  filterProjects,
} from "./projects.js";

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
    : `<div class="concept-preview" aria-hidden="true"><span class="preview-symbol">${project.id === "the-trip-handler" ? "⌁" : "◈"}</span><span class="preview-wordmark">${escape(project.title)}</span><span class="preview-caption">${project.id === "the-trip-handler" ? "PLAN / INVITE / GO" : "IDEA / PLAN / CREATE"}</span><div class="preview-route"><i></i><i></i><i></i></div></div>`;
  return `<article class="project-card"><button class="project-visual ${escape(project.tone || "sage")} ${project.portrait ? "portrait" : ""}" data-project="${escape(project.id)}" aria-label="Explore ${escape(project.title)}"><span class="visual-badge mono">${escape(project.badge || labels[project.category])}</span>${preview}<span class="preview-arrow" aria-hidden="true">↗</span></button><div class="project-meta"><span class="mono project-category">${labels[project.category]}</span><span class="mono project-id">${String(index + 1).padStart(2, "0")}</span></div><h3 class="project-title"><button data-project="${escape(project.id)}">${escape(project.title)}</button></h3><p class="project-description">${escape(project.summary)}</p><div class="project-tags">${tags(project.stack, 4)}</div><div class="project-links">${detailsButton(project, "Project details", "case-link")}${liveLink(project)}</div></article>`;
}

function archiveCard(project) {
  return `<article class="archive-card"><div class="project-meta"><span class="mono project-category">${labels[project.category]}</span><span class="project-id mono">↗</span></div><h3>${escape(project.title)}</h3><p>${escape(project.summary)}</p><div class="project-tags">${tags(project.stack, 4)}</div><div class="project-links">${detailsButton(project, "Explore", "case-link")}<a href="${escape(project.repoUrl)}" ${external}>Source <span aria-hidden="true">↗</span></a></div></article>`;
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

$("#archive-toggle").addEventListener("click", () => {
  const expanded =
    $("#archive-toggle").getAttribute("aria-expanded") !== "true";
  $("#archive-toggle").setAttribute("aria-expanded", String(expanded));
  $("#archive-toggle").innerHTML =
    `${expanded ? "Close project archive" : "Explore all projects"} <span aria-hidden="true">${expanded ? "−" : "+"}</span>`;
  $("#project-archive").hidden = !expanded;
});

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
  $("#dialog-content").innerHTML =
    `<p class="mono dialog-category">${labels[project.category]}</p><h2 id="dialog-title" class="dialog-title">${escape(project.title)}</h2><p class="dialog-summary">${escape(project.summary)}</p><div class="project-tags">${tags(project.stack)}</div>${image}<div class="dialog-detail"><h3>Inside the build</h3><ul>${project.features.map((item) => `<li>${escape(item)}</li>`).join("")}</ul></div>${project.notes ? `<p class="dialog-note">${escape(project.notes)}</p>` : ""}<div class="dialog-actions"><a class="button button-dark" href="${escape(project.repoUrl)}" ${external}>Explore the source <span aria-hidden="true">↗</span></a>${project.demoUrl ? `<a class="button button-outline" href="${escape(project.demoUrl)}" ${external}>${escape(project.demoLabel || "Visit live site")} <span aria-hidden="true">↗</span></a>` : ""}</div><p class="dialog-source">Want the architecture, setup, and trade-offs? <a href="${escape(source)}" ${external}>Read the project documentation ↗</a></p>`;
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
