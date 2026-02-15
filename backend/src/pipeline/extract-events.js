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

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function detectType(filePath, explicitType) {
  if (explicitType) return explicitType;
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".csv") return "csv";
  if (ext === ".xlsx") return "xlsx";
  if (ext === ".json") return "json";
  if (ext === ".docx") return "docx";
  return "unknown";
}

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

async function xlsxToRows(filePath) {
  let xlsx;
  try {
    xlsx = await import("xlsx");
  } catch {
    throw new Error(
      "XLSX input requires dependency 'xlsx'. Run: cd backend && npm install xlsx"
    );
  }

  const fileBuffer = await fs.readFile(filePath);
  const workbook = xlsx.read(fileBuffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];
  const sheet = workbook.Sheets[firstSheetName];
  return xlsx.utils.sheet_to_json(sheet, { defval: "" });
}

function parseNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
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

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((acc, x) => acc + x, 0) / values.length;
}

function stddev(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((acc, x) => acc + (x - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)));
  return sorted[idx];
}

function pickColumn(rows, aliases) {
  if (!rows.length) return null;
  const keys = Object.keys(rows[0]);
  const normalized = keys.map((k) => ({ raw: k, norm: normalizeKey(k) }));

  for (const alias of aliases) {
    const aliasNorm = normalizeKey(alias);
    const exact = normalized.find((k) => k.norm === aliasNorm);
    if (exact) return exact.raw;
  }

  for (const alias of aliases) {
    const aliasNorm = normalizeKey(alias);
    const fuzzy = normalized.find((k) => k.norm.includes(aliasNorm) || aliasNorm.includes(k.norm));
    if (fuzzy) return fuzzy.raw;
  }

  return null;
}

