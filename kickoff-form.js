import { email } from "./public-projects.js?v=43";
import { addInquirySource } from "./contact-context.js?v=43";

const fields = [
  { name: "company", label: "Business or organization", required: true, limit: 160 },
  { name: "contactName", label: "Main contact", required: true, limit: 160 },
  { name: "contactEmail", label: "Contact email", required: true, limit: 254, email: true },
  { name: "projectName", label: "Project name", limit: 160 },
  { name: "problem", label: "What the project needs to solve", required: true, limit: 1600, multiline: true },
  { name: "workflow", label: "What someone should be able to do", limit: 1600, multiline: true },
  { name: "included", label: "What the first version should include", limit: 1200, multiline: true },
  { name: "excluded", label: "What can wait or is outside this project", limit: 1200, multiline: true },
  { name: "success", label: "How we will know it works", limit: 1200, multiline: true },
  { name: "approver", label: "Who approves scope, budget, and the finished work", limit: 1200, multiline: true },
  { name: "feedback", label: "Who gathers feedback and how we will review it", limit: 1200, multiline: true },
  { name: "assets", label: "Content, designs, and assets available or still needed", limit: 1200, multiline: true },
  { name: "accounts", label: "Accounts, account owners, and access to arrange", limit: 1200, multiline: true },
  { name: "budget", label: "Budget or budget range", limit: 160 },
  { name: "targetDate", label: "Target date and any timing constraints", limit: 160 },
  { name: "handover", label: "Launch, handover, and ongoing support needs", limit: 1200, multiline: true },
];

const emailPattern = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function fieldError(field, message, ErrorType = TypeError) {
  return Object.assign(new ErrorType(message), { field: field.name });
}

function fieldText(values, field) {
  const value = Object.hasOwn(values, field.name) ? values[field.name] : "";
  if (typeof value !== "string") throw fieldError(field, `${field.label} must be text.`);
  if (value.length > field.limit) {
    throw fieldError(field, `${field.label} must be ${field.limit} characters or fewer.`, RangeError);
  }
  const disallowedControls = field.multiline ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u : /[\u0000-\u001F\u007F]/u;
  if (disallowedControls.test(value)) throw fieldError(field, `${field.label} contains an unsupported character.`);
  // Preserve paired emoji and replace only malformed pasted Unicode before URL encoding.
  const text = value.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDFFF]/gu, (character) => character.length === 2 ? character : "\uFFFD")
    .replace(/\r\n?/gu, "\n").trim();
  if (field.required && !text) throw fieldError(field, `Please complete ${field.label.toLowerCase()}.`);
  if (field.email && text && !emailPattern.test(text)) throw fieldError(field, "Please enter a valid contact email.");
  return text || "Not decided yet";
}

