import test from "node:test";
import assert from "node:assert/strict";
import { initAnalytics, sanitizeAnalyticsEvent, trackContact } from "../analytics.js";

function fixture({ path = "/", enabled = true, robots = "index, follow", privacy = {}, host = "https://customtechbuilt4u.com" } = {}) {
  const calls = [];
  const listeners = [];
  const scripts = [];
  const meta = { content: enabled ? "vercel" : "" };
  const doc = {
    querySelector(selector) {
      if (selector === 'meta[name="built4u-analytics"]') return meta;
      if (selector === 'meta[name="robots"]') return { content: robots };
      if (selector === 'link[rel="canonical"]') return { getAttribute: () => `https://customtechbuilt4u.com${path}` };
      if (selector === 'script[data-built4u-analytics]') return scripts[0] || null;
      if (selector.includes('input[name="format"]')) return { value: "zoom" };
      return null;
    },
    createElement: () => ({ dataset: {} }),
    head: { appendChild: (script) => scripts.push(script) },
    addEventListener: (type, handler) => listeners.push({ type, handler }),
  };
  const win = {
    location: new URL(`${host}${path}`), navigator: privacy,
    va: (...args) => calls.push(args),
  };
  const click = (link) => listeners.filter(({ type }) => type === "click").forEach(({ handler }) =>
    handler({ target: { closest: () => link } }));
  return { doc, win, calls, scripts, listeners, meta, click };
}

function link(href, { id = "", format, panel = false } = {}) {
  return {
    id, dataset: format ? { consultationFormat: format } : {},
    getAttribute: () => href,
    hasAttribute: (name) => name === "data-consultation-format" && Boolean(format),
    closest: () => panel ? {} : null,
  };
}

function events(setup) { return setup.calls.filter(([type]) => type === "event").map(([, event]) => event); }

test("analytics removes query strings and fragments and rejects unknown or external pages", () => {
  for (const type of ["pageview", "event"]) {
    assert.deepEqual(sanitizeAnalyticsEvent({
      type, url: "https://customtechbuilt4u.com/work/bill-spilt/?email=private@example.com#private-note",
      email: "private@example.com", body: "A private project",
    }), { type, url: "https://customtechbuilt4u.com/work/bill-spilt/" });
  }
  for (const url of [
    "https://customtechbuilt4u.com/private/customer-name/", "https://customtechbuilt4u.com/404.html",
    "https://example.com/", "http://customtechbuilt4u.com/", "mailto:admin@customtechbuilt4u.com", "invalid",
  ]) assert.equal(sanitizeAnalyticsEvent({ type: "event", url }), null);
  assert.equal(sanitizeAnalyticsEvent({ type: "unexpected", url: "https://customtechbuilt4u.com/" }), null);
  assert.equal(sanitizeAnalyticsEvent(null), null);
});

test("disabled, private, unknown, local, and preview pages never initialize tracking", () => {
  for (const options of [
    { enabled: false }, { robots: "NOINDEX, follow" }, { path: "/404.html" },
    { path: "/not-public/" }, { host: "http://127.0.0.1:4173" },
    { host: "https://example.vercel.app" }, { privacy: { globalPrivacyControl: true } },
    { privacy: { doNotTrack: "1" } },
  ]) {
    const setup = fixture(options);
    assert.equal(initAnalytics(setup.doc, setup.win), false);
    assert.equal(setup.calls.length, 0);
    assert.equal(setup.scripts.length, 0);
    assert.equal(setup.listeners.length, 0);
  }
});

test("initialization is idempotent and registers redaction before loading the provider", () => {
  const setup = fixture();
  assert.equal(initAnalytics(setup.doc, setup.win), true);
  assert.equal(initAnalytics(setup.doc, setup.win), false);
  assert.equal(setup.listeners.length, 1);
  assert.equal(setup.scripts.length, 1);
  assert.equal(setup.scripts[0].src, "/_vercel/insights/script.js");
  assert.equal(setup.scripts[0].defer, true);
  assert.equal(setup.calls[0][0], "beforeSend");
  assert.deepEqual(setup.calls[0][1]({ type: "pageview", url: "https://customtechbuilt4u.com/?note=private" }),
    { type: "pageview", url: "https://customtechbuilt4u.com/" });
  setup.win.navigator.globalPrivacyControl = true;
  assert.equal(setup.calls[0][1]({ type: "pageview", url: "https://customtechbuilt4u.com/" }), null);
});

test("dynamic inquiry clicks send only the public page and a fixed action", () => {
  const setup = fixture({ path: "/work/bill-spilt/" });
  initAnalytics(setup.doc, setup.win);
  setup.click(link("mailto:admin@customtechbuilt4u.com?subject=Private&body=Name%20private%40example.com"));
  assert.deepEqual(events(setup), [{ name: "Contact intent", data: { page: "/work/bill-spilt/", action: "email" } }]);
  assert.doesNotMatch(JSON.stringify(events(setup)), /private|subject|body|mailto/i);
});

test("consultation email actions distinguish safe formats and preserve the originating public page", () => {
  const setup = fixture();
  setup.win.location = new URL("https://customtechbuilt4u.com/?from=%2Fservices%2Fwebsite-development%2F&note=secret#consultation");
  initAnalytics(setup.doc, setup.win);
  setup.click(link("mailto:admin@customtechbuilt4u.com?body=secret", { id: "consultation-email" }));
  setup.click(link("mailto:admin@customtechbuilt4u.com", { format: "in-person" }));
  assert.deepEqual(events(setup).map(({ data }) => data), [
    { page: "/services/website-development/", action: "consultation-email-zoom" },
    { page: "/services/website-development/", action: "consultation-email-in-person" },
  ]);
});

test("request clicks are attributed to the page carrying the consultation button", () => {
  const setup = fixture({ path: "/services/website-development/" });
  initAnalytics(setup.doc, setup.win);
  setup.click(link("../../?from=%2Fservices%2Fwebsite-development%2F#consultation"));
  setup.click(link("https://example.com/#consultation"));
  setup.click(link("../../#services"));
  assert.deepEqual(events(setup), [{ name: "Contact intent", data: {
    page: "/services/website-development/", action: "consultation-request",
  } }]);
});

test("explicit copy hooks accept only approved actions and known public source paths", () => {
  const setup = fixture();
  const previous = globalThis.document;
  globalThis.document = setup.doc;
  try {
    initAnalytics(setup.doc, setup.win);
    assert.equal(trackContact("consultation-copy-in-person", "/services/website-development/"), true);
    assert.equal(trackContact("email-copy", "/"), true);
    assert.equal(trackContact("Sent an email", "/"), false);
    assert.equal(trackContact("email", "/?email=private@example.com"), false);
    assert.equal(trackContact("email", "/customer/private-name/"), false);
    assert.equal(events(setup).length, 2);
    setup.win.navigator.doNotTrack = "1";
    assert.equal(trackContact("email", "/"), false);
    assert.equal(events(setup).length, 2);
  } finally {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  }
});

test("provider failures never throw into contact behavior", () => {
  const setup = fixture();
  setup.win.va = () => { throw new Error("Analytics blocked"); };
  assert.doesNotThrow(() => initAnalytics(setup.doc, setup.win));
  assert.doesNotThrow(() => setup.click(link("mailto:admin@customtechbuilt4u.com")));
  const previous = globalThis.document;
  globalThis.document = setup.doc;
  try { assert.equal(trackContact("consultation-copy"), false); }
  finally {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  }
});
