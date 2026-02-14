import type { NextApiRequest, NextApiResponse } from "next";
import { appendFileSync, mkdirSync } from "fs";
import { join } from "path";

// Models from Google AI (v1beta); try in order on 404/429
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-3-flash-preview", "gemini-2.0-flash", "gemini-pro"];
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
function geminiUrl(model: string) {
  return `${GEMINI_BASE}/${model}:generateContent`;
}

export interface AnalyzeEventsResponse {
  departmentName: string;
  consequences?: string;
  solution?: string;
  predictedOutput: string;
  nodes: {
    title: string;
    description?: string;
    briefDescription?: string;
    eventsHappened?: string;
    consequence?: string;
    solution?: string;
  }[];
  links: { sourceIndex: number; targetIndex: number }[];
}

const PREDICTION_DATA_DIR = join(process.cwd(), "data");
const PREDICTION_NODES_FILE = join(PREDICTION_DATA_DIR, "prediction-nodes.txt");

/** Append this prediction's node details to data/prediction-nodes.txt for further usage. */
function savePredictionToFile(parsed: AnalyzeEventsResponse): void {
  try {
    mkdirSync(PREDICTION_DATA_DIR, { recursive: true });
    const lines: string[] = [
      "",
      "========== prediction ==========",
      `createdAt: ${new Date().toISOString()}`,
      `departmentName: ${parsed.departmentName}`,
      `predictedOutput: ${parsed.predictedOutput}`,
      "nodes (each node: events happened, consequences, solution, output):",
      ...parsed.nodes.flatMap((n, i) => {
        const oneLine = (s: string) => (s ?? "").replace(/\n/g, " ").trim() || "—";
        return [
          `  --- node ${i} ---`,
          `  events happened: ${oneLine(n.eventsHappened ?? "")}`,
          `  consequences: ${oneLine(n.consequence ?? "")}`,
          `  solution: ${oneLine(n.solution ?? "")}`,
          `  output: ${n.title}${n.description ? `\n    ${oneLine(n.description)}` : ""}`,
        ];
      }),
      "links:",
      ...parsed.links.map((l) => `  ${l.sourceIndex} -> ${l.targetIndex}`),
      "====================================",
    ];
    appendFileSync(PREDICTION_NODES_FILE, lines.join("\n") + "\n");
  } catch (e) {
    console.error("Failed to save prediction to file", e);
  }
}

function buildPrompt(eventsJson: string): string {
  return `You are a decision-tree analyst. Given a JSON array of events, analyze them and output a single JSON object (no markdown, no code fence) with this exact structure:

{
  "departmentName": "short name for this scenario (e.g. Product Change, Risk Event)",
  "predictedOutput": "one short phrase for the main predicted outcome (e.g. Revenue impact, Policy update)",
  "nodes": [
    {
      "title": "output label for this node (what this node represents)",
      "description": "optional longer description of this output",
      "eventsHappened": "the events that happened / led to this node (from the input events; short text or bullet list)",
      "consequence": "what happens as a result of this node / outcome (bullet list or short text)",
      "solution": "recommended actions or solution for this node (bullet list or short text)"
    }
  ],
  "links": [
    { "sourceIndex": 0, "targetIndex": 1 },
    { "sourceIndex": 0, "targetIndex": 2 }
  ]
}

Rules:
- Each NODE represents one OUTPUT. Give each node: "eventsHappened" (events that led to this node), "consequence", "solution", and "title" (output label).
- "nodes": at least one node. Index 0 is the root (trigger). Every node must have "title"; include "eventsHappened", "consequence" and "solution" for each node.
- "links" form a TREE: sourceIndex = parent, targetIndex = child. Node 0 has no parent. Every node with index >= 1 must appear as targetIndex in exactly one link. A node can have multiple children. No cycles. Example: [0→1, 0→2, 1→3, 1→4].
- All indices in links must be < nodes.length. Output ONLY one valid JSON object. No markdown. Short strings, \\n for newlines. No trailing commas. Complete parseable JSON.

Events (JSON):
${eventsJson}`;
}

/** Try to repair truncated or slightly malformed JSON from Gemini. */
function repairTruncatedJson(raw: string): string {
  let s = raw.trim();
  // Remove trailing comma before ] or }
  s = s.replace(/,(\s*[}\]])/g, "$1");
  // Count open brackets (skip inside double-quoted strings)
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escape = false;
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (escape) {
      escape = false;
      i++;
      continue;
    }
    if (c === "\\" && inString) {
      escape = true;
      i++;
      continue;
    }
    if ((c === '"') && !escape) {
      inString = !inString;
      i++;
      continue;
    }
    if (!inString) {
      if (c === "{") openBraces++;
      else if (c === "}") openBraces--;
      else if (c === "[") openBrackets++;
      else if (c === "]") openBrackets--;
    }
    i++;
  }
  // Append missing closers (for truncated output)
  while (openBrackets > 0) {
    s += "]";
    openBrackets--;
  }
  while (openBraces > 0) {
    s += "}";
    openBraces--;
  }
  return s;
}

