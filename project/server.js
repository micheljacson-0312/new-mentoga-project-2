import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, "dist");
const indexFile = path.join(distDir, "index.html");
const port = Number(process.env.PORT || 3000);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

const sendFile = (res, filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { "Content-Type": contentTypes[ext] || "application/octet-stream" });
  createReadStream(filePath).pipe(res);
};

const server = http.createServer(async (req, res) => {
  if (!existsSync(distDir)) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Build output not found. Run 'npm run build' first.");
    return;
  }

  const requestPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const safePath = path.normalize(requestPath).replace(/^([.][.][/\\])+/, "");
  const filePath = path.join(distDir, safePath === "/" ? "index.html" : safePath);

  try {
    const fileStats = await stat(filePath);
    if (fileStats.isFile()) {
      sendFile(res, filePath);
      return;
    }
  } catch {}

  sendFile(res, indexFile);
});

server.listen(port, () => {
  console.log(`Mentoga server listening on port ${port}`);
});
