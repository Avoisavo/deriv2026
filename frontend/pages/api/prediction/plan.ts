import type { NextApiRequest, NextApiResponse } from "next";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-3-flash-preview", "gemini-2.0-flash", "gemini-pro"];
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
function geminiUrl(model: string) {
  return `${GEMINI_BASE}/${model}:generateContent`;
}

const PREDICTION_DATA_DIR = join(process.cwd(), "data");
const PREDICTION_NODES_FILE = join(PREDICTION_DATA_DIR, "prediction-nodes.txt");

/** Per-edge metadata for the chosen path (one per consecutive pair in pathNodeIds). */
export interface PathEdge {
  /** Confidence that this step belongs in the path, in range 0.6–1. */
  confidence: number;
  /** Short explanation of why these two nodes are related. */
  relationDescription: string;
}

export interface PlanResponse {
  consequences: string;
  solution: string;
  predictedOutput: string;
  /** Probability of this outcome (0–100), from the model. */
  probabilityPercent?: number;
  pathNodeIds: string[];
  /** Per-edge confidence and relation description (length = pathNodeIds.length - 1). */
  pathEdges?: PathEdge[];
}

interface PlanRequestBody {
  question: string;
  nodes: { id: string; title: string; description?: string; department?: string }[];
  links: { source: string; target: string }[];
}

/** One parsed block from data/prediction-nodes.txt */
interface PastPrediction {
  departmentName: string;
  predictedOutput: string;
  nodeTitles: string[];
  links: { from: number; to: number }[];
}

/**
 * Read and parse data/prediction-nodes.txt.
 * Supports two formats:
 * - New: "nodes (each node: ...):" then "  --- node N ---" blocks with "  output: Title" (and events/consequences/solution).
 * - Old: "nodes:" then "  index: title (brief)" and "links:" with "  from -> to".
 */
function readPastPredictions(): PastPrediction[] {
  if (!existsSync(PREDICTION_NODES_FILE)) return [];
  try {
    const content = readFileSync(PREDICTION_NODES_FILE, "utf-8");
    const blocks = content.split(/========== prediction ==========/).filter((b) => b.trim());
    const result: PastPrediction[] = [];

    for (const block of blocks) {
      const lines = block.split(/\r?\n/);
      let departmentName = "";
      let predictedOutput = "";
      const nodeTitles: string[] = [];
      const links: { from: number; to: number }[] = [];
      let section: "" | "nodes" | "links" = "";
      let nodesNewFormat = false;

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("departmentName:")) {
          departmentName = trimmed.replace(/^departmentName:\s*/, "").trim();
        } else if (trimmed.startsWith("predictedOutput:")) {
          predictedOutput = trimmed.replace(/^predictedOutput:\s*/, "").trim();
        } else if (trimmed.startsWith("nodes (each node:")) {
          section = "nodes";
          nodesNewFormat = true;
        } else if (trimmed === "nodes:") {
          section = "nodes";
          nodesNewFormat = false;
        } else if (trimmed === "links:") {
          section = "links";
        } else if (trimmed === "====================================") {
          break;
        } else if (section === "nodes") {
          if (nodesNewFormat && trimmed.startsWith("output:")) {
            const title = trimmed.replace(/^output:\s*/, "").trim();
            if (title) nodeTitles.push(title);
          } else if (!nodesNewFormat && /^\d+:\s*/.test(trimmed)) {
            const match = trimmed.match(/^\d+:\s*(.+?)(?:\s*\([^)]*\))?\s*$/);
            const title = match ? match[1].trim() : trimmed.replace(/^\d+:\s*/, "").replace(/\s*\([^)]*\)\s*$/, "").trim();
            nodeTitles.push(title);
          }
        } else if (section === "links" && /^\d+\s*->\s*\d+/.test(trimmed)) {
          const match = trimmed.match(/(\d+)\s*->\s*(\d+)/);
          if (match) links.push({ from: parseInt(match[1], 10), to: parseInt(match[2], 10) });
        }
      }

      if (departmentName || predictedOutput || nodeTitles.length > 0) {
        result.push({ departmentName, predictedOutput, nodeTitles, links });
      }
    }
    return result;
  } catch (e) {
    console.warn("Failed to read prediction-nodes.txt", e);
    return [];
  }
}

