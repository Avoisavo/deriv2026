import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { DATA_DIR } from "./paths.js";

const execFileAsync = promisify(execFile);

export const DEFAULT_INPUT_FILES = [
  {
    key: "finance_procurement",
    domain: "finance",
    path: path.resolve(DATA_DIR, "finance_procurement_official_report_~2000w.docx"),
    type: "docx",
  },
  {
    key: "support_customer_success",
    domain: "support",
    path: path.resolve(DATA_DIR, "customer_support_tickets_5000.csv"),
    type: "csv",
  },
  {
    key: "ops_it",
    domain: "operations",
    path: path.resolve(DATA_DIR, "ops_it_alert_stream_100.json"),
    type: "json",
  },
];

export const DEFAULT_OUTPUT_FILE = path.resolve(DATA_DIR, "truman_events_from_ai_crawl.json");

function csvToRows(csvText) {
  const lines = csvText.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map((x) => x.trim());
  const rows = [];
  for (const line of lines.slice(1)) {
    const cols = line.split(",");
    const row = {};
    for (let i = 0; i < headers.length; i += 1) {
      row[headers[i]] = (cols[i] ?? "").trim();
    }
    rows.push(row);
  }
  return rows;
}

function sumBy(rows, keyField, valueField) {
  const map = new Map();
  for (const row of rows) {
    const key = row[keyField] || "unknown";
    const raw = valueField ? row[valueField] : 1;
    const value = Number(raw);
    map.set(key, (map.get(key) ?? 0) + (Number.isFinite(value) ? value : 1));
  }
  return [...map.entries()]
    .map(([key, value]) => ({ key, value: Number(value.toFixed(3)) }))
    .sort((a, b) => b.value - a.value);
}

function avgBy(rows, keyField, valueField) {
  const map = new Map();
  for (const row of rows) {
    const key = row[keyField] || "unknown";
    const value = Number(row[valueField] ?? 0);
    if (!Number.isFinite(value)) continue;
    const cur = map.get(key) ?? { total: 0, count: 0 };
    cur.total += value;
    cur.count += 1;
    map.set(key, cur);
  }
  return [...map.entries()]
    .map(([key, x]) => ({ key, avg: Number((x.total / Math.max(1, x.count)).toFixed(3)) }))
    .sort((a, b) => b.avg - a.avg);
}

function summarizeSupportCsv(csvText) {
  const rows = csvToRows(csvText);
  const totalTickets = rows.reduce((acc, r) => acc + Number(r.tickets || 0), 0);
  const avgFirstResponse =
    rows.reduce((acc, r) => acc + Number(r.avg_first_response_min || 0), 0) /
    Math.max(1, rows.length);
  const avgSentiment =
    rows.reduce((acc, r) => acc + Number(r.sentiment_score || 0), 0) / Math.max(1, rows.length);

  const byTopic = sumBy(rows, "top_topic", "tickets").slice(0, 8);
  const byRegion = sumBy(rows, "region", "tickets");
  const slowByTopic = avgBy(rows, "top_topic", "avg_first_response_min").slice(0, 5);
  const worstSentimentByTopic = avgBy(rows, "top_topic", "sentiment_score")
    .reverse()
    .slice(0, 5);
  const topTicketHours = [...rows]
    .map((r) => ({
      timestamp: r.timestamp,
      region: r.region,
      top_topic: r.top_topic,
      tickets: Number(r.tickets || 0),
      avg_first_response_min: Number(r.avg_first_response_min || 0),
      sentiment_score: Number(r.sentiment_score || 0),
    }))
    .sort((a, b) => b.tickets - a.tickets)
    .slice(0, 12);

  return {
    row_count: rows.length,
    time_range: {
      start: rows[0]?.timestamp ?? null,
      end: rows[rows.length - 1]?.timestamp ?? null,
    },
    totals: {
      total_tickets: totalTickets,
      avg_first_response_min: Number(avgFirstResponse.toFixed(2)),
      avg_sentiment_score: Number(avgSentiment.toFixed(3)),
    },
    by_region_tickets: byRegion,
    by_topic_tickets: byTopic,
    slow_topics_avg_first_response: slowByTopic,
    worst_sentiment_topics: worstSentimentByTopic,
    top_ticket_hours: topTicketHours,
  };
}

