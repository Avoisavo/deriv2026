import http from "node:http";
import { URL } from "node:url";
import { loadEnvFile } from "./pipeline/env.js";
import { ENV_FILE } from "./pipeline/paths.js";
import { DriveSyncService } from "./mcp/driveSyncService.js";

const env = await loadEnvFile(ENV_FILE);
const PORT = Number(env.PORT || process.env.PORT || 4000);

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(payload));
}

const syncService = new DriveSyncService({ env });
await syncService.initialize();
syncService.start();

const server = http.createServer(async (req, res) => {
  if (!req.url || !req.method) {
    sendJson(res, 400, { error: "Invalid request" });
    return;
  }

  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const route = url.pathname;

  try {
    if (req.method === "GET" && route === "/api/health") {
      sendJson(res, 200, {
        ok: true,
        service: "truman-mcp-drive-client",
        time: new Date().toISOString(),
      });
      return;
    }

    if (req.method === "GET" && route === "/api/mcp/status") {
      sendJson(res, 200, syncService.getStatus());
      return;
    }

    if (req.method === "POST" && route === "/api/mcp/sync") {
      const result = await syncService.processPendingChanges("manual_api");
      sendJson(res, 200, { ok: true, result, status: syncService.getStatus() });
      return;
    }

    if (req.method === "POST" && route === "/api/mcp/drive/webhook") {
      const result = await syncService.handleWebhook(req.headers);
      sendJson(res, 200, { ok: true, result });
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : "Unexpected error" });
  }
});

process.on("SIGINT", () => {
  syncService.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  syncService.stop();
  process.exit(0);
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Truman MCP backend listening on http://localhost:${PORT}`);
});
