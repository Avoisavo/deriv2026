import type { NextApiRequest, NextApiResponse } from "next";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type {
  Department,
  Decision,
  GraphNode,
  GraphLink,
  DecisionTreeData,
} from "@/types/decision-tree";

// Resolve data path: prefer cwd/data (when run from frontend), fallback to frontend/data (when run from repo root)
function getPredictionNodesPath(): string {
  const fromCwd = join(process.cwd(), "data", "prediction-nodes.txt");
  if (existsSync(fromCwd)) return fromCwd;
  const fromFrontend = join(process.cwd(), "frontend", "data", "prediction-nodes.txt");
  return fromFrontend;
}

const DEPT_COLORS = [
  "#22c55e",
  "#f97316",
  "#3b82f6",
  "#ef4444",
  "#eab308",
  "#a855f7",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
  "#f43f5e",
];

interface ParsedBlock {
  departmentName: string;
  predictedOutput: string;
  nodeTitles: string[];
  links: { from: number; to: number }[];
}

function readPredictionBlocks(): ParsedBlock[] {
  const filePath = getPredictionNodesPath();
  if (!existsSync(filePath)) return [];
  try {
    const content = readFileSync(filePath, "utf-8");
    const blocks = content
      .split(/========== prediction ==========/)
      .filter((b) => b.trim());
    const result: ParsedBlock[] = [];

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
            const title = match
              ? match[1].trim()
              : trimmed
                  .replace(/^\d+:\s*/, "")
                  .replace(/\s*\([^)]*\)\s*$/, "")
                  .trim();
            nodeTitles.push(title);
          }
        } else if (section === "links" && /^\d+\s*->\s*\d+/.test(trimmed)) {
          const match = trimmed.match(/(\d+)\s*->\s*(\d+)/);
          if (match)
            links.push({
              from: parseInt(match[1], 10),
              to: parseInt(match[2], 10),
            });
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

function blocksToTreeData(blocks: ParsedBlock[]): DecisionTreeData {
  const departments: Department[] = [];
  const decisions: Decision[] = [];
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  blocks.forEach((block, blockIndex) => {
    const deptId = `dept-file-${blockIndex}`;
    const decisionIds: string[] = [];
    const nodeIds: string[] = [];

    block.nodeTitles.forEach((title, nodeIndex) => {
      const decId = `dec-file-${blockIndex}-${nodeIndex}`;
      decisionIds.push(decId);
      nodeIds.push(decId);

      const decision: Decision = {
        id: decId,
        title,
        departmentId: deptId,
        version: "v1.0",
        status: "ACTIVE",
        created: new Date().toISOString().slice(0, 10),
        category: "Prediction",
        size: "—",
        description: title,
        briefDescription: block.predictedOutput,
        evolutionHistory: [],
      };
      decisions.push(decision);
      nodes.push({
        id: decId,
        payload: { decision, departmentId: deptId },
      });
    });

    block.links.forEach(({ from, to }) => {
      if (
        from >= 0 &&
        from < nodeIds.length &&
        to >= 0 &&
        to < nodeIds.length
      ) {
        links.push({ source: nodeIds[from], target: nodeIds[to] });
      }
    });

    const colorIdx = blockIndex % DEPT_COLORS.length;
    departments.push({
      id: deptId,
      name: block.departmentName || `Prediction ${blockIndex + 1}`,
      color: DEPT_COLORS[colorIdx],
      visible: true,
      decisionIds,
    });
  });

  // Cross-department links so paths can span Support → Finance → Ops → Compliance
  const blockNodeIds = blocks.map((block, bi) =>
    block.nodeTitles.map((_, ni) => `dec-file-${bi}-${ni}`)
  );
  // Chain: last node of block i → first node of block i+1 (optional path; direct jumps below preferred)
  for (let i = 0; i < blocks.length - 1; i++) {
    const lastIdx = blockNodeIds[i].length - 1;
    const fromId = blockNodeIds[i][lastIdx];
    const toId = blockNodeIds[i + 1][0];
    if (fromId && toId) links.push({ source: fromId, target: toId });
  }
  // Direct cross-block links: jump from node to node by theme (all domain pairs, both directions)
  const linkByTheme = (
    fromBlock: number,
    fromKeywords: string[],
    toBlock: number,
    toKeywords: string[]
  ) => {
    if (fromBlock === toBlock || fromBlock >= blocks.length || toBlock >= blocks.length) return;
    blocks[fromBlock].nodeTitles.forEach((fromTitle, ni) => {
      const t = fromTitle.toLowerCase();
      if (!fromKeywords.some((k) => t.includes(k))) return;
      blocks[toBlock].nodeTitles.forEach((toTitle, nj) => {
        if (!toKeywords.some((k) => toTitle.toLowerCase().includes(k))) return;
        const fromId = blockNodeIds[fromBlock][ni];
        const toId = blockNodeIds[toBlock][nj];
        if (fromId && toId) links.push({ source: fromId, target: toId });
      });
    });
  };

  if (blocks.length > 1) {
    // Theme rules: (fromKeywords, toKeywords) applied for each (i, j) block pair
    const themeRules: { from: string[]; to: string[] }[] = [
      { from: ["refund", "dispute", "escalation", "backlog", "response time"], to: ["refund", "dispute", "watchlist", "emergency"] },
      { from: ["ticket", "peak", "stuck", "sentiment", "deposit"], to: ["latency", "error rate", "incident", "rollback", "deployment"] },
      { from: ["refund", "dispute", "verification", "escalation"], to: ["payment", "kyc", "compliance", "dispute", "verification", "escalation", "watchlist"] },
      { from: ["vendor", "contractor", "dns", "autoscaling", "cost control", "hiring", "cloud spend", "emergency"], to: ["latency", "error rate", "incident", "rollback"] },
      { from: ["emergency", "refund", "watchlist", "cost"], to: ["audit", "emergency", "watchlist", "payment", "compliance"] },
      { from: ["incident", "error rate", "latency", "rollback", "deployment"], to: ["incident", "verification", "dispute", "escalation", "watchlist", "communication"] },
      // Compliance → Finance/Ops: escalation, payment, monitoring nodes can lead to Finance or Ops outcomes
      { from: ["escalation", "payment", "monitoring", "threshold", "transaction"], to: ["incident", "rollback", "latency", "error rate", "watchlist", "emergency", "cost control"] },
      // Compliance → Support: verification delays, complaints, dispute intake tie to support tickets and customer escalation
      { from: ["complaints", "verification", "delay", "customer", "kyc", "queue", "dispute intake"], to: ["customer", "escalation", "ticket", "complaint", "refund", "dispute", "response time", "backlog"] },
    ];

    for (let i = 0; i < blocks.length; i++) {
      for (let j = 0; j < blocks.length; j++) {
        if (i === j) continue;
        for (const rule of themeRules) {
          linkByTheme(i, rule.from, j, rule.to);
        }
      }
    }

    // Any block: incident → emergency (all blocks)
    blocks.forEach((block, bi) => {
      block.nodeTitles.forEach((title, ni) => {
        if (!title.toLowerCase().includes("incident")) return;
        blocks.forEach((otherBlock, bj) => {
          if (bj === bi) return;
          otherBlock.nodeTitles.forEach((otherTitle, nj) => {
            if (!otherTitle.toLowerCase().includes("emergency")) return;
            const fromId = blockNodeIds[bi][ni];
            const toId = blockNodeIds[bj][nj];
            if (fromId && toId) links.push({ source: fromId, target: toId });
          });
        });
      });
    });
  }

  return { departments, decisions, nodes, links };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Prevent 304 / caching so the client always gets a full JSON body
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  const blocks = readPredictionBlocks();
  if (blocks.length === 0) {
    return res.status(200).json(null);
  }

  const treeData = blocksToTreeData(blocks);
  return res.status(200).json(treeData);
}
