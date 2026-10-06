import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  fileURLToPath(new URL("../", import.meta.url)),
  process.argv[2] || ".",
);
const port = Number(process.env.PORT || 5173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
};
http
  .createServer(async (request, response) => {
    try {
      let pathname = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
      if (pathname.endsWith("/")) pathname += "index.html";
      const filename = path.resolve(root, "." + pathname);
      if (!filename.startsWith(root + path.sep)) {
        response.writeHead(403).end("Forbidden");
        return;
      }
      if (!(await stat(filename)).isFile()) throw new Error("Not a file");
      response.writeHead(200, {
        "Content-Type":
          types[path.extname(filename)] || "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      response.end(await readFile(filename));
    } catch {
      response
        .writeHead(404, { "Content-Type": "text/plain" })
        .end("Not found");
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`Portfolio: http://127.0.0.1:${port}`),
  );
