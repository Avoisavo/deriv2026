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

export interface PlanResponse {
  consequences: string;
  solution: string;
  predictedOutput: string;
  pathNodeIds: string[];
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

function buildPrompt(
  question: string,
  nodes: PlanRequestBody["nodes"],
  links: PlanRequestBody["links"],
  pastPredictionsContext: string
): string {
  const nodesJson = JSON.stringify(nodes, null, 2);
  const linksJson = JSON.stringify(links, null, 2);
  const contextBlock = pastPredictionsContext
    ? `\n${pastPredictionsContext}\n`
    : "";

  return `You are a decision-tree analyst. The user asks a question about a scenario. You have an existing graph of nodes and links.
${contextBlock}
Your tasks:
1. Analyze the question and produce:
   - "consequences": a bullet list of what will happen as a result (considering the scenario).
   - "solution": a bullet list of recommended actions or solution steps.
   - "predictedOutput": one short phrase for the main predicted outcome (e.g. Revenue impact, Policy update).

2. Select a path through the existing graph that best answers the question:
   - ALWAYS consider cross-department paths. The graph has links that connect nodes across departments (e.g. Support, Finance, Operations, Compliance). You may go directly from a node in one department to a node in another when an existing link allows it (e.g. incident node -> emergency spend node).
   - The path MUST start from a valid entry: either the global root (no incoming link) or the first node of any block (e.g. dec-file-0-0, dec-file-1-0, dec-file-2-0, dec-file-3-0). You may start in the department that best fits the question.
   - The path MUST follow existing links only: each step must be (source, target) in the links list. Use the "Existing links" list—it includes both within-department and cross-department links; use any link that fits the question, including direct cross-department links.
   - The path MUST end at a node that best represents the predicted outcome (the "prediction node").
   - Output the path as "pathNodeIds": an array of node ids in order from root to prediction node, e.g. ["id1", "id2", "id3"].

Rules:
- pathNodeIds must only contain exact node ids from the "Existing nodes" list (copy the "id" values exactly; do not truncate or invent ids).
- Consecutive ids in pathNodeIds must form an existing link (source -> target). Cross-department links are in the links list—use them when they fit; direct access to a node in another department is allowed when a link exists.
- The first id must be a valid path start: a global root or the first node of a block (id ending with -0, e.g. dec-file-3-0 for Compliance).
- Always prefer a path that crosses departments when the user's question spans multiple areas (support, finance, ops, compliance); do not restrict the path to one department unless the question is clearly about a single area.
- CRITICAL: If the question explicitly asks for outcomes in other departments or "how does that tie to Support/Finance/Ops", the path MUST cross into those departments. Include at least one node from each department mentioned. Node id prefix indicates department: dec-file-0-* = Support, dec-file-1-* = Finance, dec-file-2-* = Ops, dec-file-3-* = Compliance. Use the Existing links to jump between departments; do not return a path that stays in one department when the question asks to tie to or include another.
- When the question asks how compliance holds / KYC queue "tie to support verification-delay complaints" or "dispute intake", the path MUST include at least one Support node (id starting with dec-file-0-), e.g. Refund/Dispute Tickets or Customer Mentions of Public Escalation, reachable via the links list from your Compliance nodes.
- Keep consequences and solution to 2-4 short bullet points each so the response is complete.
- Output ONLY one valid JSON object. No markdown, no code fence. Use \\n for newlines in strings.

Output format (exact structure):
{
  "consequences": "bullet list of consequences",
  "solution": "bullet list of solution steps",
  "predictedOutput": "short phrase",
  "pathNodeIds": ["rootId", "nodeId2", "...", "predictionNodeId"]
}

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
  const prompt = buildPrompt(question.trim(), safeNodes, safeLinks, pastContext);
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
      console.error(
        "[plan] 502: path invalid. pathNodeIds:",
        parsed.pathNodeIds,
        "nodeIds sample:",
        safeNodes.slice(0, 3).map((n) => n.id),
        "links sample:",
        safeLinks.slice(0, 3)
      );
      return res.status(502).json({
        error: "Invalid response from Gemini",
        details: "pathNodeIds is not a valid path in the graph (must start at root, follow links).",
      });
    }
    if (typeof parsed.consequences !== "string" || !parsed.consequences.trim()) {
      console.error("[plan] 502: consequences missing or empty");
      return res.status(502).json({
        error: "Invalid response from Gemini",
        details: "consequences missing or empty",
      });
    }
    if (typeof parsed.solution !== "string" || !parsed.solution.trim()) {
      console.error("[plan] 502: solution missing or empty");
      return res.status(502).json({
        error: "Invalid response from Gemini",
        details: "solution missing or empty",
      });
    }
    if (typeof parsed.predictedOutput !== "string" || !parsed.predictedOutput.trim()) {
      console.error("[plan] 502: predictedOutput missing or empty");
      return res.status(502).json({
        error: "Invalid response from Gemini",
        details: "predictedOutput missing or empty",
      });
    }

    return res.status(200).json(parsed);
  } catch (e) {
    console.error("Plan API error", e);
    return res.status(500).json({
      error: e instanceof Error ? e.message : "Plan failed",
    });
  }
}
