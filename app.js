import "./navigation.js?v=50";

// Keep previously shared portfolio anchors useful after moving work to its own page.
function followLegacyProjectLink() {
  const destination = {
    "#work": "./work/",
    "#project-archive": "./work/",
    "#app-store-proof": "./work/#app-store-proof",
  }[window.location.hash];
  if (destination) window.location.replace(destination);
}
followLegacyProjectLink();
window.addEventListener("hashchange", followLegacyProjectLink);
