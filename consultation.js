import { email } from "./public-projects.js?v=32";

export function consultationDraft({ format = "zoom", preferredTimes = "", project = "" } = {}) {
  if (!["zoom", "in-person"].includes(format)) throw new TypeError("Choose a consultation format.");
  if (typeof preferredTimes !== "string" || typeof project !== "string") {
    throw new TypeError("Consultation details must be text.");
  }
  const meeting = format === "zoom" ? "Zoom" : "In person in the New York City area";
  const subject = `Built4U ${format === "zoom" ? "Zoom" : "in-person"} consultation`;
  const times = preferredTimes.trim().slice(0, 300) || "[Your preferred days, times, and time zone]";
  const idea = project.trim().slice(0, 1000) || "[A little about the website, app, or software you have in mind]";
  const body = `Hi Built4U,\n\nI'd like to arrange a consultation.\n\nMeeting format: ${meeting}\nPreferred days and times: ${times}\n\nAbout my project:\n${idea}\n\nPlease reply to confirm a suitable time${format === "in-person" ? " and meeting location" : " and the Zoom details"}.\n\nThanks!`;
  return { subject, body, href: `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` };
}

export function initConsultation() {
  const form = document.querySelector("#consultation-form");
  if (!form) return;
  const fallback = document.querySelector(".consultation-fallback");
  const emailLink = document.querySelector("#consultation-email");
  const status = document.querySelector("#consultation-status");
  const draftField = document.querySelector("#consultation-draft");
  const draftPanel = document.querySelector("#consultation-draft-panel");
  const ready = document.querySelector("#consultation-ready");

  function updateDraft() {
    const values = new FormData(form);
    const draft = consultationDraft({
      format: values.get("format"),
      preferredTimes: values.get("preferredTimes"),
      project: values.get("project"),
    });
    emailLink.href = draft.href;
    draftField.value = `To: ${email}\nSubject: ${draft.subject}\n\n${draft.body}`;
    return draft;
  }

  updateDraft();
  form.hidden = false;
  fallback.hidden = true;
  form.addEventListener("input", () => {
    updateDraft();
    ready.hidden = true;
    draftPanel.hidden = true;
    status.textContent = "";
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    updateDraft();
    ready.hidden = false;
    status.textContent = "Your request is ready. Send it from your email app to arrange a time; I’ll reply to confirm the meeting.";
    emailLink.click();
  });
  document.querySelector("#consultation-copy").addEventListener("click", async () => {
    updateDraft();
    try {
      await navigator.clipboard.writeText(draftField.value);
      status.textContent = `Request copied. Paste it into an email to ${email} to arrange your consultation.`;
    } catch {
      draftPanel.hidden = false;
      draftField.focus();
      draftField.select();
      status.textContent = "Select and copy the request below, then paste it into your email.";
    }
  });
}
