import test from "node:test";
import assert from "node:assert/strict";
import { briefSteps, briefFields, maxBriefLength, normalizeBrief, formatBriefText } from "../project-brief-schema.js";
import { briefPalettes, formatPaletteAnswer, parsePaletteAnswer } from "../project-brief-palettes.js";

const minimum = Object.freeze({ projectType: "website", contactName: "Alex", contactEmail: "alex@example.test" });

test("a selected visual palette and multiline client notes survive validation and the emailed summary", () => {
  const notes = "Keep the background light.\n\tUse the dark color for buttons, not every heading.";
  for (const palette of briefPalettes) {
    const colors = formatPaletteAnswer(palette, notes);
    assert.equal(normalizeBrief({ ...minimum, colors }).colors, colors);
    assert.deepEqual(parsePaletteAnswer(colors), { selection: palette, notes });
    const summary = formatBriefText({ ...minimum, colors });
    assert.ok(summary.includes(palette.name) && palette.colors.every(({ hex }) => summary.includes(hex)));
    assert.ok(summary.includes(notes));
  }
});

test("the brief is an optional discovery conversation with only project type and reply identity required", () => {
  assert.equal(briefSteps.length, 9);
  assert.ok(briefFields.length >= 70 && briefFields.length <= 85);
  assert.deepEqual(briefFields.filter((field) => field.required).map((field) => field.id).sort(), ["contactEmail", "contactName", "projectType"]);
  assert.deepEqual(normalizeBrief(minimum), minimum);
  assert.ok(briefSteps.some((step) => step.id === "assets"));
  const ids = briefSteps.flatMap((step) => step.fields);
  assert.equal(new Set(ids).size, briefFields.length);
  assert.deepEqual(new Set(ids), new Set(briefFields.map((field) => field.id)));
  assert.ok(briefFields.every((field) => briefSteps.find((step) => step.id === field.stepId)?.fields.includes(field.id)));
  assert.ok(briefFields.filter((field) => !field.required && field.type === "radio").every((field) => field.options.some((option) => ["not_sure", "unsure"].includes(option.value))));
  assert.ok(briefFields.some((field) => field.id === "colors" && field.type === "colors"));
  assert.ok(briefFields.some((field) => field.id === "avoidColors"));
  assert.ok(briefFields.some((field) => field.id === "sensitiveData" && field.hint.includes("Do not include")));
  assert.ok(briefSteps.every((step) => !/choose a time|appointment date|book your/i.test(step.title + step.description)));
});