/** Build a valid analysis from events when Gemini is unavailable (404/429). */
function buildFallbackAnalysis(eventsJson: string): AnalyzeEventsResponse {
  let arr: unknown[] = [];
  try {
    const parsed = JSON.parse(eventsJson) as unknown;
    arr = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    arr = [];
  }

  const nodeTitles: string[] = [];
  let departmentName = "Events analysis";
  const consequencesParts: string[] = [];
  const solutionParts: string[] = [];

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (item === null || typeof item !== "object") {
      nodeTitles.push(`Event ${i + 1}`);
      continue;
    }
    const obj = item as Record<string, unknown>;
    const title =
      typeof obj.event === "string"
        ? obj.event
        : typeof obj.name === "string"
          ? obj.name
          : typeof obj.title === "string"
            ? obj.title
            : typeof obj.type === "string"
              ? obj.type
              : Object.keys(obj).length > 0
                ? String(obj[Object.keys(obj)[0]] ?? `Event ${i + 1}`)
                : `Event ${i + 1}`;
    nodeTitles.push(title);
    if (i === 0 && typeof obj.event === "string") departmentName = obj.event;
    if (typeof obj.impact === "string") consequencesParts.push(`• ${obj.impact}`);
    if (typeof obj.effect === "string") consequencesParts.push(`• ${obj.effect}`);
  }

  if (nodeTitles.length === 0) nodeTitles.push("Trigger", "Outcome");

  const nodes = nodeTitles.map((title, i) => {
    const eventAtI = i < arr.length && arr[i] != null && typeof arr[i] === "object"
      ? JSON.stringify(arr[i] as Record<string, unknown>)
      : i < arr.length
        ? String(arr[i])
        : "—";
    return {
      title,
      description: i === 0 ? "Root trigger from events." : "Outcome or branch from events.",
      briefDescription: title,
      eventsHappened: eventAtI,
      consequence:
        consequencesParts.length > 0
          ? consequencesParts.join(" ")
          : "• Events may affect downstream processes.",
      solution: "• Monitor outcomes.\n• Adjust plan based on results.\n• Document lessons learned.",
    };
  });

  // Build a tree: node 0 = root, node i (i>=1) has parent floor((i-1)/2) for a balanced binary tree
  const links: { sourceIndex: number; targetIndex: number }[] = [];
  for (let i = 1; i < nodes.length; i++) {
    links.push({ sourceIndex: Math.floor((i - 1) / 2), targetIndex: i });
  }

  return {
    departmentName,
    predictedOutput: nodeTitles[nodeTitles.length - 1] ?? "Outcome",
    nodes,
    links,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is not set. Add it to .env.local",
    });
  }

  const { events } = req.body as { events?: string };
  if (typeof events !== "string" || !events.trim()) {
    return res.status(400).json({ error: "Missing or invalid 'events' (JSON string)" });
  }

  // Basic JSON validity check
  try {
    JSON.parse(events);
  } catch {
    return res.status(400).json({ error: "Invalid JSON in events" });
  }

  const prompt = buildPrompt(events.trim());
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  };

  type GeminiResponse = {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  let data: GeminiResponse | null = null;
  let lastError: string | null = null;

  try {
    for (const model of GEMINI_MODELS) {
      const response = await fetch(
        `${geminiUrl(model)}?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (response.ok) {
        data = await response.json();
        break;
      }

      const errText = await response.text();
      lastError = errText;
      console.error(`Gemini API error (${model})`, response.status, errText);
      // 404 = model not found, 429 = quota exceeded → try next model
      if (response.status !== 404 && response.status !== 429) {
        return res.status(502).json({
          error: "Gemini API request failed",
          details: response.status === 401 ? "Invalid API key" : errText.slice(0, 200),
        });
      }
    }

    if (!data) {
      // Gemini unavailable (404/429): use local fallback so the feature still works
      console.warn("Gemini unavailable, using fallback analysis", lastError?.slice(0, 100));
      const fallback = buildFallbackAnalysis(events.trim());
      savePredictionToFile(fallback);
      return res.status(200).json(fallback);
    }
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      return res.status(502).json({
        error: "Empty or invalid response from Gemini",
      });
    }

    // Strip possible markdown code fence
    let rawJson = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

    let parsed: AnalyzeEventsResponse;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      // Try to repair truncated JSON (close open arrays/objects) then fallback
      const repaired = repairTruncatedJson(rawJson);
      try {
        parsed = JSON.parse(repaired);
      } catch {
        console.warn("Gemini response JSON parse failed after repair, using fallback");
        const fallback = buildFallbackAnalysis(events.trim());
        savePredictionToFile(fallback);
        return res.status(200).json(fallback);
      }
    }

    if (!parsed.departmentName || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.links)) {
      console.warn("Gemini response missing required fields, using fallback");
      const fallback = buildFallbackAnalysis(events.trim());
      savePredictionToFile(fallback);
      return res.status(200).json(fallback);
    }

    if (parsed.nodes.length === 0) {
      parsed.nodes = [
        {
          title: parsed.predictedOutput || "Outcome",
          description: parsed.consequences,
          eventsHappened: "—",
          consequence: parsed.consequences,
          solution: parsed.solution,
        },
      ];
    }

    const n = parsed.nodes.length;
    let linksValid = true;
    for (const link of parsed.links) {
      if (
        typeof link.sourceIndex !== "number" ||
        typeof link.targetIndex !== "number" ||
        link.sourceIndex < 0 ||
        link.sourceIndex >= n ||
        link.targetIndex < 0 ||
        link.targetIndex >= n
      ) {
        linksValid = false;
        break;
      }
    }
    if (!linksValid) {
      console.warn("Gemini response invalid link indices, using fallback");
      const fallback = buildFallbackAnalysis(events.trim());
      savePredictionToFile(fallback);
      return res.status(200).json(fallback);
    }

    savePredictionToFile(parsed);
    return res.status(200).json(parsed);
  } catch (e) {
    console.error("Prediction analyze error", e);
    return res.status(500).json({
      error: e instanceof Error ? e.message : "Analysis failed",
    });
  }
}
