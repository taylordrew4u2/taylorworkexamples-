import { bookingURL } from "./booking.js?v=47";
import { getContactPage, normalizeSource, sourceURL } from "./contact-context.js?v=47";

const controllers = new WeakMap();
const eventName = "Contact intent";
const actions = new Set(["email", "email-copy", "consultation-booking"]);

function trackingAllowed(doc, win) {
  const enabled = doc.querySelector('meta[name="built4u-analytics"]')?.content === "vercel";
  const robots = doc.querySelector('meta[name="robots"]')?.content || "";
  const navigator = win.navigator || {};
  return enabled && !/\bnoindex\b/i.test(robots) && Boolean(getContactPage(doc)) &&
    win.location?.protocol === "https:" && win.location.hostname === "customtechbuilt4u.com" &&
    Boolean(normalizeSource(win.location.pathname)) &&
    navigator.globalPrivacyControl !== true &&
    navigator.doNotTrack !== "1" && win.doNotTrack !== "1";
}

// The provider only receives approved public paths, with no query or fragment values.
export function sanitizeAnalyticsEvent(event) {
  if (!event || !["pageview", "event"].includes(event.type) || typeof event.url !== "string") return null;
  try {
    const url = new URL(event.url);
    if (url.origin !== "https://customtechbuilt4u.com") return null;
    const path = normalizeSource(url.pathname);
    return path ? { type: event.type, url: sourceURL(path) } : null;
  } catch {
    return null;
  }
}

// A true return means an intent was queued, never that an email was sent or a meeting booked.
export function trackContact(action, page) {
  const doc = typeof document === "undefined" ? null : document;
  const controller = doc && controllers.get(doc);
  return controller ? controller.track(action, page) : false;
}

export function initAnalytics(doc = globalThis.document, win = globalThis.window) {
  if (!doc || !win || controllers.has(doc) || !trackingAllowed(doc, win)) return false;
  if (typeof win.va !== "function") {
    win.va = function () { (win.vaq = win.vaq || []).push(arguments); };
  }

  function track(action, page = getContactPage(doc)) {
    const source = normalizeSource(page);
    if (!actions.has(action) || !source || !trackingAllowed(doc, win)) return false;
    try {
      win.va("event", { name: eventName, data: { page: source, action } });
      return true;
    } catch {
      return false;
    }
  }

  function onClick(event) {
    const link = event.target?.closest?.("a[href]");
    if (!link) return;
    const href = link.getAttribute("href") || "";
    if (/^mailto:/i.test(href)) {
      track("email");
      return;
    }
    try {
      const destination = new URL(href, win.location.href);
      if (link.hasAttribute("data-booking-link") && destination.href === bookingURL) {
        track("consultation-booking");
      }
    } catch {
      // Malformed links and an unavailable analytics provider leave contact actions usable.
    }
  }

  controllers.set(doc, { track });
  doc.addEventListener("click", onClick, true);
  try {
    win.va("beforeSend", (event) => trackingAllowed(doc, win) ? sanitizeAnalyticsEvent(event) : null);
    if (!doc.querySelector('script[data-built4u-analytics]')) {
      const script = doc.createElement("script");
      script.src = "/_vercel/insights/script.js";
      script.defer = true;
      script.dataset.built4uAnalytics = "vercel";
      doc.head.appendChild(script);
    }
  } catch {
    // Analytics errors must never prevent email or consultation actions.
  }
  return true;
}

if (typeof document !== "undefined") initAnalytics();
