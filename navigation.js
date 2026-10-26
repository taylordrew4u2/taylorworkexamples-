const initializedHeaders = new WeakSet();

// Enhance a complete header only. If this module cannot load, its links remain
// available in the server-rendered navigation instead of a non-working menu.
export function initNavigation(doc = document) {
  const header = doc.querySelector(".site-header");
  const button = header?.querySelector(".menu-toggle");
  const navigation = header?.querySelector("nav#main-nav");
  const win = doc.defaultView;
  if (!header || !button || !navigation || !win || button.getAttribute("aria-controls") !== navigation.id) return false;
  if (initializedHeaders.has(header)) return true;

  const desktop = win.matchMedia("(min-width: 901px)");
  const isOpen = () => button.getAttribute("aria-expanded") === "true";
  let lastFocusWasNavigation = navigation.contains(doc.activeElement);
  function close({ restoreFocus = false } = {}) {
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Open navigation");
    navigation.classList.remove("is-open");
    if (restoreFocus) button.focus({ preventScroll: true });
  }

  button.type = "button";
  button.addEventListener("click", () => {
    const expanded = !isOpen();
    button.setAttribute("aria-expanded", String(expanded));
    button.setAttribute("aria-label", expanded ? "Close navigation" : "Open navigation");
    navigation.classList.toggle("is-open", expanded);
  });
  navigation.addEventListener("click", (event) => {
    const link = event.target.closest?.("a[href]");
    if (link) close({ restoreFocus: link.target === "_blank" });
  });
  doc.addEventListener("click", (event) => {
    if (!navigation.contains(event.target)) lastFocusWasNavigation = false;
    if (isOpen() && !header.contains(event.target)) {
      close({ restoreFocus: navigation.contains(doc.activeElement) });
    }
  });
  doc.addEventListener("focusin", (event) => {
    // A breakpoint can hide a focused link before its media-query callback,
    // leaving focus on body. Remember the last real control until the user
    // explicitly focuses or clicks elsewhere.
    if (event.target !== doc.body && event.target !== doc.documentElement) {
      lastFocusWasNavigation = navigation.contains(event.target);
    }
    if (isOpen() && !header.contains(event.target)) close();
  });
  doc.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen()) {
      event.preventDefault();
      close({ restoreFocus: true });
    }
  });
  desktop.addEventListener("change", () => {
    const active = doc.activeElement;
    const focusDropped = (!active || active === doc.body || active === doc.documentElement) && lastFocusWasNavigation;
    close({ restoreFocus: !desktop.matches && (navigation.contains(active) || focusDropped) });
  });

  close();
  initializedHeaders.add(header);
  header.classList.add("navigation-ready");
  doc.documentElement.classList.add("js-enabled");
  return true;
}

if (typeof document !== "undefined") initNavigation();