/** Format past predictions as context for the prompt (last N to avoid token overflow). */
function formatPastPredictionsContext(past: PastPrediction[], maxEntries = 5): string {
  const recent = past.slice(-maxEntries);
  if (recent.length === 0) return "";
  const parts = recent.map((p, i) => {
    const nodeList = p.nodeTitles.length ? `Nodes: ${p.nodeTitles.join(" → ")}` : "";
    const linkList = p.links.length ? `Links: ${p.links.map((l) => `${l.from}→${l.to}`).join(", ")}` : "";
    return `[${i + 1}] ${p.departmentName} | Predicted: ${p.predictedOutput}\n    ${[nodeList, linkList].filter(Boolean).join(" ")}`;
  });
  return `Additional context from past predictions (use for terminology and outcome style; path must still be chosen from "Existing nodes" below):\n${parts.join("\n")}\n`;
}

/** Compute valid path start node ids (roots / block entries). */
function getValidPathStarts(nodes: PlanRequestBody["nodes"], links: PlanRequestBody["links"]): { id: string; title: string }[] {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const targets = new Set(links.map((l) => l.target));
  const globalRoots = nodes.filter((n) => !targets.has(n.id)).map((n) => n.id);
  const blockEntryIds = nodes.filter((n) => /^dec-file-\d+-0$/.test(n.id)).map((n) => n.id);
  const rootIds = [...new Set([...globalRoots, ...blockEntryIds])];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return rootIds.map((id) => ({ id, title: byId.get(id)?.title ?? id }));
}

