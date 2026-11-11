import { contactPages } from "./contact-pages.js?v=50";

export const contactOrigin = "https://customtechbuilt4u.com";
const publicPaths = new Set(contactPages);

// Attribution accepts only known public pages, never arbitrary URLs or typed text.
export function normalizeSource(value) {
  return typeof value === "string" && publicPaths.has(value) ? value : null;
}

export function sourceURL(value) {
  return `${contactOrigin}${normalizeSource(value) || "/"}`;
}

export function getContactPage(doc = document) {
  try {
    const url = new URL(doc.querySelector('link[rel="canonical"]')?.getAttribute("href"));
    return url.origin === contactOrigin ? normalizeSource(url.pathname) : null;
  } catch { return null; }
}

export function addInquirySource(href, source) {
  try {
    const url = new URL(href);
    if (url.protocol !== "mailto:" || url.pathname !== "admin@customtechbuilt4u.com") return href;
    const previous = url.searchParams.get("body") || "";
    // Replace only our terminal attribution line; preserve the actual inquiry.
    const body = previous.replace(/\n\nSource page: https:\/\/customtechbuilt4u\.com\/[^\n]*$/, "");
    url.searchParams.set("body", `${body}${body ? "\n\n" : ""}Source page: ${sourceURL(source)}`);
    return url.href;
  } catch { return href; }
}
