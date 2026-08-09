// Local development runner for the Daily Work Log system.
//
// Emulates the Cloudflare D1 HTTP API (https://api.cloudflare.com/client/v4/
// accounts/{account}/d1/database/{db}/query) using Node's built-in SQLite, so
// the Hono customer / work-log API runs fully on local without Cloudflare
// credentials. Data persists to ./data/local-d1.db.
//
// Usage:  npm run dev:local

import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const dbFile = path.join(dataDir, "local-d1.db");
const schemaFile = path.join(rootDir, "schemas", "schema.sql");
const tsxCli = path.join(rootDir, "node_modules", "tsx", "dist", "cli.mjs");

const D1_PORT = 8787;
const APP_PORT = 3000;

function initDb() {
  mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(dbFile);
  db.exec(readFileSync(schemaFile, "utf8"));
  return db;
}

function startD1Server(db) {
  return createServer((req, res) => {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, errors: [{ message: "method not allowed" }] }));
      return;
    }

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      let payload;
      try {
        payload = JSON.parse(body);
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, errors: [{ message: "bad json" }] }));
        return;
      }

      const results = [];
      try {
        const params = Array.isArray(payload.params) ? payload.params : [];
        const bound = [];
        // D1 REST API uses ?1..?N numbered placeholders; node:sqlite uses plain ?.
        const sql = payload.sql.replace(/\?(\d+)/g, (_m, num) => {
          bound.push(params[Number(num) - 1]);
          return "?";
        });
        const rows = db.prepare(sql).all(...bound);
        results.push({
          success: true,
          meta: { changed_db: true, changes: 1, last_row_id: 0, duration: 0.1 },
          results: rows,
        });
      } catch (err) {
        results.push({ success: false, error: String(err && err.message ? err.message : err) });
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ result: results, success: true, errors: [], messages: [] }));
    });
  });
}

const db = initDb();
const d1Server = startD1Server(db);

d1Server.listen(D1_PORT, () => {
  console.log(`[local-d1] D1-compatible SQLite listening on http://localhost:${D1_PORT} (db: ${dbFile})`);
});

const child = spawn(process.execPath, [tsxCli, "server.ts"], {
  cwd: rootDir,
  stdio: "inherit",
  env: {
    ...process.env,
    CF_ACCOUNT_ID: "local",
    CF_API_TOKEN: "local",
    CF_D1_DATABASE_ID: "local",
    CF_D1_API_URL: `http://localhost:${D1_PORT}`,
  },
});

console.log(`[dev-local] Starting app on http://localhost:${APP_PORT}/api/v1`);

child.on("exit", (code, signal) => {
  d1Server.close(() => process.exit(code ?? 0));
  if (signal) process.exit(0);
});

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
