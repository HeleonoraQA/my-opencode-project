import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const port = Number(process.env.PORT ?? 8123);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

createServer(async (request, response) => {
  const { pathname } = new URL(request.url, `http://127.0.0.1:${port}`);
  const relative = decodeURIComponent(pathname === "/" ? "/calculator.html" : pathname);
  const filePath = normalize(join(root, relative));

  if (!filePath.startsWith(root + sep)) {
    response.writeHead(403).end("forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    response.writeHead(200, {
      "content-type": contentTypes[extname(filePath)] ?? "application/octet-stream",
    });
    response.end(body);
  } catch {
    response.writeHead(404).end("not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`calculator fixture on http://127.0.0.1:${port}`);
});