function buildPrompt(
  question: string,
  nodes: PlanRequestBody["nodes"],
  links: PlanRequestBody["links"],
  pastPredictionsContext: string,
  validPathStarts: { id: string; title: string }[]
): string {
  const nodesJson = JSON.stringify(nodes, null, 2);
  const linksJson = JSON.stringify(links, null, 2);
  const contextBlock = pastPredictionsContext
    ? `\n${pastPredictionsContext}\n`
    : "";
  const pathStartsBlock = validPathStarts.length > 0
    ? `\nValid path starts (the FIRST id in pathNodeIds MUST be exactly one of these):\n${validPathStarts.map((r) => `  - ${r.id} (${r.title})`).join("\n")}\n`
    : "";

  return `You are a decision-tree analyst. The user asks a question about a scenario. You have an existing graph of nodes and links.
${contextBlock}
Your tasks:
1. Analyze the question and produce:
   - "consequences": a bullet list of what will happen as a result (considering the scenario).
   - "solution": a bullet list of recommended actions or solution steps.
   - "predictedOutput": one short phrase for the main predicted outcome (e.g. Revenue impact, Policy update).
   - "probabilityPercent": a number from 0 to 100 indicating how likely this predicted outcome is given the path and scenario (e.g. 72 for 72%).

2. Select a path through the existing graph that best answers the question.

Path selection strategy (follow this to choose a good path):
   a) Match the question's scenario: Identify which node(s) in "Existing nodes" represent the situation or premise in the question (e.g. "APAC ticket spike", "KYC queue grows", "cost controls pause"). Use node "title" and "description" to find the best match. The path should START from one of the valid path starts that is most relevant to this scenario.
   b) Match the predicted outcome: The LAST node in your path must be the node that best represents your predictedOutput. If predictedOutput is "Emergency spend triggered", the path must end at a node about emergency spend or approvals. Scan "Existing nodes" for a node whose title/description fits the outcome.
   c) Connect with existing links only: From your chosen start, follow only links that appear in "Existing links". Each step must be (source, target) in that list. You may use cross-department links when they fit the story.
   d) Prefer a concise path: When multiple valid paths exist, prefer one with FEWER steps that still connects the scenario to the outcome. Do not add extra nodes that do not directly support answering the question. Typically 3–6 nodes is enough unless the question explicitly asks for a "full" or "complete" path across many departments.
   e) Cross-department when the question asks: If the question mentions multiple areas (e.g. "how does that tie to Support and Finance") or asks to "connect X to Y", the path MUST include nodes from those areas. Node id prefix: dec-file-0-* = Support, dec-file-1-* = Finance, dec-file-2-* = Ops, dec-file-3-* = Compliance.
${pathStartsBlock}
   - Output the path as "pathNodeIds": an array of node ids in order from start to prediction node. Copy ids exactly from "Existing nodes".
   - For each consecutive pair (pathNodeIds[i] -> pathNodeIds[i+1]), you MUST generate one entry in "pathEdges": { "confidence": number in range 0.6 to 1 (how strongly this step supports the answer), "relationDescription": a short sentence YOU generate explaining why this specific step belongs in the path for this question. Do not use generic phrases—describe in context of the user's question why moving from this node to the next is relevant (e.g. "Ticket spike leads to more refund requests, which triggers Finance's dispute workflow."). pathEdges is shown to the user, so generate a clear, specific description for each step.

Rules:
- pathNodeIds must only contain exact node ids from the "Existing nodes" list (copy the "id" values exactly; do not truncate or invent ids).
- Consecutive ids in pathNodeIds must form an existing link (source -> target) from the "Existing links" list.
- The first id in pathNodeIds must be exactly one of the valid path starts listed above.
- The last id in pathNodeIds must be the node that best represents your predictedOutput.
- Always prefer a path that crosses departments when the user's question spans multiple areas; do not restrict to one department unless the question is clearly about a single area.
- Keep consequences and solution to 2-4 short bullet points each so the response is complete.
- Output ONLY one valid JSON object. No markdown, no code fence. Use \\n for newlines in strings.

Output format (exact structure):
{
  "consequences": "bullet list of consequences",
  "solution": "bullet list of solution steps",
  "predictedOutput": "short phrase",
  "probabilityPercent": 0-100,
  "pathNodeIds": ["rootId", "nodeId2", "...", "predictionNodeId"],
  "pathEdges": [
    { "confidence": 0.6-1, "relationDescription": "why step 1->2 is relevant" },
    { "confidence": 0.6-1, "relationDescription": "why step 2->3 is relevant" }
  ]
}
pathEdges must have exactly (pathNodeIds.length - 1) entries, one per consecutive pair in the path. Generate each relationDescription during path selection—explain why that link is part of the answer to the user's question.

User question:
${question}

Existing nodes (id, title, description):
${nodesJson}

Existing links (source -> target):
${linksJson}`;
}

/** Try to repair truncated JSON from Gemini (unterminated string, unclosed braces). */
function repairTruncatedJson(raw: string): string {
  let s = raw.trim();
  s = s.replace(/,(\s*[}\]])/g, "$1");
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
    if (c === '"' && !escape) {
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
  if (inString) s += '"';
  while (openBrackets > 0) {
    s = s.replace(/,(\s*)$/, "$1");
    s += "]";
    openBrackets--;
  }
  while (openBraces > 0) {
    s = s.replace(/,(\s*)$/, "$1");
    s += "}";
    openBraces--;
  }
  s = s.replace(/,(\s*[}\]])/g, "$1");
  return s;
}

/** Normalize a JSON field that may be string or string[] into a single non-empty string; fallback if missing/empty. */
function normalizeTextField(
  value: unknown,
  fallback: string
): string {
  if (typeof value === "string") {
    const t = value.trim();
    return t || fallback;
  }
  if (Array.isArray(value)) {
    const parts = value.filter((x) => typeof x === "string").map((x) => String(x).trim()).filter(Boolean);
    return parts.length ? parts.join("\n") : fallback;
  }
  return fallback;
}

