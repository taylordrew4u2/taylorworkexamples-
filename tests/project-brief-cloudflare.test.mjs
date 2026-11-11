import test from "node:test";
import assert from "node:assert/strict";
import { createProjectBriefWorker } from "../cloudflare/project-brief/worker.js";

const endpoint = "https://customtechbuilt4u.com/api/project-brief";
const origin = "https://customtechbuilt4u.com";
const recipient = "admin@customtechbuilt4u.com";
const sender = "planner@brief-mail.customtechbuilt4u.com";

function brief(overrides = {}) {
  return {
    version: 1,
    requestId: crypto.randomUUID(),
    answers: {
      projectType: "website",
      contactName: "Planner Example",
      contactEmail: "planner@example.com",
      idea: "A private brief with <example> markup.",
    },
    consent: true,
    honey: "",
    startedAt: new Date(Date.now() - 10_000).toISOString(),
    ...overrides,
  };
}

function request(answers, { source = origin, file, extra = {} } = {}) {
  const body = new FormData();
  body.set("brief", JSON.stringify(answers));
  if (file) {
    body.append("files", file);
    body.set("captions", JSON.stringify(["Example file note"]));
  }
  return new Request(endpoint, {
    method: "POST",
    headers: { Origin: source, "CF-Connecting-IP": "192.0.2.25", ...extra },
    body,
  });
}

function setup() {
  const messages = [];
  const env = {
    PROJECT_BRIEF_FROM: sender,
    PROJECT_BRIEF_EMAIL: { async send(message) { messages.push(message); return { messageId: "accepted-by-mock" }; } },
    BRIEF_IP_LIMIT: { async limit() { return { success: true }; } },
    BRIEF_LOCATION_LIMIT: { async limit() { return { success: true }; } },
  };
  const worker = createProjectBriefWorker();
  return { env, messages, handle: (input) => worker.fetch(input, env) };
}

test("sends validated answers and a reference upload to the fixed business address", async () => {
  const { handle, messages } = setup();
  const file = new File(["%PDF-1.7\nexample"], "Reference.pdf", { type: "application/pdf" });
  const response = await handle(request(brief({ to: "other@example.com" }), { file }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const receipt = await response.json();
  assert.match(receipt.reference, /^4U-[0-9A-F]{12}$/);
  assert.equal(receipt.status, "sent");
  assert.equal(messages.length, 1);
  const [message] = messages;
  assert.equal(message.to, recipient);
  assert.deepEqual(message.from, { email: sender, name: "4u Digital" });
  assert.equal(message.replyTo, "planner@example.com");
  assert.equal(message.headers["X-4u-Brief-Reference"], receipt.reference);
  assert.match(message.text, /private brief with <example> markup/);
  assert.match(message.html, /private brief with &lt;example&gt; markup/);
  assert.match(message.text, /Example file note/);
  assert.deepEqual(message.attachments, [{
    filename: "01-Reference.pdf",
    content: await file.arrayBuffer(),
    type: "application/pdf",
    disposition: "attachment",
  }]);
});

test("rejects cross-origin, fake upload, honeypot, and throttled submissions before sending", async () => {
  const { handle, env, messages } = setup();
  assert.equal((await handle(request(brief(), { source: "https://other.example.com" }))).status, 403);
  assert.equal((await handle(request(brief({ honey: "https://spam.example.com" })))).status, 400);
  const fake = new File(["fake PDF"], "reference.pdf", { type: "application/pdf" });
  const badFile = await handle(request(brief(), { file: fake }));
  assert.equal(badFile.status, 415);
  assert.equal((await badFile.json()).field, "files");
  const overLimit = await handle(request(brief(), { extra: { "Content-Length": "10485761" } }));
  assert.equal(overLimit.status, 413);
  env.BRIEF_IP_LIMIT.limit = async () => ({ success: false });
  const rateLimit = await handle(request(brief()));
  assert.equal(rateLimit.status, 429);
  assert.equal(rateLimit.headers.get("retry-after"), "60");
  assert.equal(messages.length, 0);
});

test("returns the same receipt for a fast retry and rejects reuse for different answers", async () => {
  const { handle, messages } = setup();
  const input = brief();
  const original = await (await handle(request(input))).json();
  assert.deepEqual(await (await handle(request(input))).json(), original);
  const conflict = await handle(request({ ...input, answers: { ...input.answers, idea: "Changed" } }));
  assert.equal(conflict.status, 409);
  assert.equal(messages.length, 1);
});

test("requires a send receipt and does not immediately repeat an uncertain attempt", async () => {
  const { handle, env } = setup();
  let sends = 0;
  env.PROJECT_BRIEF_EMAIL.send = async () => { sends++; return undefined; };
  const input = brief();
  const response = await handle(request(input));
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /could not confirm/);
  assert.equal((await handle(request(input))).status, 503);
  assert.equal(sends, 1);
});