function buildDatasetFactsSheet(rows, sourceKey) {
  const lines = [];
  if (!rows.length) {
    return {
      schema: { columns: [], mapped: {} },
      lines: ["No rows found in dataset."],
    };
  }

  const timestampCol = pickColumn(rows, [
    "timestamp",
    "time",
    "datetime",
    "event_time",
    "created_at",
    "date",
  ]);
  const topicCol = pickColumn(rows, ["top_topic", "topic", "issue", "category", "issue_type"]);
  const volumeCol = pickColumn(rows, ["tickets", "count", "volume", "events", "requests"]);
  const sentimentCol = pickColumn(rows, ["sentiment_score", "sentiment", "csat", "nps"]);
  const slaCol = pickColumn(rows, [
    "avg_first_response_min",
    "first_response_min",
    "response_time_min",
    "sla_minutes",
    "resolution_min",
    "latency_ms",
  ]);
  const regionCol = pickColumn(rows, ["region", "market", "geo", "country"]);

  const normalizedRows = rows.map((row, idx) => ({
    idx,
    timestamp: timestampCol ? String(row[timestampCol] ?? "") : "",
    topic: topicCol ? String(row[topicCol] ?? "unknown") : "unknown",
    region: regionCol ? String(row[regionCol] ?? "unknown") : "unknown",
    volume: volumeCol ? parseNumber(row[volumeCol]) : null,
    sentiment: sentimentCol ? parseNumber(row[sentimentCol]) : null,
    sla: slaCol ? parseNumber(row[slaCol]) : null,
  }));

  const volumeRows = normalizedRows.filter((r) => r.volume !== null);
  const sentimentRows = normalizedRows.filter((r) => r.sentiment !== null);
  const slaRows = normalizedRows.filter((r) => r.sla !== null);

  const volumeValues = volumeRows.map((r) => r.volume);
  const volumeMean = mean(volumeValues);
  const volumeStd = stddev(volumeValues);

  const topSpikes = volumeRows
    .map((r) => ({
      ...r,
      z: volumeStd > 0 ? (r.volume - volumeMean) / volumeStd : 0,
    }))
    .sort((a, b) => b.z - a.z || b.volume - a.volume)
    .slice(0, 20);

  const topicStats = new Map();
  const midpoint = Math.floor(normalizedRows.length / 2);
  normalizedRows.forEach((r, idx) => {
    const topic = r.topic || "unknown";
    const cur = topicStats.get(topic) ?? { totalVolume: 0, firstHalfVolume: 0, secondHalfVolume: 0 };
    if (r.volume !== null) {
      cur.totalVolume += r.volume;
      if (idx <= midpoint) cur.firstHalfVolume += r.volume;
      else cur.secondHalfVolume += r.volume;
    }
    topicStats.set(topic, cur);
  });

  const topTopicSurges = [...topicStats.entries()]
    .map(([topic, stats]) => {
      const base = Math.max(1, stats.firstHalfVolume);
      const pct = ((stats.secondHalfVolume - stats.firstHalfVolume) / base) * 100;
      return {
        topic,
        totalVolume: stats.totalVolume,
        firstHalfVolume: stats.firstHalfVolume,
        secondHalfVolume: stats.secondHalfVolume,
        surgePct: Number(pct.toFixed(1)),
      };
    })
    .sort((a, b) => b.surgePct - a.surgePct)
    .slice(0, 15);

  const worstSentimentWindows = sentimentRows
    .sort((a, b) => a.sentiment - b.sentiment)
    .slice(0, 20);

  let slaThreshold = null;
  if (slaRows.length) {
    const values = slaRows.map((r) => r.sla);
    const p90 = percentile(values, 0.9);
    const slaNorm = normalizeKey(slaCol || "");
    const staticThreshold = slaNorm.includes("latency") || slaNorm.includes("ms") ? 2000 : 60;
    slaThreshold = Math.max(staticThreshold, p90 ?? staticThreshold);
  }

  const slaBreaches = slaRows
    .filter((r) => (slaThreshold === null ? false : r.sla >= slaThreshold))
    .sort((a, b) => b.sla - a.sla)
    .slice(0, 25);

  const regionBreakdown = regionCol
    ? sumBy(
        rows.map((r) => ({
          [regionCol]: r[regionCol],
          __volume: volumeCol ? r[volumeCol] : 1,
        })),
        regionCol,
        "__volume"
      ).slice(0, 10)
    : [];

  lines.push(`# Facts Sheet: ${sourceKey}`);
  lines.push(`rows=${rows.length}`);
  lines.push(`mapped_columns timestamp=${timestampCol || "n/a"} topic=${topicCol || "n/a"} volume=${volumeCol || "n/a"} sentiment=${sentimentCol || "n/a"} sla=${slaCol || "n/a"} region=${regionCol || "n/a"}`);
  if (volumeValues.length) {
    lines.push(`volume_baseline mean=${volumeMean.toFixed(3)} std=${volumeStd.toFixed(3)}`);
  }

  lines.push("## Top spikes");
  for (const row of topSpikes) {
    lines.push(
      `spike ts=${row.timestamp || row.idx} topic=${row.topic} region=${row.region} volume=${row.volume} z=${row.z.toFixed(2)}`
    );
  }

  lines.push("## Top topic surges");
  for (const row of topTopicSurges) {
    lines.push(
      `surge topic=${row.topic} first_half=${row.firstHalfVolume} second_half=${row.secondHalfVolume} surge_pct=${row.surgePct} total=${row.totalVolume}`
    );
  }

  lines.push("## Worst sentiment windows");
  for (const row of worstSentimentWindows) {
    lines.push(
      `sentiment ts=${row.timestamp || row.idx} topic=${row.topic} region=${row.region} sentiment=${row.sentiment}`
    );
  }

  lines.push("## SLA breaches");
  lines.push(`sla_threshold=${slaThreshold ?? "n/a"}`);
  for (const row of slaBreaches) {
    lines.push(`sla_breach ts=${row.timestamp || row.idx} topic=${row.topic} region=${row.region} sla=${row.sla}`);
  }

  lines.push("## Region breakdown");
  for (const row of regionBreakdown) {
    lines.push(`region=${row.key} total_volume=${row.value}`);
  }

  if (lines.length < 50) {
    lines.push("## Additional row highlights");
    const highlights = [...volumeRows]
      .sort((a, b) => b.volume - a.volume)
      .slice(0, Math.min(80, volumeRows.length));
    for (const row of highlights) {
      lines.push(
        `highlight ts=${row.timestamp || row.idx} topic=${row.topic} region=${row.region} volume=${row.volume} sentiment=${row.sentiment ?? "n/a"} sla=${row.sla ?? "n/a"}`
      );
      if (lines.length >= 120) break;
    }
  }

  return {
    schema: {
      columns: Object.keys(rows[0] ?? {}),
      mapped: {
        timestamp: timestampCol,
        topic: topicCol,
        volume: volumeCol,
        sentiment: sentimentCol,
        sla: slaCol,
        region: regionCol,
      },
    },
    lines: lines.slice(0, 200),
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
    "evidence must cite facts from facts_sheet lines when provided.",
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

async function buildTabularEvidenceDigest(entry) {
  const fileType = detectType(entry.path, entry.type);
  let rows = [];

  if (fileType === "csv") {
    const csvText = await fs.readFile(entry.path, "utf8");
    rows = csvToRows(csvText);
  } else if (fileType === "xlsx") {
    rows = await xlsxToRows(entry.path);
  } else {
    throw new Error(`Unsupported tabular dataset type: ${fileType}`);
  }

  const facts = buildDatasetFactsSheet(rows, entry.key);
  return {
    type: "tabular_dataset_facts_sheet",
    format: fileType,
    row_count: rows.length,
    schema: facts.schema,
    facts_sheet_line_count: facts.lines.length,
    facts_sheet: facts.lines.join("\n"),
    note: "Deterministic preprocessing applied; LLM receives only facts_sheet, not raw dataset rows.",
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

async function buildEvidenceDigest(entry) {
  const fileType = detectType(entry.path, entry.type);

  if (fileType === "docx") {
    const docText = await docxToText(entry.path);
    return {
      type: "docx_report",
      excerpt: docText.slice(0, 14000),
      note: "Official finance/procurement report excerpt.",
    };
  }

  if (fileType === "csv" || fileType === "xlsx") {
    return buildTabularEvidenceDigest({ ...entry, type: fileType });
  }

  if (fileType === "json") {
    const jsonText = await fs.readFile(entry.path, "utf8");
    return {
      type: "ops_it_alert_stream",
      analytics: summarizeOpsJson(jsonText),
      note: "Aggregated metrics from operations and IT alert stream JSON.",
    };
  }

  throw new Error(`Unsupported input type: ${fileType}`);
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
      evidence_type: digest.type,
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
