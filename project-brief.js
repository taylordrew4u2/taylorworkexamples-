import { briefSteps, briefFields, normalizeBrief, formatBriefText } from "./project-brief-schema.js";
import { briefEndpoint, briefPublishableKey } from "./project-brief-config.js";
import { briefPalettes, paletteAnswerPrefix, formatPaletteAnswer, parsePaletteAnswer } from "./project-brief-palettes.js";

const draftKey = "4u-digital-project-brief-v1";
const maxFiles = 6;
const maxFileBytes = 5 * 1024 * 1024;
const maxTotalBytes = 8 * 1024 * 1024;
const permittedFiles = new Map([["image/jpeg", /\.jpe?g$/i], ["image/png", /\.png$/i], ["image/webp", /\.webp$/i], ["application/pdf", /\.pdf$/i]]);
const initialized = new WeakSet();
const text = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
const fileSize = (bytes) => bytes < 1024 * 1024 ? `${Math.max(1, Math.ceil(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export function validateBriefFiles(existing, incoming) {
  const files = [...existing];
  const accepted = [];
  const errors = [];
  for (const file of incoming) {
    if (files.some((previous) => previous.name === file.name && previous.size === file.size && previous.lastModified === file.lastModified)) continue;
    const extension = permittedFiles.get(file.type);
    if (!extension || !extension.test(file.name)) { errors.push(`${file.name}: use JPG, PNG, WebP, or PDF. For HEIC, export a JPEG or share a view-only folder link instead.`); continue; }
    if (!file.size) { errors.push(`${file.name}: this file is empty. Please choose another copy.`); continue; }
    if (file.size > maxFileBytes) { errors.push(`${file.name}: over 5 MB. Export a smaller copy or share a view-only folder link.`); continue; }
    if (files.length >= maxFiles) { errors.push(`You can add up to ${maxFiles} files. Remove one first, or share a folder link.`); continue; }
    if (files.reduce((total, previous) => total + previous.size, 0) + file.size > maxTotalBytes) { errors.push(`${file.name}: this would exceed the 8 MB combined limit. Use a smaller copy or share a folder link.`); continue; }
    accepted.push(file);
    files.push(file);
  }
  return { accepted, errors };
}

export function initProjectBrief(doc = document) {
  const form = doc.querySelector("#project-brief-form");
  if (!form || initialized.has(form)) return false;
  const win = doc.defaultView;
  const get = (id) => doc.getElementById(id);
  const panels = [...form.querySelectorAll("[data-brief-step]")];
  const reviewPanel = get("brief-review");
  const status = get("brief-status");
  const saveDraft = get("brief-save-draft");
  const fieldsById = new Map(briefFields.map((field) => [field.id, field]));
  if (!win || panels.length !== briefSteps.length || !reviewPanel || !status || !saveDraft) return false;
  initialized.add(form);
  let stepIndex = 0;
  let questionId = "projectType";
  let editingReview = false;
  let busy = false;
  let submitted = false;
  let startedAt = new Date().toISOString();
  let requestId = win.crypto.randomUUID();
  let attemptedFingerprint = null;
  let files = [];
  let draftTimer;
  let downloadText = "";
  let selectedPalette = null;
  let receiptReference = "";

  const controlsFor = (id) => [...form.querySelectorAll(`[data-brief-field="${id}"]`)];
  const applicable = (field, type) => !field.projectTypes || field.projectTypes.includes(type);
  const rawAnswers = () => Object.fromEntries(briefFields.map((field) => {
    const controls = controlsFor(field.id);
    const value = field.type === "checkboxes" ? controls.filter((control) => control.checked).map((control) => control.value)
      : field.type === "radio" ? controls.find((control) => control.checked)?.value || ""
      : field.type === "colors" ? formatPaletteAnswer(selectedPalette, controls[0]?.value || "")
      : controls[0]?.value || "";
    return [field.id, value];
  }));
  const meaningful = (value) => Array.isArray(value) ? value.length > 0 : Boolean(String(value || "").trim());

  function announce(message, { error = false, focus = false } = {}) {
    status.hidden = !message;
    status.textContent = message;
    status.setAttribute("role", error ? "alert" : "status");
    if (focus && message) { status.tabIndex = -1; status.focus({ preventScroll: true }); status.scrollIntoView({ block: "nearest", behavior: "auto" }); }
  }

  function clearErrors() {
    form.querySelectorAll("[aria-invalid]").forEach((control) => control.removeAttribute("aria-invalid"));
    form.querySelectorAll(".brief-field-error").forEach((error) => { if (error.id !== "brief-file-error") { error.hidden = true; error.textContent = ""; } });
  }

  function showFieldError(id, message) {
    const field = fieldsById.get(id);
    if (field) {
      const index = briefSteps.findIndex((step) => step.id === field.stepId);
      editingReview = false;
      questionId = id;
      navigate(index, { validate: false, preserveQuestion: true });
      const container = form.querySelector(`[data-field-container="${id}"]`);
      let disclosure = container?.closest("details");
      while (disclosure) { disclosure.open = true; disclosure = disclosure.parentElement?.closest("details"); }
      const error = get(`brief-${id}-error`);
      if (error) { error.textContent = message; error.hidden = false; }
      const controls = controlsFor(id);
      controls.forEach((control) => control.setAttribute("aria-invalid", "true"));
      controls[0]?.focus({ preventScroll: true });
      container?.scrollIntoView({ behavior: "auto", block: "center" });
    }
    announce(message, { error: true });
  }

  function updateVisibility() {
    const answers = rawAnswers();
    for (const field of briefFields) {
      const visible = applicable(field, answers.projectType);
      const container = form.querySelector(`[data-field-container="${field.id}"]`);
      if (container) container.hidden = !visible || field.id !== questionId;
      controlsFor(field.id).forEach((control) => { control.disabled = busy || !visible; });
    }
    form.querySelectorAll(".brief-advanced").forEach((details) => {
      details.hidden = ![...details.querySelectorAll("[data-field-container]")].some((container) => !container.hidden);
    });
    form.querySelectorAll("[data-brief-field-group]").forEach((group) => {
      group.hidden = ![...group.querySelectorAll("[data-field-container]")].some((container) => !container.hidden);
    });
    for (const extra of form.querySelectorAll(".brief-upload, .brief-media-email")) extra.hidden = questionId !== "__files";
    form.querySelectorAll(".brief-advanced").forEach(details => { details.open = true; });
    form.querySelectorAll("[data-brief-field-group]").forEach(group => { if (group.tagName === "DETAILS") group.open = true; });
    form.querySelectorAll(".brief-social-row").forEach(row => { row.hidden = row.querySelector("[data-field-container]").hidden; });
    updateMediaEmailLinks();
    const answeredCount = briefFields.filter((field) => applicable(field, answers.projectType) && meaningful(answers[field.id])).length;
    get("brief-answered-count").textContent = answeredCount ? `${answeredCount} ${answeredCount === 1 ? "answer" : "answers"} shared. The rest can wait.` : "Make it yours, one step at a time.";
    briefSteps.forEach((step, index) => {
      const button = form.querySelector(`[data-brief-go="${index}"]`);
      const answered = step.fields.some((id) => applicable(fieldsById.get(id), answers.projectType) && meaningful(answers[id]));
      const check = button?.querySelector(".brief-step-check");
      if (check) check.textContent = answered ? "✓" : "";
    });
  }

  function persistDraft() {
    win.clearTimeout(draftTimer);
    if (!saveDraft.checked || submitted) return;
    try {
      win.localStorage.setItem(draftKey, JSON.stringify({ version: 1, answers: rawAnswers(), step: stepIndex, question: questionId, hadFiles: files.length > 0, savedAt: new Date().toISOString() }));
      get("brief-draft-status").textContent = files.length ? "Answers saved on this device. Files are not saved; reselect them after a reload." : "Answers saved on this device. Files are never saved. Remove this draft when using a shared device.";
      get("brief-remove-draft").hidden = false;
    } catch {
      saveDraft.checked = false;
      get("brief-draft-status").textContent = "This browser could not save a draft. Keep this page open, or copy your answers before leaving.";
      get("brief-remove-draft").hidden = true;
    }
  }

  function removeDraft() {
    win.clearTimeout(draftTimer);
    try { win.localStorage.removeItem(draftKey); } catch { /* Storage can be disabled by the visitor. */ }
    saveDraft.checked = false;
    get("brief-remove-draft").hidden = true;
    get("brief-draft-status").textContent = "Draft saving is off. Answers stay on this page until you leave or refresh. Files are never saved by the form.";
  }

  function changed() {
    if (attemptedFingerprint) { requestId = win.crypto.randomUUID(); attemptedFingerprint = null; }
    clearErrors();
    announce("");
    updateVisibility();
    renderColorSwatches();
    renderPaletteSelection();
    win.clearTimeout(draftTimer);
    if (saveDraft.checked) draftTimer = win.setTimeout(persistDraft, 350);
  }

  const coreQuestions = new Set(["projectType", "websiteFor", "businessName", "idea", "websitePurpose", "appCapabilities", "softwareTasks", "brandMood", "colors", "referenceUrl1", "referenceNotes1", "budgetRange", "timing", "contactName", "contactEmail"]);

  function questionPath() {
    const type = rawAnswers().projectType;
    const extra = get("brief-extra-questions").checked;
    return briefSteps.flatMap(step => [
      ...step.fields.filter(id => { const field = fieldsById.get(id); return applicable(field, type) && (coreQuestions.has(id) || extra || meaningful(rawAnswers()[id]) || id === questionId); }),
      ...(step.id === "assets" ? ["__files"] : [])
    ]);
  }

  function validateStep() {
    const field = fieldsById.get(questionId);
    if (!field?.required) return true;
    const value = rawAnswers()[questionId];
    if (!meaningful(value)) { showFieldError(questionId, field.type === "radio" ? "Please choose an option." : `Please enter ${questionId === "contactName" ? "your name" : "your email address"}.`); return false; }
    if (field.type === "email" && !controlsFor(questionId)[0].checkValidity()) { showFieldError(questionId, "Please enter a valid email address so I can reply."); return false; }
    return true;
  }

  function goQuestion(id, { focus = true } = {}) {
    questionId = id;
    stepIndex = id === "__files" ? briefSteps.findIndex(step => step.id === "assets") : briefSteps.findIndex(step => step.fields.includes(id));
    announce(""); updateVisibility(); updateNavigation({ focus });
    form.querySelector(".brief-section-menu").open = false;
  }

  function advance() {
    if (!validateStep()) return;
    const path = questionPath();
    const next = path[path.indexOf(questionId) + 1];
    if (next) goQuestion(next); else renderReview();
  }

  function updateNavigation({ focus = true } = {}) {
    const reviewing = stepIndex === briefSteps.length;
    panels.forEach((panel, index) => { panel.hidden = index !== stepIndex; });
    reviewPanel.hidden = !reviewing;
    get("brief-back").hidden = !reviewing && questionId === "projectType";
    get("brief-next").hidden = reviewing;
    get("brief-send").hidden = !reviewing;
    get("brief-skip").hidden = reviewing || Boolean(fieldsById.get(questionId)?.required);
    get("brief-no-preference").hidden = reviewing || questionId === "__files" || Boolean(fieldsById.get(questionId)?.required);
    get("brief-review-early").hidden = reviewing || stepIndex === briefSteps.length - 1;
    get("brief-extra-questions").closest("label").hidden = reviewing;
    get("brief-next").innerHTML = `${questionId === questionPath().at(-1) ? "Review my brief" : "Next"} <span aria-hidden="true">→</span>`;
    get("brief-progress-label").textContent = reviewing ? "Review & send" : `${briefSteps[stepIndex].title} · Question ${questionPath().indexOf(questionId) + 1}`;
    get("brief-progress-bar").max = questionPath().length + 1;
    get("brief-progress-bar").value = reviewing ? questionPath().length + 1 : questionPath().indexOf(questionId) + 1;
    form.querySelectorAll(".brief-step-link").forEach((button) => button.removeAttribute("aria-current"));
    const currentLink = reviewing ? form.querySelector("[data-brief-review-link]") : form.querySelector(`[data-brief-go="${stepIndex}"]`);
    currentLink?.setAttribute("aria-current", "step");
    if (focus) {
      const title = reviewing ? get("brief-review-title") : questionId === "__files" ? get("brief-upload-title") : form.querySelector(`[data-field-container="${questionId}"]`);
      if (title) title.tabIndex = -1;
      title?.focus({ preventScroll: true });
      title?.scrollIntoView({ behavior: "auto", block: "start" });
      if (win.matchMedia("(max-width: 700px)").matches && currentLink) {
        const scroller = currentLink.closest("ol");
        scroller?.scrollTo({ left: currentLink.offsetLeft - scroller.offsetLeft - 12, behavior: "auto" });
      }
    }
    form.querySelector(".brief-section-menu").open = false;
    if (saveDraft.checked) persistDraft();
  }

  function navigate(index, { validate = true, focus = true, preserveQuestion = false } = {}) {
    if (busy || submitted) return false;
    if (validate && stepIndex === 0 && index !== 0 && !validateStep(0)) return false;
    stepIndex = Math.max(0, Math.min(briefSteps.length - 1, index));
    if (!preserveQuestion) questionId = questionPath().find(id => briefSteps[stepIndex].fields.includes(id)) || "__files";
    announce("");
    updateVisibility();
    updateNavigation({ focus });
    return true;
  }

  function displayAnswer(field, value) {
    if (field.options) {
      const labels = new Map(field.options.map((option) => [option.value, option.label]));
      return Array.isArray(value) ? value.map((answer) => labels.get(answer) || answer).join("\n") : labels.get(value) || value;
    }
    return value;
  }

  function renderReview() {
    if (busy || submitted) return false;
    clearErrors();
    let answers;
    try { answers = normalizeBrief(rawAnswers()); }
    catch (error) { showFieldError(error.field, error.message || "Please check the highlighted answer."); return false; }
    downloadText = formatBriefText(answers);
    get("brief-review-content").innerHTML = briefSteps.map((step, index) => {
      const answered = step.fields.map((id) => fieldsById.get(id)).filter((field) => meaningful(answers[field.id]));
      const fileHTML = step.id === "assets" && files.length ? `<div class="brief-review-files">${files.map((entry) => `<div class="brief-review-file">${entry.url ? `<img src="${text(entry.url)}" alt="Uploaded reference: ${text(entry.file.name)}">` : '<span class="brief-file-document">PDF</span>'}<p>${text(entry.file.name)}${entry.caption ? `<br>${text(entry.caption)}` : ""}</p></div>`).join("")}</div>` : "";
      return `<section class="brief-review-group"><div class="brief-review-heading"><h3>${text(step.title)}</h3><button class="brief-text-button" type="button" data-brief-edit="${index}" aria-label="Edit ${text(step.title)}">Edit ↗</button></div>${answered.length ? `<dl>${answered.map((field) => `<dt>${text(field.label)}</dt><dd>${text(displayAnswer(field, answers[field.id]))}</dd>`).join("")}</dl>` : '<p class="brief-review-empty">Left open for our conversation.</p>'}${fileHTML}</section>`;
    }).join("");
    stepIndex = briefSteps.length;
    editingReview = false;
    announce("");
    updateNavigation();
    return true;
  }

  function renderColorSwatches() {
    const swatches = get("brief-color-swatches");
    if (!swatches) return;
    swatches.replaceChildren();
    const colors = [...new Set((controlsFor("colors")[0]?.value || "").match(/#[a-f\d]{6}\b|#[a-f\d]{3}\b/gi) || [])].slice(0, 12);
    for (const color of colors) {
      const chip = doc.createElement("span");
      chip.className = "brief-color-swatch";
      const sample = doc.createElement("i");
      sample.style.backgroundColor = color;
      sample.setAttribute("aria-hidden", "true");
      chip.append(sample, doc.createTextNode(color));
      swatches.append(chip);
    }
  }

  function updateMediaEmailLinks() {
    const answers = rawAnswers();
    const wellFormed = (value) => String(value).replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/gu, "\uFFFD");
    const oneLine = (value) => wellFormed(value || "").replace(/[\u0000-\u001f\u007f-\u009f]/gu, " ").trim();
    const project = oneLine(answers.projectName || answers.businessName || "My project");
    const reference = oneLine(receiptReference);
    const subject = wellFormed(`4u Digital project photos and videos — ${project}${reference ? ` — ${reference}` : ""}`.slice(0, 240));
    const body = `Please attach photos to this email before sending.\n\nHi 4u Digital,\n\nHere are the photos or videos for my project.\n\nBusiness / project: ${project}${reference ? `\nBrief reference: ${reference}` : ""}\n\nPhotos and videos related to my project (performances, business, restaurant, products, space, or other references):\n\nWhat I would like you to use them for:\n\n`;
    const href = `mailto:admin@customtechbuilt4u.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    for (const id of ["brief-media-email", "brief-success-media-email"]) {
      const link = get(id);
      if (link) link.href = href;
    }
  }

  function renderPaletteSelection() {
    const selection = get("brief-selected-palette");
    if (!selection) return;
    form.querySelectorAll("[data-brief-palette]").forEach((button) => {
      const active = selectedPalette?.id === button.dataset.briefPalette;
      button.setAttribute("aria-pressed", String(active));
      button.querySelector(".brief-palette-check").textContent = active ? "✓" : "↗";
      button.querySelector(".brief-palette-action").textContent = active ? "Selected starting point" : "Use as a starting point";
    });
    selection.hidden = !selectedPalette;
    get("brief-selected-palette-name").textContent = selectedPalette ? `Your starting palette: ${selectedPalette.name}` : "";
    get("brief-selected-palette-colors").innerHTML = selectedPalette ? selectedPalette.colors.map((color) => `<li><i style="background-color:${color.hex}" aria-hidden="true"></i><span>${text(color.name)}<code>${color.hex}</code></span></li>`).join("") : "";
    const limit = fieldsById.get("colors").maxLength || 500;
    const reserved = selectedPalette ? paletteAnswerPrefix(selectedPalette).length + 2 : 0;
    controlsFor("colors")[0].maxLength = Math.max(0, limit - reserved);
  }

  function choosePalette(id) {
    const selection = briefPalettes.find((entry) => entry.id === id) || null;
    const notes = controlsFor("colors")[0]?.value || "";
    const limit = fieldsById.get("colors").maxLength || 500;
    if (formatPaletteAnswer(selection, notes).length > limit) {
      const error = get("brief-colors-error");
      error.hidden = false;
      error.textContent = `Your color notes are near the ${limit}-character limit. Shorten them a little before adding this palette; your current notes have been kept.`;
      controlsFor("colors")[0].setAttribute("aria-invalid", "true");
      return;
    }
    selectedPalette = selection;
    changed();
  }

  function releaseFiles() {
    files.forEach((entry) => { if (entry.url) win.URL.revokeObjectURL(entry.url); });
    files = [];
  }

  function renderFiles() {
    get("brief-file-list").innerHTML = files.map((entry) => `<li class="brief-file-card" data-brief-file="${entry.id}">${entry.url ? `<img class="brief-file-preview" src="${text(entry.url)}" alt="Preview of ${text(entry.file.name)}">` : '<span class="brief-file-document" aria-hidden="true">PDF</span>'}<div class="brief-file-details"><p class="brief-file-name">${text(entry.file.name)}</p><p class="brief-file-size">${fileSize(entry.file.size)}</p><button type="button" class="brief-text-button" data-remove-file="${entry.id}" aria-label="Remove ${text(entry.file.name)}">Remove file</button></div><label class="brief-file-caption" for="brief-caption-${entry.id}">Anything to know about this file? (optional)<input id="brief-caption-${entry.id}" type="text" maxlength="500" data-file-caption="${entry.id}" value="${text(entry.caption)}" placeholder="For example: use this as the homepage photo."></label></li>`).join("");
    get("brief-file-count").textContent = files.length ? `${files.length} of ${maxFiles} files · ${fileSize(files.reduce((total, entry) => total + entry.file.size, 0))} of 8 MB` : "No files added. This is optional.";
  }

  function addFiles(incoming) {
    if (busy) return;
    const result = validateBriefFiles(files.map((entry) => entry.file), [...incoming]);
    for (const file of result.accepted) files.push({ id: win.crypto.randomUUID(), file, caption: "", url: file.type.startsWith("image/") ? win.URL.createObjectURL(file) : null });
    get("brief-file-error").hidden = !result.errors.length;
    get("brief-file-error").textContent = [...new Set(result.errors)].join(" ");
    if (result.accepted.length) { changed(); renderFiles(); }
    get("brief-files").value = "";
  }

  function setBusy(value) {
    busy = value;
    form.setAttribute("aria-busy", String(value));
    form.querySelectorAll("button, input, textarea").forEach((control) => { control.disabled = value; });
    updateVisibility();
    get("brief-send").innerHTML = value ? "Sending your brief…" : 'Send my project brief <span aria-hidden="true">↗</span>';
  }

  function downloadBrief() {
    if (!downloadText) return;
    const url = win.URL.createObjectURL(new Blob([downloadText], { type: "text/plain;charset=utf-8" }));
    const link = doc.createElement("a");
    link.href = url;
    link.download = "4u-digital-my-project-brief.txt";
    link.hidden = true;
    doc.body.append(link);
    link.click();
    link.remove();
    win.setTimeout(() => win.URL.revokeObjectURL(url), 1000);
  }

  form.addEventListener("input", (event) => {
    if (busy) return;
    const answerField = fieldsById.get(event.target.dataset.briefField);
    if (answerField?.type === "checkboxes" && event.target.checked) {
      for (const control of controlsFor(answerField.id)) {
        if (control !== event.target && (event.target.value === "no_preference" || control.value === "no_preference")) control.checked = false;
      }
    }
    const captionId = event.target.dataset.fileCaption;
    if (captionId) {
      const entry = files.find((file) => file.id === captionId);
      if (entry) entry.caption = event.target.value;
      changed();
    } else if (event.target.matches("[data-brief-field]")) changed();
  });
  form.addEventListener("change", (event) => {
    if (event.target.id === "brief-save-draft") {
      if (saveDraft.checked) persistDraft();
      else removeDraft();
    } else if (event.target.id === "brief-files") addFiles(event.target.files);
    else if (event.target.matches("[data-brief-field]")) changed();
    else if (event.target.id === "brief-consent") {
      get("brief-consent-error").hidden = true;
      event.target.removeAttribute("aria-invalid");
      if (attemptedFingerprint) { requestId = win.crypto.randomUUID(); attemptedFingerprint = null; }
      announce("");
    }
  });

  form.addEventListener("click", (event) => {
    const target = event.target.closest("button");
    if (!target || busy) return;
    if (target.hasAttribute("data-brief-palette")) choosePalette(target.dataset.briefPalette);
    else if (target.id === "brief-clear-palette") choosePalette(null);
    else if (target.hasAttribute("data-brief-go")) { editingReview = false; navigate(Number(target.dataset.briefGo)); }
    else if (target.hasAttribute("data-brief-review-link")) renderReview();
    else if (target.hasAttribute("data-brief-edit")) { editingReview = true; navigate(Number(target.dataset.briefEdit), { validate: false }); }
    else if (target.hasAttribute("data-remove-file")) {
      const entry = files.find((file) => file.id === target.dataset.removeFile);
      if (entry?.url) win.URL.revokeObjectURL(entry.url);
      files = files.filter((file) => file !== entry);
      changed(); renderFiles(); get("brief-files").focus();
    } else if (target.id === "brief-next" || target.id === "brief-skip") advance();
    else if (target.id === "brief-no-preference") {
      const field = fieldsById.get(questionId);
      if (!field || field.required) return;
      if (field.type === "colors") selectedPalette = null;
      for (const control of controlsFor(questionId)) {
        if (["radio", "checkboxes"].includes(field.type)) control.checked = control.value === "no_preference";
        else control.value = "No preference — help me decide";
      }
      changed(); advance();
    } else if (target.id === "brief-review-early") {
      if (!rawAnswers().projectType) { showFieldError("projectType", "Please choose an option."); return; }
      goQuestion("contactName");
    } else if (target.id === "brief-back") {
      editingReview = false;
      const path = questionPath();
      goQuestion(stepIndex === briefSteps.length ? path.at(-1) : path[Math.max(0, path.indexOf(questionId) - 1)]);
    }
    else if (target.id === "brief-remove-draft") removeDraft();
    else if (target.id === "brief-clear") { get("brief-clear-confirm").hidden = false; get("brief-clear-yes").focus(); }
    else if (target.id === "brief-clear-no") { get("brief-clear-confirm").hidden = true; get("brief-clear").focus(); }
    else if (target.id === "brief-clear-yes") {
      releaseFiles(); form.reset(); selectedPalette = null; removeDraft(); clearErrors(); get("brief-clear-confirm").hidden = true; get("brief-draft-restored").hidden = true;
      get("brief-file-error").hidden = true; requestId = win.crypto.randomUUID(); attemptedFingerprint = null; startedAt = new Date().toISOString(); editingReview = false;
      renderFiles(); renderColorSwatches(); renderPaletteSelection(); navigate(0, { validate: false });
    } else if (target.id === "brief-add-color") {
      const control = controlsFor("colors")[0];
      const color = get("brief-color-picker").value;
      const addition = `${control.value.trim() ? ", " : ""}${color}`;
      if (control.value.length + addition.length <= control.maxLength) { control.value += addition; changed(); control.focus(); }
      else announce("Your color answer is full. Remove a little text before adding another code.", { error: true });
    } else if (target.id === "brief-media-copy") {
      const address = "admin@customtechbuilt4u.com";
      const copyStatus = get("brief-media-copy-status");
      Promise.resolve().then(() => win.navigator.clipboard.writeText(address)).then(() => {
        copyStatus.textContent = "Email address copied. You can paste it into your email app or webmail.";
      }).catch(() => {
        const range = doc.createRange();
        range.selectNodeContents(get("brief-media-email-address"));
        const selection = win.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        copyStatus.textContent = "Automatic copying is unavailable. The email address is selected so you can copy it, or type it into webmail.";
      });
    }
  });

  const dropzone = get("brief-dropzone");
  dropzone?.addEventListener("dragover", (event) => { event.preventDefault(); if (!busy) dropzone.classList.add("is-dragging"); });
  dropzone?.addEventListener("dragleave", () => dropzone.classList.remove("is-dragging"));
  dropzone?.addEventListener("drop", (event) => { event.preventDefault(); dropzone.classList.remove("is-dragging"); if (event.dataTransfer?.files) addFiles(event.dataTransfer.files); });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy || submitted) return;
    if (stepIndex !== briefSteps.length) { advance(); return; }
    clearErrors();
    let answers;
    try { answers = normalizeBrief(rawAnswers()); }
    catch (error) { showFieldError(error.field, error.message || "Please check your answers."); return; }
    if (!get("brief-consent").checked) {
      get("brief-consent-error").textContent = "Please agree to send your project details and files before continuing.";
      get("brief-consent-error").hidden = false;
      get("brief-consent").setAttribute("aria-invalid", "true");
      get("brief-consent").focus();
      return;
    }
    const fingerprint = JSON.stringify({ answers, files: files.map((entry) => ({ name: entry.file.name, size: entry.file.size, type: entry.file.type, modified: entry.file.lastModified, caption: entry.caption })) });
    if (attemptedFingerprint && attemptedFingerprint !== fingerprint) requestId = win.crypto.randomUUID();
    attemptedFingerprint = fingerprint;
    const body = new FormData();
    body.append("brief", JSON.stringify({ version: 1, requestId, answers, consent: true, honey: get("brief-company-url").value, startedAt }));
    files.forEach((entry) => body.append("files", entry.file, entry.file.name));
    body.append("captions", JSON.stringify(files.map((entry) => entry.caption)));
    setBusy(true);
    announce("Sending your brief securely. Keep this page open for the confirmation.");
    const aborter = new AbortController();
    const timeout = win.setTimeout(() => aborter.abort(), 60_000);
    try {
      const response = await win.fetch(briefEndpoint, { method: "POST", headers: { apikey: briefPublishableKey }, body, signal: aborter.signal });
      let result;
      try { result = await response.json(); } catch { throw new Error("The server did not return a confirmation. Your answers and files are still here. Please try again."); }
      const validStatus = (result?.status === "sent" && [200, 201].includes(response.status)) || (["received", "queued"].includes(result?.status) && response.status === 202);
      const validReceipt = response.ok && result?.ok === true && typeof result.reference === "string" && result.reference.trim() && validStatus;
      if (!validReceipt) {
        if (result?.field && fieldsById.has(result.field)) { setBusy(false); showFieldError(result.field, result.error || result.message || "Please check this answer."); return; }
        throw new Error(response.status === 429 ? "Too many attempts in a short time. Your answers and files are still here. Please wait a little and try again." : result?.error || result?.message || "Your brief could not be confirmed. Your answers and files are still here. Please try again.");
      }
      submitted = true;
      receiptReference = result.reference;
      updateMediaEmailLinks();
      downloadText = `${formatBriefText(answers)}\n\nFiles shared:\n${files.length ? files.map((entry) => `${entry.file.name}${entry.caption ? ` — ${entry.caption}` : ""}`).join("\n") : "No files attached."}\n\nReference: ${result.reference}`;
      removeDraft();
      form.hidden = true;
      get("brief-success-title").textContent = result.status === "sent" ? "Your brief is on its way." : "Your brief is safely received.";
      const deliveryNote = ["failed", "uncertain"].includes(result.delivery) ? "Your project details have been saved. The email notification needs attention; you do not need to send the brief again." : "Your project details have been saved. The email notification is still pending; you do not need to send the brief again.";
      get("brief-success-message").textContent = result.status === "sent" ? "Your project details have been saved and the email notification has been accepted for delivery to 4u Digital." : typeof result.message === "string" && result.message.trim() ? result.message.slice(0, 1500) : deliveryNote;
      get("brief-reference").textContent = `Your reference: ${result.reference}`;
      const success = get("brief-success");
      success.hidden = false;
      success.focus({ preventScroll: true });
      success.scrollIntoView({ behavior: "auto", block: "start" });
      releaseFiles();
    } catch (error) {
      setBusy(false);
      const message = error?.name === "AbortError" ? "This is taking longer than expected. We could not confirm receipt. Your answers and files are still here; try again without changing anything to avoid a duplicate." : error?.message === "Failed to fetch" || error instanceof TypeError ? "We could not confirm receipt because the connection was interrupted. Your answers and files are still here. Try again; an unchanged retry uses the same request reference." : error.message || "We could not confirm receipt. Your answers and files are still here. Please try again.";
      announce(message, { error: true, focus: true });
    } finally { win.clearTimeout(timeout); }
  });

  get("brief-success-download")?.addEventListener("click", downloadBrief);
  // Keep selected files available when a browser restores this page from its back/forward cache.
  // Removed files, cleared briefs, and successful submissions release their object URLs explicitly.
  win.addEventListener("pagehide", persistDraft);
  try {
    const stored = JSON.parse(win.localStorage.getItem(draftKey) || "null");
    if (stored?.version === 1 && stored.answers && typeof stored.answers === "object" && !Array.isArray(stored.answers)) {
      for (const field of briefFields) {
        const value = stored.answers[field.id];
        for (const control of controlsFor(field.id)) {
          if (field.type === "checkboxes") control.checked = Array.isArray(value) && value.includes(control.value);
          else if (field.type === "radio") control.checked = value === control.value;
          else if (field.type === "colors" && typeof value === "string") {
            const restored = parsePaletteAnswer(value.slice(0, field.maxLength || 500));
            selectedPalette = restored.selection;
            control.value = restored.notes;
          } else control.value = typeof value === "string" ? value.slice(0, field.maxLength || 3000) : "";
        }
      }
      saveDraft.checked = true;
      stepIndex = Number.isInteger(stored.step) ? Math.max(0, Math.min(briefSteps.length - 1, stored.step)) : 0;
      questionId = fieldsById.has(stored.question) || stored.question === "__files" ? stored.question : briefSteps[stepIndex].fields[0];
      if (fieldsById.get(questionId)?.advanced) get("brief-extra-questions").checked = true;
      get("brief-draft-restored").textContent = stored.hadFiles ? "Your saved answers are back. Files are not saved on this device by the form. Please reselect any photos or PDFs before sending." : "Your saved answers are back. Pick up where you left off, or use Start over for a new project.";
      get("brief-draft-restored").hidden = false;
      get("brief-remove-draft").hidden = false;
    }
  } catch { /* A corrupt or unavailable local draft must not block a new brief. */ }
  get("brief-fallback").hidden = true;
  get("brief-draft-settings").open = false;
  form.querySelectorAll(".brief-advanced, [data-brief-reveal-selection]").forEach((details) => {
    if ([...details.querySelectorAll("input, textarea")].some((control) => ["radio", "checkbox"].includes(control.type) ? control.checked : Boolean(control.value.trim()))) details.open = true;
  });
  form.hidden = false;
  updateVisibility();
  renderFiles();
  renderColorSwatches();
  renderPaletteSelection();
  goQuestion(questionId, { focus: false });
  return true;
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => initProjectBrief(), { once: true });
  else initProjectBrief();
}