test("a client can be unsure, skip every substantive answer, and still send a useful contact brief", () => {
  const answers = normalizeBrief({ ...minimum, projectType: "unsure", idea: "", colors: "  ", devices: [], budgetRange: "not_sure" });
  assert.deepEqual(answers, { projectType: "unsure", budgetRange: "not_sure", contactName: "Alex", contactEmail: "alex@example.test" });
  const text = formatBriefText(answers);
  assert.match(text, /I'm not sure — I need help working it out/);
  assert.match(text, /Not sure yet — help me decide/);
  assert.doesNotMatch(text, /undefined|null|Not provided|budgetRange/);
  assert.doesNotMatch(text, /Make it feel like your business/);
});

test("changed project choices cannot accidentally send answers from a hidden path", () => {
  const raw = { ...minimum, websitePages: ["home", "contact"], appPlatforms: ["ios"], softwareTasks: "Manage stock", colors: "Full color, forest green #163D2A" };
  const web = normalizeBrief(raw);
  assert.deepEqual(web.websitePages, ["home", "contact"]);
  assert.ok(!Object.hasOwn(web, "appPlatforms"));
  assert.ok(!Object.hasOwn(web, "softwareTasks"));
  assert.equal(web.colors, raw.colors);
  const app = normalizeBrief({ ...raw, projectType: "app" });
  assert.deepEqual(app.appPlatforms, ["ios"]);
  assert.ok(!Object.hasOwn(app, "websitePages"));
  assert.ok(!Object.hasOwn(app, "softwareTasks"));
  const mixed = normalizeBrief({ ...raw, projectType: "mixed" });
  assert.deepEqual(mixed.appPlatforms, ["ios"]);
  assert.deepEqual(mixed.websitePages, ["home", "contact"]);
  assert.equal(mixed.softwareTasks, "Manage stock");
  assert.ok(!formatBriefText(raw).includes("Manage stock"));
});

test("question and answer tampering cannot alter recipients, schema, or allowed choices", () => {
  for (const unknown of ["to", "subject", "replyTo", "consent", "constructor", "__proto__"]) {
    const raw = JSON.parse(JSON.stringify(minimum));
    Object.defineProperty(raw, unknown, { value: "outside@example.test", enumerable: true });
    assert.throws(() => normalizeBrief(raw), (error) => error instanceof TypeError && error.field === unknown);
  }
  for (const raw of [null, [], false, 42, "answers", Object.create(minimum), new Date()]) assert.throws(() => normalizeBrief(raw), TypeError);
  for (const projectType of ["website<script>", [], {}, null, 12]) assert.throws(() => normalizeBrief({ ...minimum, projectType }), (error) => error.field === "projectType");
  for (const devices of [["phone", "phone"], ["injected"], ["phone", 1], "phone", null, {}]) assert.throws(() => normalizeBrief({ ...minimum, devices }), (error) => error.field === "devices");
  // Even a hidden answer must have an expected type and valid options.
  assert.throws(() => normalizeBrief({ ...minimum, appPlatforms: ["not_a_platform"] }), (error) => error.field === "appPlatforms");
  assert.equal(briefFields.find((field) => field.id === "projectType").options[0].value, "website");
  assert.throws(() => { briefFields[0].label = "Injected"; }, TypeError);
  assert.throws(() => { briefFields[0].options[0].value = "Injected"; }, TypeError);
});

test("required identity is trimmed and validated without accepting injected email headers", () => {
  assert.deepEqual(normalizeBrief({ projectType: " website ", contactName: " Alex ", contactEmail: " alex+new@example.test " }), { projectType: "website", contactName: "Alex", contactEmail: "alex+new@example.test" });
  for (const id of Object.keys(minimum)) {
    const missing = { ...minimum };
    delete missing[id];
    assert.throws(() => normalizeBrief(missing), (error) => error.field === id);
    assert.throws(() => normalizeBrief({ ...minimum, [id]: "  " }), (error) => error.field === id);
  }
  for (const contactEmail of ["a", "mailto:a@example.test", "a@@example.test", "a b@example.test", "a@-example.test", "a@example..test", ".a@example.test", "a..b@example.test", "a.@example.test", `${"a".repeat(65)}@example.test`, "a@example.test\r\nBcc: attacker@example.test"]) {
    assert.throws(() => normalizeBrief({ ...minimum, contactEmail }), (error) => error.field === "contactEmail");
  }
  for (const contactName of [null, undefined, [], {}, 12, "Alex\nBcc: attacker@example.test"]) assert.throws(() => normalizeBrief({ ...minimum, contactName }), (error) => error.field === "contactName");
});

test("real multiline ideas and color preferences survive while unsupported controls are rejected", () => {
  const value = "A café's 客户 portal 🧑‍💻\r\nWith useful order updates.";
  assert.equal(normalizeBrief({ ...minimum, idea: value }).idea, value.replace("\r\n", "\n"));
  assert.equal(normalizeBrief({ ...minimum, idea: "Features:\n\tBooking requests\n\tAn admin dashboard" }).idea, "Features:\n\tBooking requests\n\tAn admin dashboard");
  assert.equal(normalizeBrief({ ...minimum, colors: "  Blue, purple, or #ff0000 — help me decide.  " }).colors, "Blue, purple, or #ff0000 — help me decide.");
  for (const idea of ["A\u0000B", "A\u0007B", "A\u000BB", "A\u007FB", "A\u0085B", "A\uD800", "A\uDC00"]) assert.throws(() => normalizeBrief({ ...minimum, idea }), (error) => error.field === "idea");
  for (const colors of [[], {}, true, null]) assert.throws(() => normalizeBrief({ ...minimum, colors }), (error) => error.field === "colors");
  const limit = briefFields.find((field) => field.id === "idea").maxLength;
  assert.equal(normalizeBrief({ ...minimum, idea: "x".repeat(limit) }).idea.length, limit);
  assert.throws(() => normalizeBrief({ ...minimum, idea: "x".repeat(limit + 1) }), (error) => error instanceof RangeError && error.field === "idea");
  const large = { ...minimum, projectType: "mixed" };
  for (const field of briefFields.filter((field) => field.type === "textarea")) large[field.id] = "x".repeat(field.maxLength);
  assert.ok(Object.values(large).join("").length > maxBriefLength);
  assert.throws(() => normalizeBrief(large), RangeError);
});

test("an optional existing website accepts a plain domain but rejects unsafe schemes and embedded credentials", () => {
  assert.equal(normalizeBrief({ ...minimum, businessWebsite: "example.test/work" }).businessWebsite, "https://example.test/work");
  assert.equal(normalizeBrief({ ...minimum, businessWebsite: "https://example.test/" }).businessWebsite, "https://example.test/");
  for (const businessWebsite of ["javascript:alert(1)", "data:text/html,hello", "file:///tmp/a", "https://user:password@example.test", "https://example.test/ private", "not a domain", "https://example.test\nBcc: outside@example.test"]) {
    assert.throws(() => normalizeBrief({ ...minimum, businessWebsite }), (error) => error.field === "businessWebsite");
  }
});

test("summaries keep human labels, deterministic choices, and unmodified text for the email renderer to escape", () => {
  const raw = Object.freeze({ ...minimum, devices: Object.freeze(["tablet", "phone"]), idea: "<img src=x onerror=alert(1)> & a useful idea", colors: "Green", integrations: "Our CRM" });
  assert.deepEqual(normalizeBrief(raw).devices, ["phone", "tablet"]);
  assert.deepEqual(normalizeBrief(normalizeBrief(raw)), normalizeBrief(raw));
  const text = formatBriefText(raw);
  assert.match(text, /^4u Digital project brief/);
  assert.match(text, /Where should people be able to use it\?\n- On a phone\n- On a tablet/);
  assert.ok(text.includes(raw.idea));
  assert.ok(text.indexOf("Start with your idea") < text.indexOf("Where can I reply?"));
  assert.equal(text, formatBriefText(raw));
  assert.deepEqual(raw.devices, ["tablet", "phone"]);
});

test("visual styles retain saved choice values and font selections reach the summary by their human names", () => {
  const mood = briefFields.find((field) => field.id === "brandMood");
  assert.deepEqual(mood.options.map((option) => option.value), ["clean", "warm", "bold", "premium", "playful", "professional", "practical", "not_sure"]);
  const fonts = briefFields.find((field) => field.id === "fontStyle");
  assert.equal(fonts.stepId, "design");
  assert.equal(fonts.required, undefined);
  assert.deepEqual(fonts.options.map((option) => option.value), ["modern", "friendly", "editorial", "classic", "technical", "unsure"]);
  for (const font of fonts.options) {
    const answers = normalizeBrief({ ...minimum, brandMood: ["professional", "warm"], fontStyle: font.value });
    assert.equal(answers.fontStyle, font.value);
    assert.deepEqual(answers.brandMood, ["warm", "professional"]);
    const summary = formatBriefText(answers);
    assert.ok(summary.includes(`${fonts.label}\n${font.label}`));
  }
  for (const fontStyle of ["not_a_font", "<style>body{display:none}</style>", ["modern"], null]) {
    assert.throws(() => normalizeBrief({ ...minimum, fontStyle }), (error) => error.field === "fontStyle");
  }
});

test("three optional reference pairs keep each URL connected with what the client likes", () => {
  const raw = { ...minimum, projectType: "app", designReferences: "Also like the clear train station signs." };
  for (let number = 1; number <= 3; number++) {
    const urlId = `referenceUrl${number}`;
    const notesId = `referenceNotes${number}`;
    const urlField = briefFields.find((field) => field.id === urlId);
    const notesField = briefFields.find((field) => field.id === notesId);
    assert.equal(urlField.group, `reference${number}`);
    assert.equal(notesField.group, `reference${number}`);
    assert.equal(urlField.stepId, "design");
    assert.equal(notesField.stepId, "design");
    assert.equal(Boolean(urlField.advanced), number > 1);
    assert.equal(Boolean(notesField.advanced), number > 1);
    raw[urlId] = `example${number}.test/app`;
    raw[notesId] = `Reference ${number} has a clear menu and useful preview.`;
  }
  const answers = normalizeBrief(raw);
  const summary = formatBriefText(answers);
  for (let number = 1; number <= 3; number++) {
    assert.equal(answers[`referenceUrl${number}`], `https://example${number}.test/app`);
    assert.ok(summary.includes(`Reference ${number} — website or app link\nhttps://example${number}.test/app\n\nReference ${number} — what do you like about it?\n${raw[`referenceNotes${number}`]}`));
    for (const unsafe of ["javascript:alert(1)", "file:///private/photo.jpg", "https://user:secret@example.test/"]) {
      assert.throws(() => normalizeBrief({ ...minimum, [`referenceUrl${number}`]: unsafe }), (error) => error.field === `referenceUrl${number}`);
    }
  }
  assert.equal(normalizeBrief({ ...minimum, referenceNotes1: "I like a competitor's colors but do not have their link." }).referenceNotes1, "I like a competitor's colors but do not have their link.");
  assert.ok(summary.includes(raw.designReferences));
  assert.ok(!Object.hasOwn(normalizeBrief({ ...minimum, referenceUrl1: "", referenceNotes1: "" }), "referenceUrl1"));
});

test("website social profiles accept handles or URLs, remain optional, and disappear for app or software-only briefs", () => {
  const socials = {
    socialInstagram: "@ourshop",
    socialFacebook: "facebook.com/ourshop",
    socialTikTok: "@ourshopvideos",
    socialYouTube: "https://youtube.com/@ourshop",
    socialLinkedIn: "Our Shop Company",
    socialX: "@ourshopnews",
    socialPinterest: "pinterest.com/ourshop",
    socialOther: "Add our public Mastodon profile too.\nInstagram should appear first.",
  };
  for (const [id, value] of Object.entries(socials)) {
    const field = briefFields.find((entry) => entry.id === id);
    assert.equal(field.stepId, "assets");
    assert.equal(field.group, "social");
    assert.deepEqual(field.projectTypes, ["website", "mixed", "unsure"]);
    assert.equal(field.required, undefined);
    for (const projectType of ["website", "mixed", "unsure"]) assert.equal(normalizeBrief({ ...minimum, projectType, [id]: ` ${value} ` })[id], value);
    for (const projectType of ["app", "software"]) assert.ok(!Object.hasOwn(normalizeBrief({ ...minimum, projectType, [id]: value }), id));
    assert.ok(formatBriefText({ ...minimum, [id]: value }).includes(`${field.label}\n${value}`));
  }
  const summary = formatBriefText({ ...minimum, ...socials });
  for (const value of Object.values(socials)) assert.ok(summary.includes(value));
  const appSummary = formatBriefText({ ...minimum, ...socials, projectType: "app" });
  assert.doesNotMatch(appSummary, /@ourshop|facebook.com|Mastodon/);
  for (const socialInstagram of [[], {}, null, "@ourshop\nBcc: outside@example.test"]) {
    assert.throws(() => normalizeBrief({ ...minimum, socialInstagram }), (error) => error.field === "socialInstagram");
  }
  assert.equal(maxBriefLength, 60000);
});