export function kickoffDraft(values = {}) {
  if (!values || typeof values !== "object" || Array.isArray(values)) throw new TypeError("Project details must be a set of text answers.");
  const answers = fields.map((field) => `${field.label}:\n${fieldText(values, field)}`);
  const subject = "4u Digital project kickoff";
  const introduction = "Hi 4u Digital,\n\nHere are my project details. Please review them with me so we can confirm the scope, timing, and remaining decisions.";
  const content = `${introduction}\n\n${answers.join("\n\n")}`;
  const href = addInquirySource(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(content)}`, "/project-kickoff/");
  const body = new URL(href).searchParams.get("body");
  return {
    subject,
    body,
    href,
    text: `To: ${email}\nSubject: ${subject}\n\n${body}`,
    filename: "4u-digital-project-kickoff.txt",
  };
}

const initializedForms = new WeakSet();
const emailLinkLimit = 6000;

export function initKickoffForm(doc = document) {
  const form = doc.querySelector("#kickoff-form");
  if (!form) return false;
  if (initializedForms.has(form)) return true;
  const fallback = doc.querySelector("#kickoff-fallback");
  const review = doc.querySelector("#kickoff-review");
  const summary = doc.querySelector("#kickoff-summary");
  const emailLink = doc.querySelector("#kickoff-email");
  const emailLimit = doc.querySelector("#kickoff-email-limit");
  const copyButton = doc.querySelector("#kickoff-copy");
  const downloadButton = doc.querySelector("#kickoff-download");
  const status = doc.querySelector("#kickoff-status");
  if (![fallback, review, summary, emailLink, emailLimit, copyButton, downloadButton, status].every(Boolean)) return false;

  let currentDraft = null;

  function invalidateDraft() {
    currentDraft = null;
    review.hidden = true;
    summary.value = "";
    emailLink.removeAttribute("href");
    emailLink.hidden = true;
    emailLimit.hidden = true;
    copyButton.disabled = true;
    downloadButton.disabled = true;
    status.textContent = "";
    for (const field of fields) form.elements.namedItem(field.name)?.setCustomValidity("");
  }

  function selectSummary(message) {
    summary.focus();
    summary.select();
    status.textContent = message;
  }

  initializedForms.add(form);
  invalidateDraft();
  form.hidden = false;
  fallback.hidden = true;
  for (const link of doc.querySelectorAll("[data-kickoff-start]")) {
    link.href = "#kickoff-form";
    link.textContent = "Fill out your project brief ↘";
  }
  form.addEventListener("input", invalidateDraft);
  form.addEventListener("change", invalidateDraft);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    let draft;
    try {
      draft = kickoffDraft(Object.fromEntries(new FormData(form)));
    } catch (error) {
      invalidateDraft();
      status.textContent = error.message;
      const field = form.elements.namedItem(error.field);
      if (field) {
        field.setCustomValidity(error.message);
        field.reportValidity();
      }
      return;
    }
    currentDraft = draft;
    summary.value = draft.text;
    const useEmailLink = draft.href.length <= emailLinkLimit;
    emailLink.hidden = !useEmailLink;
    emailLimit.hidden = useEmailLink;
    if (useEmailLink) emailLink.href = draft.href;
    else emailLink.removeAttribute("href");
    copyButton.disabled = false;
    downloadButton.disabled = false;
    review.hidden = false;
    status.textContent = "Your project summary is ready to review. Nothing has been sent. Send it using your email app, or copy or download it to share.";
    summary.focus({ preventScroll: true });
    review.scrollIntoView({ behavior: "auto", block: "start" });
  });

  copyButton.addEventListener("click", async () => {
    const draft = currentDraft;
    if (!draft) return;
    try {
      await (doc.defaultView?.navigator ?? navigator).clipboard.writeText(draft.text);
      if (currentDraft === draft) status.textContent = `Project summary copied. Paste it into an email to ${email}. Nothing has been sent yet.`;
    } catch {
      if (currentDraft === draft) selectSummary(`Automatic copying is unavailable. Select and copy the summary, then paste it into an email to ${email}.`);
    }
  });

  downloadButton.addEventListener("click", () => {
    const draft = currentDraft;
    if (!draft) return;
    let objectURL;
    let link;
    try {
      objectURL = URL.createObjectURL(new Blob([draft.text], { type: "text/plain;charset=utf-8" }));
      link = doc.createElement("a");
      link.href = objectURL;
      link.download = draft.filename;
      link.hidden = true;
      doc.body.append(link);
      link.click();
      if (currentDraft === draft) status.textContent = `Project summary download requested. Attach the text file to an email to ${email}. Nothing has been sent yet.`;
    } catch {
      if (currentDraft === draft) selectSummary("The download could not start. Select and copy the project summary instead.");
    } finally {
      link?.remove();
      if (objectURL) setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
    }
  });

  doc.querySelector("#kickoff-edit")?.addEventListener("click", (event) => {
    const firstField = form.elements.namedItem("company");
    if (!firstField) return;
    event.preventDefault();
    firstField.focus({ preventScroll: true });
    form.scrollIntoView({ behavior: "auto", block: "start" });
  });
  return true;
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => initKickoffForm(), { once: true });
  else initKickoffForm();
}
