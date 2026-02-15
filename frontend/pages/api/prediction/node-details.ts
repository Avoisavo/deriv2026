import type { NextApiRequest, NextApiResponse } from "next";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { NodeDetail } from "@/types/prediction";

function getPredictionNodesPath(): string {
  const fromCwd = join(process.cwd(), "data", "prediction-nodes.txt");
  if (existsSync(fromCwd)) return fromCwd;
  return join(process.cwd(), "frontend", "data", "prediction-nodes.txt");
}

/** Parse prediction-nodes.txt and return a map from node title (output) to consequences, solution, and event summary. First occurrence of a title wins. */
function parseNodeDetails(): Record<string, NodeDetail> {
  const filePath = getPredictionNodesPath();
  const map: Record<string, NodeDetail> = {};
  if (!existsSync(filePath)) return map;

  try {
    const content = readFileSync(filePath, "utf-8");
    const blocks = content
      .split(/========== prediction ==========/)
      .filter((b) => b.trim());

    for (const block of blocks) {
      const lines = block.split(/\r?\n/);
      let inNodes = false;
      let current: Partial<NodeDetail> = {};
      let currentTitle = "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === "====================================") break;
        if (trimmed.startsWith("nodes (each node:")) {
          inNodes = true;
          continue;
        }
        if (trimmed === "links:") break;

        if (!inNodes) continue;

        if (/^--- node \d+ ---$/.test(trimmed)) {
          if (currentTitle && (current.consequences ?? current.solution ?? current.eventSummary)) {
            if (!map[currentTitle]) map[currentTitle] = {};
            if (current.consequences) map[currentTitle].consequences = current.consequences;
            if (current.solution) map[currentTitle].solution = current.solution;
            if (current.eventSummary) map[currentTitle].eventSummary = current.eventSummary;
          }
          current = {};
          currentTitle = "";
          continue;
        }

        if (trimmed.startsWith("events happened:")) {
          const jsonStr = trimmed.replace(/^events happened:\s*/, "").trim();
          try {
            const obj = JSON.parse(jsonStr) as { summary?: string; title?: string };
            current.eventSummary = obj.summary ?? obj.title ?? "";
          } catch {
            current.eventSummary = "";
          }
          continue;
        }
        if (trimmed.startsWith("consequences:")) {
          current.consequences = trimmed.replace(/^consequences:\s*/, "").trim();
          continue;
        }
        if (trimmed.startsWith("solution:")) {
          current.solution = trimmed.replace(/^solution:\s*/, "").trim();
          continue;
        }
        if (trimmed.startsWith("output:")) {
          currentTitle = trimmed.replace(/^output:\s*/, "").trim();
          continue;
        }
      }

      if (currentTitle && (current.consequences ?? current.solution ?? current.eventSummary)) {
        if (!map[currentTitle]) map[currentTitle] = {};
        if (current.consequences) map[currentTitle].consequences = current.consequences;
        if (current.solution) map[currentTitle].solution = current.solution;
        if (current.eventSummary) map[currentTitle].eventSummary = current.eventSummary;
      }
    }
    return map;
  } catch (e) {
    console.warn("Failed to parse prediction-nodes.txt for node details", e);
    return {};
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Record<string, NodeDetail>>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({});
  }
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  const details = parseNodeDetails();
  return res.status(200).json(details);
}
