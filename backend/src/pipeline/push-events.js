import fs from "node:fs/promises";
import path from "node:path";
import { ROOT } from "./paths.js";

function chunkArray(values, chunkSize) {
  const chunks = [];
  for (let i = 0; i < values.length; i += chunkSize) {
    chunks.push(values.slice(i, i + chunkSize));
  }
  return chunks;
}

function normalizeUrl(url) {
  return String(url || "").replace(/\/+$/, "");
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function pushBatch({ supabaseUrl, serviceRoleKey, table, rows }) {
  const endpoint = `${supabaseUrl}/rest/v1/${encodeURIComponent(table)}?on_conflict=event_id`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase upsert failed (${res.status}): ${body}`);
  }
}

export async function runEventPush({
  inputFile,
  table = "truman_events",
  batchSize = 200,
  supabaseUrl,
  serviceRoleKey,
  onBatch,
}) {
  const normalizedUrl = normalizeUrl(supabaseUrl);
  if (!normalizedUrl) throw new Error("Missing SUPABASE_URL in backend/.env or environment.");
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in backend/.env or environment.");
  }

  const absoluteInputFile = path.isAbsolute(inputFile) ? inputFile : path.resolve(ROOT, inputFile);
  const payload = await readJson(absoluteInputFile);
  const crawlGeneratedAt = payload.generated_at ?? null;
  const events = Array.isArray(payload.events) ? payload.events : [];

  if (events.length === 0) {
    return { inputFile: absoluteInputFile, table, pushedCount: 0, batches: 0 };
  }

  const now = new Date().toISOString();
  const createdAt =
    typeof crawlGeneratedAt === "string" && !Number.isNaN(Date.parse(crawlGeneratedAt))
      ? new Date(crawlGeneratedAt).toISOString()
      : now;

  const rows = events.map((event) => ({
    event_id: String(event.event_id),
    source_key: String(event.source_key ?? ""),
    domain: String(event.domain ?? ""),
    title: String(event.title ?? ""),
    summary: String(event.summary ?? ""),
    evidence: Array.isArray(event.evidence) ? event.evidence : [],
    created_at: createdAt,
  }));

  const chunks = chunkArray(rows, Math.max(1, Number(batchSize) || 200));
  for (let i = 0; i < chunks.length; i += 1) {
    await pushBatch({
      supabaseUrl: normalizedUrl,
      serviceRoleKey,
      table,
      rows: chunks[i],
    });
    if (typeof onBatch === "function") {
      onBatch({ batchIndex: i + 1, totalBatches: chunks.length, rowCount: chunks[i].length });
    }
  }

  return {
    inputFile: absoluteInputFile,
    table,
    pushedCount: rows.length,
    batches: chunks.length,
  };
}
