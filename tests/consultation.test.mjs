import test from "node:test";
import assert from "node:assert/strict";
import { consultationDraft } from "../consultation.js";

const recipient = "admin@customtechbuilt4u.com";

function decodedDraft(draft) {
  const url = new URL(draft.href);
  assert.equal(url.protocol, "mailto:");
  assert.equal(url.pathname, recipient);
  assert.equal(url.searchParams.get("subject"), draft.subject);
  assert.equal(url.searchParams.get("body"), draft.body);
  return url;
}

test("each consultation format produces a complete request addressed to Built4U", () => {
  for (const [format, subject, description] of [
    ["zoom", "Built4U Zoom consultation", "Zoom"],
    ["in-person", "Built4U in-person consultation", "In person in the New York City area"],
  ]) {
    const preferredTimes = "Tuesday after 2 pm or Thursday morning (Eastern time)";
    const project = "A salon website with appointment requests & staff calendars.";
    const draft = consultationDraft({ format, preferredTimes, project });
    assert.equal(draft.subject, subject);
    assert.ok(draft.body.includes(description));
    assert.ok(draft.body.includes(preferredTimes));
    assert.ok(draft.body.includes(project));
    decodedDraft(draft);
  }
});

test("a fallback request works before clients have supplied project details", () => {
  const draft = consultationDraft();
  assert.equal(draft.subject, "Built4U Zoom consultation");
  assert.ok(draft.body.includes("Zoom"));
  assert.match(draft.body, /preferred.*(?:days|times)|(?:days|times).*preferred/i);
  assert.doesNotMatch(draft.body, /undefined|null/);
  decodedDraft(draft);
});

test("consultation details are trimmed and kept within the displayed field limits", () => {
  const trimmed = consultationDraft({ preferredTimes: "  Friday, 10 am  ", project: "  Restaurant ordering  " });
  assert.ok(trimmed.body.includes("Friday, 10 am"));
  assert.ok(trimmed.body.includes("Restaurant ordering"));
  assert.ok(!trimmed.body.includes("  Friday, 10 am  "));
  assert.ok(!trimmed.body.includes("  Restaurant ordering  "));

  const capped = consultationDraft({ preferredTimes: "x".repeat(350), project: "y".repeat(1200) });
  assert.ok(capped.body.includes("x".repeat(300)));
  assert.ok(!capped.body.includes("x".repeat(301)));
  assert.ok(capped.body.includes("y".repeat(1000)));
  assert.ok(!capped.body.includes("y".repeat(1001)));
  decodedDraft(capped);
});

test("emoji remain intact when consultation details reach or cross a field limit", () => {
  for (const [field, limit] of [["preferredTimes", 300], ["project", 1000]]) {
    const fits = "x".repeat(limit - 2) + "😀";
    const complete = consultationDraft({ [field]: fits });
    assert.ok(complete.body.includes(fits), `${field}: a complete emoji at the limit is preserved`);
    assert.ok(complete.body.isWellFormed());
    decodedDraft(complete);

    const crosses = "x".repeat(limit - 1) + "😀";
    const truncated = consultationDraft({ [field]: crosses });
    assert.ok(truncated.body.includes("x".repeat(limit - 1)));
    assert.ok(truncated.body.isWellFormed(), `${field}: truncation does not leave a broken surrogate`);
    assert.ok(!truncated.body.includes("\uFFFD"), `${field}: truncating valid text does not introduce a replacement glyph`);
    assert.ok(!truncated.body.includes("😀"), `${field}: the whole emoji is omitted when it cannot fit`);
    decodedDraft(truncated);
  }
});

test("Unicode consultation details encode safely even when pasted text has an unpaired surrogate", () => {
  const valid = consultationDraft({ preferredTimes: "Vendredi à 14 h", project: "A café’s 客户 portal 🧑‍💻" });
  assert.ok(valid.body.includes("Vendredi à 14 h"));
  assert.ok(valid.body.includes("A café’s 客户 portal 🧑‍💻"));
  decodedDraft(valid);

  for (const malformed of ["A portal \uD83D", "A portal \uDC00", "A \uD83D portal \uDC00"]) {
    const normalized = consultationDraft({ preferredTimes: malformed, project: malformed });
    assert.ok(normalized.body.isWellFormed(), "Unpaired input is normalized before email encoding");
    decodedDraft(normalized);
  }
});

test("client text cannot change the recipient or add mail headers", () => {
  const project = "A customer portal?cc=someone@example.com&subject=other\nA quote with \"marks\" and café.";
  const draft = consultationDraft({ format: "in-person", preferredTimes: "Wed + Fri, 2–4 pm", project });
  const url = decodedDraft(draft);
  assert.equal(url.searchParams.get("cc"), null);
  assert.equal(url.searchParams.get("bcc"), null);
  assert.equal(url.searchParams.size, 2);
  assert.ok(draft.body.includes(project));
});

test("unsupported formats and non-text details are rejected", () => {
  for (const format of ["phone", "Zoom", "", null, 2, {}]) {
    assert.throws(() => consultationDraft({ format }), TypeError);
  }
  for (const field of ["preferredTimes", "project"]) {
    for (const value of [null, 5, true, [], {}]) {
      assert.throws(() => consultationDraft({ [field]: value }), TypeError);
    }
  }
});
