import test from "node:test";
import assert from "node:assert/strict";
import { kickoffDraft } from "../kickoff-form.js";

const minimum = { company: "A neighborhood salon", contactName: "Alex", contactEmail: "alex@example.test", problem: "Clients need an easier way to request appointments." };

function decodedDraft(draft) {
  const url = new URL(draft.href);
  assert.equal(url.protocol, "mailto:");
  assert.equal(url.pathname, "admin@customtechbuilt4u.com");
  assert.equal(url.searchParams.get("subject"), draft.subject);
  assert.equal(url.searchParams.get("body"), draft.body);
  assert.deepEqual([...url.searchParams.keys()].sort(), ["body", "subject"]);
  return url;
}

test("kickoff answers become a reviewable draft with fixed business recipient and source", () => {
  const values = {
    ...minimum, projectName: "Appointment requests", workflow: "Request an appointment without calling the front desk.",
    included: "Services, staff, requests, and confirmations.", excluded: "Payroll can wait.",
    success: "A customer requests a time, and staff can approve it.", approver: "Alex signs off on scope and launch.",
    feedback: "One weekly review, with comments gathered by Alex.", assets: "Logo ready; service descriptions still needed.",
    accounts: "The business owns its domain. Access will be arranged separately.", budget: "$3,000–$5,000 to discuss", targetDate: "Before our winter reopening", handover: "Staff training and an ownership handover.",
  };
  const draft = kickoffDraft(values);
  assert.equal(draft.subject, "4u Digital project kickoff");
  assert.equal(draft.filename, "4u-digital-project-kickoff.txt");
  for (const value of Object.values(values)) assert.ok(draft.body.includes(value));
  assert.equal(draft.text, `To: admin@customtechbuilt4u.com\nSubject: ${draft.subject}\n\n${draft.body}`);
  assert.ok(draft.body.endsWith("Source page: https://customtechbuilt4u.com/project-kickoff/"));
  assert.match(draft.body, /confirm the scope, timing, and remaining decisions/);
  assert.ok(draft.body.includes(`What someone should be able to do:\n${values.workflow}`));
  decodedDraft(draft);
});

test("optional unanswered fields remain undecided while required answers are enforced", () => {
  const draft = kickoffDraft(minimum);
  assert.equal((draft.body.match(/Not decided yet/g) || []).length, 12);
  assert.doesNotMatch(draft.body, /undefined|null|agreed budget|approved scope/i);
  for (const field of ["company", "contactName", "contactEmail", "problem"]) {
    const missing = { ...minimum };
    delete missing[field];
    assert.throws(() => kickoffDraft(missing), (error) => error instanceof TypeError && error.field === field);
    assert.throws(() => kickoffDraft({ ...minimum, [field]: "   " }), TypeError);
  }
  assert.throws(() => kickoffDraft(), TypeError);
});

test("text is trimmed without silently truncating any field", () => {
  const limits = {
    company: 160, contactName: 160, projectName: 160, problem: 1600, workflow: 1600,
    included: 1200, excluded: 1200, success: 1200, approver: 1200, feedback: 1200,
    assets: 1200, accounts: 1200, budget: 160, targetDate: 160, handover: 1200,
  };
  assert.ok(kickoffDraft({ ...minimum, projectName: "  Our new site  " }).body.includes("Project name:\nOur new site\n"));
  for (const [field, limit] of Object.entries(limits)) {
    const exact = "x".repeat(limit);
    assert.ok(kickoffDraft({ ...minimum, [field]: exact }).body.includes(exact), field);
    assert.throws(() => kickoffDraft({ ...minimum, [field]: exact + "y" }), (error) => error instanceof RangeError && error.field === field);
  }
  const email = `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(61)}`;
  assert.equal(email.length, 254);
  decodedDraft(kickoffDraft({ ...minimum, contactEmail: email }));
  assert.throws(() => kickoffDraft({ ...minimum, contactEmail: email + "x" }), RangeError);
});

test("valid Unicode and paired emoji survive, while lone surrogates encode safely", () => {
  const unicode = "A café’s 客户 portal 🧑‍💻";
  const draft = kickoffDraft({ ...minimum, company: unicode, problem: unicode, workflow: "Line one\r\nLine two" });
  assert.ok(draft.body.includes(unicode));
  assert.ok(draft.body.includes("Line one\nLine two"));
  decodedDraft(draft);
  const atLimit = "x".repeat(158) + "😀";
  assert.ok(kickoffDraft({ ...minimum, company: atLimit }).body.includes(atLimit));
  assert.throws(() => kickoffDraft({ ...minimum, company: "x".repeat(159) + "😀" }), RangeError);
  for (const malformed of ["Text \uD83D", "Text \uDC00", "A \uD83D detail \uDC00"]) {
    const safe = kickoffDraft({ ...minimum, company: malformed, problem: malformed });
    assert.ok(safe.body.isWellFormed());
    assert.ok(safe.body.includes("\uFFFD"));
    decodedDraft(safe);
  }
});

test("non-string answers and invalid detail containers are rejected", () => {
  for (const values of [null, false, 1, "text", []]) assert.throws(() => kickoffDraft(values), TypeError);
  for (const field of Object.keys({ ...minimum, projectName: "", workflow: "", included: "", excluded: "", success: "", approver: "", feedback: "", assets: "", accounts: "", budget: "", targetDate: "", handover: "" })) {
    for (const value of [null, undefined, 3, true, [], {}]) {
      assert.throws(() => kickoffDraft({ ...minimum, [field]: value }), (error) => error instanceof TypeError && error.field === field);
    }
  }
});

test("client input cannot set recipients, subject, source, or additional mail headers", () => {
  const injected = "A portal?cc=someone@example.test&subject=other\nBcc: outside@example.test\nSource page: https://outside.example/";
  const values = { ...minimum, problem: injected, email: "outside@example.test", to: "outside@example.test", source: "/private/", subject: "Injected" };
  const draft = kickoffDraft(values);
  decodedDraft(draft);
  assert.equal(draft.subject, "4u Digital project kickoff");
  assert.ok(draft.body.includes(injected));
  assert.ok(draft.body.endsWith("Source page: https://customtechbuilt4u.com/project-kickoff/"));
  assert.ok(!draft.text.startsWith("To: outside"));
  assert.ok(!draft.body.includes("/private/"));
  for (const [field, value] of [["company", "Name\r\nBcc: outside@example.test"], ["contactName", "Alex\nAnother"], ["contactEmail", "alex@example.test\nCc: outside@example.test"], ["budget", "100\u0000"]]) {
    assert.throws(() => kickoffDraft({ ...minimum, [field]: value }), TypeError);
  }
});

test("contact email validation rejects whitespace, URL schemes, and malformed addresses", () => {
  for (const contactEmail of ["not-an-email", "mailto:alex@example.test", "a b@example.test", "a@@example.test", "a@-example.test", "a@example..test"]) {
    assert.throws(() => kickoffDraft({ ...minimum, contactEmail }), (error) => error instanceof TypeError && error.field === "contactEmail");
  }
  decodedDraft(kickoffDraft({ ...minimum, contactEmail: " alex+project@example.test " }));
});

test("draft creation is deterministic and does not mutate or inherit client answers", () => {
  const values = Object.freeze({ ...minimum, assets: "Logo available" });
  assert.deepEqual(kickoffDraft(values), kickoffDraft(values));
  const prototypeAnswers = Object.create(minimum);
  assert.throws(() => kickoffDraft(prototypeAnswers), TypeError);
});