/** Validate that pathNodeIds is a valid path in the graph (starts at root or block entry, follows links). */
function validatePath(
  pathNodeIds: string[],
  nodes: PlanRequestBody["nodes"],
  links: PlanRequestBody["links"]
): boolean {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const targets = new Set(links.map((l) => l.target));
  const linkSet = new Set(links.map((l) => `${l.source}\t${l.target}`));

  if (pathNodeIds.length === 0) return false;
  for (const id of pathNodeIds) {
    if (!nodeIds.has(id)) return false;
  }
  // Valid path start: global root (no incoming link) OR first node of any block (dec-file-B-0)
  const globalRoots = nodes.filter((n) => !targets.has(n.id)).map((n) => n.id);
  const blockEntryIds = nodes.filter((n) => /^dec-file-\d+-0$/.test(n.id)).map((n) => n.id);
  const rootCandidates = [...new Set([...globalRoots, ...blockEntryIds])];
  if (!rootCandidates.includes(pathNodeIds[0])) return false;
  for (let i = 0; i < pathNodeIds.length - 1; i++) {
    if (!linkSet.has(`${pathNodeIds[i]}\t${pathNodeIds[i + 1]}`)) return false;
  }
  return true;
}

/** Extract department id from node id (e.g. dec-file-1-3 -> 1). */
function departmentOf(nodeId: string): number {
  const m = nodeId.match(/^dec-file-(\d+)-/);
  return m ? parseInt(m[1], 10) : -1;
}

