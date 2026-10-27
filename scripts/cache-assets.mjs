import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { responsiveAttributes, gallerySizes } from "../responsive-images.js";
import { site } from "../seo-content.js";

const base = "https://portfolio.invalid";
const relative = (route, target) => {
  const directory = route.endsWith("/") ? route : path.posix.dirname(route);
  const value = path.posix.relative(directory, `/${target.replace(/^\.\//, "")}`);
  return value.startsWith(".") ? value : `./${value}`;
};

export function responsiveHTML(html, route, manifest) {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const source = tag.match(/\bsrc="([^"]+)"/)?.[1];
    if (!source || /\bsrcset=/.test(tag)) return tag;
    const url = new URL(source, `${base}${route}`);
    if (url.origin !== base) return tag;
    const key = `.${url.pathname}`;
    if (!manifest[key]?.length) return tag;
    const variants = { [source]: manifest[key].map((variant) => ({ ...variant, src: relative(route, variant.src) })) };
    let sizes = /loading="lazy"/.test(tag) ? gallerySizes
      : "(max-width: 600px) calc(100vw - 40px), (max-width: 1200px) calc(100vw - 64px), 1136px";
    // Homepage previews stack through 700px, then share the capped 72rem wrap.
    if (/\bsimple-project-image\b/.test(tag)) {
      sizes = "(max-width: 700px) calc(100vw - 2.5rem), (max-width: 1232px) calc(33.333vw - 2.667rem), 368px";
    // The older hero uses full-width media through 900px, then a 60/40 split.
    } else if (/\bhero-project-screen\b/.test(tag)) {
      sizes = "(max-width: 600px) calc(100vw - 2.5rem), (max-width: 800px) calc(100vw - 3rem), (max-width: 900px) calc(100vw - 4rem), (max-width: 1100px) calc(40vw - 2.1rem), (max-width: 88rem) calc(40vw - 2.9rem), 32.3rem";
    } else if (/\bhero-platform-screen\b/.test(tag)) {
      sizes = "(max-width: 600px) calc(100vw - 2.5rem), (max-width: 800px) calc(100vw - 3rem), (max-width: 900px) calc(100vw - 4rem), (max-width: 1100px) calc(60vw - 3.15rem), (max-width: 88rem) calc(60vw - 4.35rem), 48.45rem";
    } else if (/\bhero-choice-screen\b/.test(tag)) {
      sizes = "64px";
    } else if (/\bservice-example-image\b/.test(tag)) {
      sizes = "(max-width: 600px) calc(100vw - 8rem), (max-width: 900px) calc(100vw - 10rem), 22rem";
    } else if (/^\/work\/[^/]+\/$/.test(route) && /fetchpriority="high"/.test(tag)) {
      sizes = "(max-width: 600px) calc(100vw - 40px), (max-width: 1050px) calc(100vw - 64px), (max-width: 1440px) calc(61.4vw - 100px), 766px";
    }
    return tag.replace(/\s*\/?>(?=$)/, `${responsiveAttributes(source, sizes, variants)}$&`);
  });
}

export async function fingerprintAssets({ output, names, routes }) {
  const files = await Promise.all([...names].sort().map(async (name) => [name, await readFile(path.join(output, name))]));
  // Version the entire module graph together, including the generated image map.
  // Relative imports keep one module instance, and every changed byte gets a new URL.
  const digest = createHash("sha256");
  for (const [name, content] of files) digest.update(name).update("\0").update(content).update("\0");
  const version = digest.digest("hex").slice(0, 16);
  const prefix = `static/${version}`;
  await mkdir(path.join(output, prefix), { recursive: true });
  for (const [name, content] of files) await writeFile(path.join(output, prefix, name), content);
  const allowed = new Set(names);
  for (const route of routes) {
    const file = path.join(output, route.replace(/^\//, ""), route.endsWith("/") ? "index.html" : "");
    const html = await readFile(file, "utf8");
    const updated = html.replace(/\b(src|href)="([^"]+)"/g, (match, attribute, value) => {
      const url = new URL(value, `${base}${route}`);
      const name = url.pathname.slice(1);
      if (![base, site.origin].includes(url.origin) || !allowed.has(name)) return match;
      // 404 pages use absolute primary-domain assets so deep missing URLs work too.
      const reference = url.origin === site.origin ? `${site.origin}/${prefix}/${name}` : relative(route, `${prefix}/${name}`);
      return `${attribute}="${reference}${url.search}${url.hash}"`;
    });
    await writeFile(file, updated);
  }
  return version;
}