function summarizeOpsJson(jsonText) {
  const parsed = JSON.parse(jsonText);
  const items = Array.isArray(parsed?.items) ? parsed.items : [];
  const bySeverity = sumBy(items, "severity");
  const byService = sumBy(items, "service");
  const byRegion = sumBy(items, "region");

  const metricBreaches = [];
  for (const item of items) {
    const metrics = item?.payload?.metrics ?? {};
    const thresholds = item?.payload?.thresholds ?? {};
    for (const [metricKey, metricVal] of Object.entries(metrics)) {
      const warnKey = `${metricKey}_warn`;
      const threshold = thresholds[warnKey];
      if (typeof metricVal !== "number" || typeof threshold !== "number") continue;
      if (metricVal >= threshold) {
        metricBreaches.push({
          id: item.id,
          timestamp: item.timestamp,
          service: item.service,
          region: item.region,
          metric: metricKey,
          value: metricVal,
          warn_threshold: threshold,
          severity: item.severity,
        });
      }
    }
  }

  const highPressure = [...items]
    .filter((x) => {
      const m = x?.payload?.metrics ?? {};
      return (
        (typeof m.error_rate_pct === "number" && m.error_rate_pct > 1.5) ||
        (typeof m.p95_latency_ms === "number" && m.p95_latency_ms > 1200) ||
        (typeof m.dns_latency_ms === "number" && m.dns_latency_ms > 65)
      );
    })
    .map((x) => ({
      id: x.id,
      timestamp: x.timestamp,
      region: x.region,
      service: x.service,
      severity: x.severity,
      message: x.message,
      metrics: x?.payload?.metrics ?? {},
    }))
    .slice(0, 25);

  return {
    item_count: items.length,
    time_range: {
      start: items[0]?.timestamp ?? null,
      end: items[items.length - 1]?.timestamp ?? null,
    },
    counts: {
      by_severity: bySeverity,
      by_service: byService.slice(0, 10),
      by_region: byRegion,
    },
    high_pressure_samples: highPressure,
    explicit_threshold_breaches: metricBreaches.slice(0, 30),
  };
}

async function docxToText(filePath) {
  const { stdout } = await execFileAsync("textutil", ["-convert", "txt", "-stdout", filePath], {
    maxBuffer: 1024 * 1024 * 8,
  });
  return stdout;
}

function cleanJsonPayload(rawText) {
  const trimmed = rawText.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return trimmed;
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (match?.[1]) return match[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

async function callGroqForEvents({ apiKey, model, sourceKey, domain, evidenceDigest, maxEvents }) {
  const system = [
    "You are Truman event extraction model.",
    "Return strict JSON only. No markdown, no commentary.",
    "Extract concrete discoveries from evidence.",
    "One source can produce multiple events.",
    "Each event must have these fields:",
    "event_id, source_key, domain, title, summary, evidence.",
    "Rules:",
    "domain must be short lowercase (finance|support|operations|product|security|hr).",
    "summary must be <= 2 sentences and specific.",
    "evidence must include at least one concrete metric/value or direct policy trigger.",
    `Create 4 to ${maxEvents} events.`,
    "Output schema:",
    '{"events":[{"event_id":"...","source_key":"...","domain":"...","title":"...","summary":"...","evidence":["..."]}]}',
  ].join("\n");

  const user = JSON.stringify(
    {
      source_key: sourceKey,
      expected_domain: domain,
      evidence_digest: evidenceDigest,
    },
    null,
    2
  );

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Groq request failed (${response.status}): ${errBody}`);
  }

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq response missing content");
  const parsed = JSON.parse(cleanJsonPayload(content));
  const events = Array.isArray(parsed?.events) ? parsed.events : [];

  return events.map((event, idx) => ({
    event_id: String(event.event_id ?? `${sourceKey}_ev_${String(idx + 1).padStart(3, "0")}`),
    source_key: sourceKey,
    domain: String(event.domain ?? domain).toLowerCase(),
    title: String(event.title ?? "Untitled discovery"),
    summary: String(event.summary ?? "").trim(),
    evidence: Array.isArray(event.evidence) ? event.evidence.map((x) => String(x)) : [],
  }));
}

async function buildEvidenceDigest(entry) {
  if (entry.type === "docx") {
    const docText = await docxToText(entry.path);
    return {
      type: "docx_report",
      excerpt: docText.slice(0, 14000),
      note: "Official finance/procurement report excerpt.",
    };
  }

  if (entry.type === "csv") {
    const csvText = await fs.readFile(entry.path, "utf8");
    return {
      type: "tabular_support_dataset",
      analytics: summarizeSupportCsv(csvText),
      note: "Aggregated metrics from customer success/support time-series CSV.",
    };
  }

  if (entry.type === "json") {
    const jsonText = await fs.readFile(entry.path, "utf8");
    return {
      type: "ops_it_alert_stream",
      analytics: summarizeOpsJson(jsonText),
      note: "Aggregated metrics from operations and IT alert stream JSON.",
    };
  }

  throw new Error(`Unsupported input type: ${entry.type}`);
}

export async function runEventExtraction({
  apiKey,
  model = "llama-3.3-70b-versatile",
  inputFiles = DEFAULT_INPUT_FILES,
  outputFile = DEFAULT_OUTPUT_FILE,
  maxEventsPerSource = 8,
}) {
  if (!apiKey) throw new Error("Missing GROQ_API_KEY in backend/.env or environment.");

  const allEvents = [];
  const sourceRuns = [];

  for (const input of inputFiles) {
    const digest = await buildEvidenceDigest(input);
    const events = await callGroqForEvents({
      apiKey,
      model,
      sourceKey: input.key,
      domain: input.domain,
      evidenceDigest: digest,
      maxEvents: maxEventsPerSource,
    });

    allEvents.push(...events);
    sourceRuns.push({
      source_key: input.key,
      domain: input.domain,
      file_name: path.basename(input.path),
      generated_event_count: events.length,
    });
  }

  const output = {
    generated_at: new Date().toISOString(),
    generator: {
      provider: "groq",
      model,
      pipeline: "post-ai-crawl-event-extractor",
    },
    source_runs: sourceRuns,
    event_count: allEvents.length,
    events: allEvents,
  };

  await fs.writeFile(outputFile, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  return { outputFile, eventCount: output.event_count, output };
}
