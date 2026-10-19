import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const displayWidths = [480, 800, 1200, 1600];
const rasterExtension = /\.(?:png|jpe?g|webp)$/i;
const encoderSignature = JSON.stringify({
  versions: sharp.versions,
  resize: { withoutEnlargement: true },
  profile: "srgb",
  webp: { lossless: true, effort: 4 },
});

async function encodedVariant(original, width, cacheDirectory) {
  const cachePath = path.join(cacheDirectory, `${width}.webp`);
  try {
    const data = await readFile(cachePath);
    const metadata = await sharp(data).metadata();
    return { data, info: { width: metadata.width, height: metadata.height } };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const result = await sharp(original)
    .resize({ width, withoutEnlargement: true })
    .withIccProfile("srgb")
    .webp({ lossless: true, effort: 4 })
    .toBuffer({ resolveWithObject: true });
  const temporaryPath = `${cachePath}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, result.data);
  await rename(temporaryPath, cachePath);
  return result;
}

// Original artwork stays untouched. These lossless WebP files are display copies.
export async function optimizeImages({ root, output, assets }) {
  const originals = [...new Set(assets)]
    .filter((asset) => typeof asset === "string" && rasterExtension.test(asset))
    .filter((asset) => !asset.includes("/project-icons/") && !/(?:logo|favicon)/i.test(path.basename(asset)))
    .sort();
  const results = new Map();
  const destination = path.join(output, "assets", "optimized");
  await mkdir(destination, { recursive: true });
  let next = 0;

  async function worker() {
    while (next < originals.length) {
      const asset = originals[next++];
      const sourcePath = path.resolve(root, asset);
      const relativePath = path.relative(path.join(root, "assets"), sourcePath);
      if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
        throw new Error(`Image is outside the portfolio assets directory: ${asset}`);
      }

      const original = await readFile(sourcePath);
      if (original.length < 24 * 1024) continue;
      const metadata = await sharp(original).metadata();
      if (!metadata.width || metadata.width < 400 || !metadata.height) continue;
      const sourceHash = createHash("sha256").update(original).update(encoderSignature).digest("hex");
      const cacheDirectory = path.join(root, ".image-cache", sourceHash);
      await mkdir(cacheDirectory, { recursive: true });

      const widths = [...new Set([
        ...displayWidths.filter((width) => width <= metadata.width),
        Math.min(metadata.width, 2560),
      ])].sort((first, second) => first - second);
      const slug = path.basename(asset, path.extname(asset))
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "image";
      const variants = [];

      for (const width of widths) {
        // Existing native-size WebP bytes already provide the exact source pixels.
        // Copy them rather than inflating a previously compressed image by re-encoding.
        const { data, info } = width === metadata.width && /\.webp$/i.test(asset)
          ? { data: original, info: { width: metadata.width, height: metadata.height } }
          : await encodedVariant(original, width, cacheDirectory);
        // Always retain the largest display size when smaller useful variants exist.
        // A high-density screen must not be restricted to a lower-resolution copy.
        if (data.length >= original.length && !(width === widths.at(-1) && variants.length)) continue;

        const hash = createHash("sha256").update(data).digest("hex").slice(0, 16);
        const filename = `${slug}-${hash}-${info.width}.webp`;
        await writeFile(path.join(destination, filename), data);
        variants.push({
          src: `./assets/optimized/${filename}`,
          width: info.width,
          height: info.height,
          bytes: data.length,
        });
      }

      if (variants.length) results.set(asset, variants);
    }
  }

  await Promise.all(Array.from({ length: Math.min(3, originals.length) }, worker));
  return Object.fromEntries(originals.filter((asset) => results.has(asset))
    .map((asset) => [asset, results.get(asset)]));
}
