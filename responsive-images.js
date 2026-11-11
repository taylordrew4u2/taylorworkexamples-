export const gallerySizes = "auto, (max-width: 600px) calc(100vw - 40px), (max-width: 980px) calc(100vw - 64px), 640px";

// Keep src and full-size links on the original. Only display delivery uses copies.
export function responsiveAttributes(source, sizes, variants) {
  const candidates = variants[source];
  if (!candidates?.length) return "";
  const attribute = (value) => String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return ` srcset="${attribute(candidates.map(({ src, width }) => `${src} ${width}w`).join(", "))}" sizes="${attribute(sizes)}"`;
}
