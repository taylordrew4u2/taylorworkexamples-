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
    if (/\bhero-project-screen\b/.test(tag)) {
      sizes = "(max-width: 600px) calc(100vw - 40px), (max-width: 980px) calc(50vw - 40px), (max-width: 1440px) calc(25vw - 44px), 320px";
    } else if (/\bhero-platform-screen\b/.test(tag)) {
      sizes = "(max-width: 380px) calc(100vw - 56px), (max-width: 600px) calc(50vw - 38px), (max-width: 980px) calc(50vw - 52px), (max-width: 1440px) calc(25vw - 56px), 308px";
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