/** Build a valid path following only existing links, optionally preferring cross-department steps to mock cross-domain. */
function buildFallbackPath(
  nodes: PlanRequestBody["nodes"],
  links: PlanRequestBody["links"],
  preferredStartId: string,
  targetLength: number
): string[] {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const targets = new Set(links.map((l) => l.target));
  const linkSet = new Set(links.map((l) => `${l.source}\t${l.target}`));
  const linksBySource = new Map<string, string[]>();
  links.forEach((l) => {
    if (!linksBySource.has(l.source)) linksBySource.set(l.source, []);
    linksBySource.get(l.source)!.push(l.target);
  });
  const globalRoots = nodes.filter((n) => !targets.has(n.id)).map((n) => n.id);
  const blockEntryIds = nodes.filter((n) => /^dec-file-\d+-0$/.test(n.id)).map((n) => n.id);
  const roots = [...new Set([...globalRoots, ...blockEntryIds])];

  const startId = nodeIds.has(preferredStartId) && roots.includes(preferredStartId)
    ? preferredStartId
    : roots[0];
  if (!startId) return [];

  const path: string[] = [startId];
  const visited = new Set<string>([startId]);
  const maxSteps = Math.min(Math.max(2, targetLength), 8);

  while (path.length < maxSteps) {
    const current = path[path.length - 1];
    const nextCandidates = linksBySource.get(current)?.filter((id) => !visited.has(id)) ?? [];
    if (nextCandidates.length === 0) break;

    const currentDept = departmentOf(current);
    const crossDept = nextCandidates.filter((id) => departmentOf(id) !== currentDept);
    const sameDept = nextCandidates.filter((id) => departmentOf(id) === currentDept);
    const ordered = crossDept.length > 0 ? [...crossDept, ...sameDept] : nextCandidates;
    const next = ordered[0];
    path.push(next);
    visited.add(next);
  }

  return path;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  const body = req.body as PlanRequestBody;
  const { question, nodes, links } = body;
  if (typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ error: "Missing or invalid 'question'" });
  }
  if (!Array.isArray(nodes) || !Array.isArray(links)) {
    return res.status(400).json({ error: "Missing or invalid 'nodes' or 'links'" });
  }

  const safeNodes = nodes.map((n) => ({
    id: String(n?.id ?? ""),
    title: String(n?.title ?? ""),
    description: n?.description != null ? String(n.description) : undefined,
  }));
  const safeLinks = links
    .filter((l) => l && typeof l.source === "string" && typeof l.target === "string")
    .map((l) => ({ source: String(l.source), target: String(l.target) }));

  if (safeNodes.length === 0) {
    return res.status(400).json({ error: "At least one node is required" });
  }

  const pastPredictions = readPastPredictions();
  const pastContext = formatPastPredictionsContext(pastPredictions);
  const validPathStarts = getValidPathStarts(safeNodes, safeLinks);
  const prompt = buildPrompt(question.trim(), safeNodes, safeLinks, pastContext, validPathStarts);
  const apiBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4096,
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
      const response = await fetch(`${geminiUrl(model)}?key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiBody),
      });

      if (response.ok) {
        data = await response.json();
        break;
      }
      const errText = await response.text();
      lastError = errText;
      if (response.status !== 404 && response.status !== 429) {
        return res.status(502).json({
          error: "Gemini API request failed",
          details: response.status === 401 ? "Invalid API key" : errText.slice(0, 200),
        });
      }
    }

    if (!data) {
      console.error("[plan] 502: Gemini unavailable", lastError?.slice(0, 300));
      return res.status(502).json({
        error: "Gemini unavailable",
        details: lastError ? lastError.slice(0, 200) : "All models failed or quota exceeded",
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      console.error("[plan] 502: Empty response from Gemini", JSON.stringify(data?.candidates?.[0]).slice(0, 500));
      return res.status(502).json({
        error: "Empty response from Gemini",
        details: "No text in candidate content",
      });
    }

    let rawJson = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    let parsed: PlanResponse;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      const repaired = repairTruncatedJson(rawJson);
      try {
        parsed = JSON.parse(repaired);
      } catch (e) {
        console.error("[plan] 502: Invalid JSON from Gemini (after repair)", rawJson.slice(0, 400), e);
        return res.status(502).json({
          error: "Invalid JSON from Gemini",
          details: "Response may be truncated. " + (e instanceof Error ? e.message : "Parse failed"),
        });
      }
    }

    if (!parsed.pathNodeIds || !Array.isArray(parsed.pathNodeIds)) {
      console.error("[plan] 502: pathNodeIds missing or not array", typeof parsed.pathNodeIds);
      return res.status(502).json({
        error: "Invalid response from Gemini",
        details: "pathNodeIds missing or not an array",
      });
    }

    // Resolve path: exact id, or match by title, or single prefix match, or recover truncated id from graph
    const nodeIds = new Set(safeNodes.map((n) => n.id));
    const titleToId = new Map(safeNodes.map((n) => [n.title.trim().toLowerCase(), n.id]));
    const linkTargetsBySource = new Map<string, Set<string>>();
    safeLinks.forEach((l) => {
      if (!linkTargetsBySource.has(l.source)) linkTargetsBySource.set(l.source, new Set());
      linkTargetsBySource.get(l.source)!.add(l.target);
    });
    const targets = new Set(safeLinks.map((l) => l.target));
    const globalRoots = safeNodes.filter((n) => !targets.has(n.id)).map((n) => n.id);
    const blockEntryIds = safeNodes.filter((n) => /^dec-file-\d+-0$/.test(n.id)).map((n) => n.id);
    const roots = [...new Set([...globalRoots, ...blockEntryIds])];

    let resolvedPath = parsed.pathNodeIds.map((idOrTitle) => {
      const s = String(idOrTitle).trim();
      if (nodeIds.has(s)) return s;
      const byTitle = titleToId.get(s.toLowerCase());
      if (byTitle) return byTitle;
      const prefixMatches = safeNodes.filter((n) => n.id.startsWith(s));
      if (prefixMatches.length === 1) return prefixMatches[0].id;
      return s;
    });

    // Second pass: recover truncated ids (e.g. "dec" or "dec-") using graph structure
    resolvedPath = resolvedPath.map((id, i) => {
      if (nodeIds.has(id)) return id;
      const prefixMatches = safeNodes.filter((n) => n.id.startsWith(id));
      if (prefixMatches.length === 0) return id;
      if (i === 0) {
        const rootMatches = prefixMatches.filter((n) => roots.includes(n.id));
        if (rootMatches.length >= 1) return rootMatches[0].id;
      } else {
        const prev = resolvedPath[i - 1];
        if (nodeIds.has(prev)) {
          const nextCandidates = linkTargetsBySource.get(prev);
          const validNext = prefixMatches.filter((n) => nextCandidates?.has(n.id));
          if (validNext.length >= 1) return validNext[0].id;
        }
      }
      return id;
    });
    parsed.pathNodeIds = resolvedPath;

    const invalidIds = resolvedPath.filter((id) => !nodeIds.has(id));
    if (invalidIds.length > 0) {
      console.error("[plan] 502: path contains invalid or truncated ids:", invalidIds);
      return res.status(502).json({
        error: "Invalid response from Gemini",
        details: `pathNodeIds contains invalid or truncated id(s): ${invalidIds.join(", ")}. Use exact node ids from the request.`,
      });
    }
    if (!validatePath(parsed.pathNodeIds, safeNodes, safeLinks)) {
      console.warn(
        "[plan] path invalid, using fallback valid path. LLM path:",
        parsed.pathNodeIds
      );
      const fallbackPath = buildFallbackPath(
        safeNodes,
        safeLinks,
        parsed.pathNodeIds[0],
        parsed.pathNodeIds.length
      );
      if (fallbackPath.length === 0) {
        return res.status(502).json({
          error: "Invalid response from Gemini",
          details: "pathNodeIds is not a valid path and no fallback path could be built.",
        });
      }
      parsed.pathNodeIds = fallbackPath;
    }
    const expectedEdgeCount = parsed.pathNodeIds.length - 1;
    if (Array.isArray(parsed.pathEdges) && parsed.pathEdges.length === expectedEdgeCount) {
      parsed.pathEdges = parsed.pathEdges.slice(0, expectedEdgeCount).map((e: { confidence?: unknown; relationDescription?: unknown }, i: number) => {
        let conf = typeof e?.confidence === "number" && !Number.isNaN(e.confidence) ? e.confidence : 0.8;
        if (typeof e?.confidence === "string" && e.confidence.trim() !== "") {
          const n = Number(e.confidence.trim());
          if (!Number.isNaN(n)) conf = n;
        }
        conf = Math.max(0.6, Math.min(1, Number(conf)));
        const desc = typeof e?.relationDescription === "string" && e.relationDescription.trim()
          ? e.relationDescription.trim()
          : "Step in path.";
        return { confidence: conf, relationDescription: desc };
      });
    } else {
      parsed.pathEdges = undefined;
    }
    // Normalize text fields: Gemini may return strings or arrays; accept both and fallback if missing/empty
    parsed.consequences = normalizeTextField(
      parsed.consequences,
      "Consequences not specified."
    );
    parsed.solution = normalizeTextField(parsed.solution, "Solution steps not specified.");
    parsed.predictedOutput = normalizeTextField(
      parsed.predictedOutput,
      "Predicted outcome not specified."
    );
    const rawProb = parsed.probabilityPercent;
    if (typeof rawProb === "number" && !Number.isNaN(rawProb)) {
      parsed.probabilityPercent = Math.max(0, Math.min(100, Math.round(rawProb)));
    } else if (typeof rawProb === "string" && rawProb.trim() !== "") {
      const num = Number(rawProb.trim());
      if (!Number.isNaN(num)) parsed.probabilityPercent = Math.max(0, Math.min(100, Math.round(num)));
      else parsed.probabilityPercent = undefined;
    } else {
      parsed.probabilityPercent = undefined;
    }

    if (parsed.consequences === "Consequences not specified.") {
      console.warn("[plan] Gemini did not return consequences; using fallback");
    }
    if (parsed.solution === "Solution steps not specified.") {
      console.warn("[plan] Gemini did not return solution; using fallback");
    }
    if (parsed.predictedOutput === "Predicted outcome not specified.") {
      console.warn("[plan] Gemini did not return predictedOutput; using fallback");
    }

    return res.status(200).json(parsed);
  } catch (e) {
    console.error("Plan API error", e);
    return res.status(500).json({
      error: e instanceof Error ? e.message : "Plan failed",
    });
  }
}
