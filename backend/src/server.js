import http from "node:http";
import { URL } from "node:url";
import { PORT } from "./config.js";
import { trumanStore } from "./services/store.js";

await trumanStore.initialize();

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(raw);
}

function parseLimit(value, fallback) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

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
  const path = url.pathname;

  try {
    if (req.method === "GET" && path === "/api/health") {
      sendJson(res, 200, { ok: true, service: "truman-backend", time: new Date().toISOString() });
      return;
    }

    if (req.method === "GET" && path === "/api/meta") {
      sendJson(res, 200, trumanStore.getOverview());
      return;
    }

    if (req.method === "GET" && path === "/api/briefing") {
      sendJson(res, 200, { cards: trumanStore.getBriefing() });
      return;
    }

    if (req.method === "GET" && path === "/api/summaries") {
      sendJson(res, 200, {
        rows: trumanStore.getSummaries({
          limit: parseLimit(url.searchParams.get("limit"), 50),
          source: url.searchParams.get("source"),
          importance: url.searchParams.get("importance"),
        }),
      });
      return;
    }

    if (req.method === "GET" && path === "/api/nodes") {
      sendJson(res, 200, {
        rows: trumanStore.getNodes({
          limit: parseLimit(url.searchParams.get("limit"), 100),
          tag: url.searchParams.get("tag"),
          entity: url.searchParams.get("entity"),
        }),
      });
      return;
    }

    if (req.method === "GET" && path === "/api/links") {
      sendJson(res, 200, {
        rows: trumanStore.getLinks({ nodeId: url.searchParams.get("node_id") }),
      });
      return;
    }

    if (req.method === "POST" && path === "/api/investigate") {
      const body = await readJsonBody(req);
      const insight = trumanStore.createInsight({
        scenarioPrompt: String(
          body?.scenario_prompt ?? "What is changing and what might happen next?"
        ),
        selectedNodeIds: Array.isArray(body?.context_node_ids)
          ? body.context_node_ids.map(String)
          : [],
      });
      sendJson(res, 201, insight);
      return;
    }

    if (req.method === "GET" && path === "/api/insights") {
      sendJson(res, 200, { rows: trumanStore.getAllInsights() });
      return;
    }

    if (req.method === "GET" && path.startsWith("/api/insights/")) {
      const insightId = path.replace("/api/insights/", "");
      const insight = trumanStore.getInsight(insightId);
      if (!insight) {
        sendJson(res, 404, { error: "Insight not found" });
        return;
      }
      sendJson(res, 200, insight);
      return;
    }

    if (req.method === "GET" && path === "/api/reality-tree") {
      const insightId = String(url.searchParams.get("insight_id") ?? "");
      if (!insightId) {
        sendJson(res, 400, { error: "insight_id is required" });
        return;
      }
      const insight = trumanStore.getInsight(insightId);
      if (!insight) {
        sendJson(res, 404, { error: "Insight not found" });
        return;
      }
      sendJson(res, 200, {
        insight_id: insightId,
        scenario_prompt: insight.scenario_prompt,
        reality_tree: insight.reality_tree,
        beliefs: insight.beliefs,
        outcomes: insight.outcomes,
      });
      return;
    }

    if (req.method === "POST" && path === "/api/inject-evidence") {
      const body = await readJsonBody(req);
      const contentText = String(body?.content_text ?? "").trim();
      if (!contentText) {
        sendJson(res, 400, { error: "content_text is required" });
        return;
      }
      const result = trumanStore.injectEvidence({
        title: body?.title,
        source: body?.source,
        contentText,
        targetInsightId: body?.target_insight_id,
      });
      sendJson(res, 201, result);
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : "Unexpected error" });
  }
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Truman backend listening on http://localhost:${PORT}`);
});
