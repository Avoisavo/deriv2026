import type {
  Department,
  Decision,
  EvolutionHistoryEntry,
  GraphNode,
  GraphLink,
  DecisionTreeData,
} from "@/types/decision-tree";

const DEPT_COLORS = [
  "#22c55e", // green
  "#f97316", // orange
  "#3b82f6", // blue
  "#ef4444", // red
  "#eab308", // yellow
  "#a855f7", // purple
  "#06b6d4", // cyan
  "#6b7280", // gray
];

const DEPT_NAMES = [
  "Research",
  "Automation",
  "Operations",
  "Strategy",
  "Product",
  "Engineering",
  "Design",
  "Support",
];

const CATEGORIES = [
  "Knowledge Base",
  "Process",
  "Policy",
  "Workflow",
  "Guideline",
];

const TITLE_WORDS = [
  "Integrated Management",
  "Decision Framework",
  "Approval Flow",
  "Risk Assessment",
  "Quality Gate",
  "Release Process",
  "Onboarding Checklist",
  "Escalation Path",
  "Review Cycle",
  "Audit Trail",
];

/** Deterministic seeded RNG so server and client produce identical mock data (avoids hydration mismatch). */
function createSeededRandom(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function deterministicChoice<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function deterministicInt(min: number, max: number, rng: () => number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function generateEvolutionHistory(version: string): EvolutionHistoryEntry[] {
  const entries: EvolutionHistoryEntry[] = [];
  const [major, minor] = version.slice(1).split(".").map(Number);
  for (let m = 1; m <= major; m++) {
    const maxMin = m === major ? minor : 3;
    for (let n = 0; n <= maxMin; n++) {
      entries.push({
        version: `v${m}.${n}`,
        date: `2026-0${Math.min(m, 2)}-${String(n + 1).padStart(2, "0")}`,
        description: `Version ${m}.${n} update`,
      });
    }
  }
  return entries.reverse();
}

function generateDecisions(departmentIds: string[], rng: () => number): Decision[] {
  const decisions: Decision[] = [];
  let id = 0;
  const statuses = ["ACTIVE", "DRAFT", "ARCHIVED"];
  departmentIds.forEach((deptId) => {
    const count = deterministicInt(5, 14, rng);
    for (let i = 0; i < count; i++) {
      const version = `v${deterministicInt(1, 3, rng)}.${deterministicInt(0, 3, rng)}`;
      const title = deterministicChoice(TITLE_WORDS, rng);
      decisions.push({
        id: `dec-${id}`,
        title,
        departmentId: deptId,
        version,
        status: deterministicChoice(statuses, rng),
        created: `2026-0${deterministicInt(1, 2, rng)}-${String(deterministicInt(1, 28, rng)).padStart(2, "0")}`,
        category: deterministicChoice(CATEGORIES, rng),
        size: `${(rng() * 30 + 5).toFixed(1)}K`,
        description: `Decision and workflow for ${title.toLowerCase()}. Used across teams for consistency.`,
        briefDescription: `This node affects ${title.toLowerCase()} and downstream dependencies.`,
        affectedCodeDescription: `// Affected modules:\n// - src/policies/${title.replace(/\s+/g, "-").toLowerCase()}.ts\n// - src/workflows/validate-${title.split(" ")[0]?.toLowerCase() ?? "node"}.ts\n\nif (status === "ACTIVE") {\n  await applyPolicy(nodeId);\n}`,
        mitigationPlan: `1. Review the change impact on ${title}.\n2. Run validation workflow and fix any failing checks.\n3. Update dependent policies if needed.\n4. Deploy after approval.`,
        evolutionHistory: generateEvolutionHistory(version),
      });
      id++;
    }
  });
  return decisions;
}

/**
 * Builds nodes and links so that:
 * - Within each department, nodes form a proper multi-level decision tree:
 *   root (level 0) → internal nodes (level 1) → ... → leaf nodes.
 * - A few cross-department links are added (linkage between nodes in different departments).
 * - Core links are added in the graph component.
 * Uses a binary-tree-like layout: node at index i has parent at floor((i-1)/2).
 */
function buildNodesAndLinks(
  departments: Department[],
  decisions: Decision[],
  _rng: () => number
): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = decisions.map((d) => ({
    id: d.id,
    payload: { decision: d, departmentId: d.departmentId },
  }));

  const links: GraphLink[] = [];
  const decisionsByDept = new Map<string, Decision[]>();
  decisions.forEach((d) => {
    if (!decisionsByDept.has(d.departmentId)) decisionsByDept.set(d.departmentId, []);
    decisionsByDept.get(d.departmentId)!.push(d);
  });

  departments.forEach((dept) => {
    const deptDecisions = decisionsByDept.get(dept.id) ?? [];
    if (deptDecisions.length === 0) return;
    for (let i = 1; i < deptDecisions.length; i++) {
      const child = deptDecisions[i];
      const parentIndex = Math.floor((i - 1) / 2);
      const parent = deptDecisions[parentIndex];
      links.push({ source: parent.id, target: child.id });
    }
  });

  // Add cross-department links (linkage between nodes in different departments).
  const deptIds = departments.map((d) => d.id);
  if (deptIds.length >= 2) {
    departments.forEach((dept) => {
      const deptDecisions = decisionsByDept.get(dept.id) ?? [];
      if (deptDecisions.length === 0) return;
      const otherDepts = deptIds.filter((id) => id !== dept.id);
      const numCrossLinks = Math.min(2, otherDepts.length);
      for (let k = 0; k < numCrossLinks; k++) {
        const otherDeptId = deterministicChoice(otherDepts, _rng);
        const otherDecisions = decisionsByDept.get(otherDeptId) ?? [];
        if (otherDecisions.length === 0) continue;
        const fromNode = deterministicChoice(deptDecisions, _rng);
        const toNode = deterministicChoice(otherDecisions, _rng);
        links.push({ source: fromNode.id, target: toNode.id });
      }
    });
  }

  return { nodes, links };
}

const MOCK_SEED = 12345;

export function getMockDecisionTreeData(): DecisionTreeData {
  const rng = createSeededRandom(MOCK_SEED);
  const numDepts = 5;
  const departments: Department[] = Array.from({ length: numDepts }, (_, i) => ({
    id: `dept-${i}`,
    name: DEPT_NAMES[i] ?? `Department ${i}`,
    color: DEPT_COLORS[i] ?? DEPT_COLORS[0],
    visible: true,
    decisionIds: [],
  }));

  const departmentIds = departments.map((d) => d.id);
  const decisions = generateDecisions(departmentIds, rng);

  decisions.forEach((d) => {
    const dept = departments.find((x) => x.id === d.departmentId);
    if (dept) dept.decisionIds.push(d.id);
  });

  const { nodes, links } = buildNodesAndLinks(departments, decisions, rng);
  return { departments, decisions, nodes, links };
}

/**
 * Returns the path from the department root to the given node (root → … → nodeId).
 * Only nodes on this chain are included; only this path lights up when a node is clicked.
 * Uses same-dept links only; parent = link source, child = link target.
 */
export function getPathFromRootToNode(
  nodeId: string,
  nodes: GraphNode[],
  links: GraphLink[]
): string[] {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return [nodeId];
  const deptId = node.payload.departmentId;
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const sameDeptLinks = links.filter((l) => {
    const srcId = typeof l.source === "string" ? l.source : (l.source as { id: string }).id;
    const tgtId = typeof l.target === "string" ? l.target : (l.target as { id: string }).id;
    const src = nodeById.get(srcId);
    const tgt = nodeById.get(tgtId);
    return src && tgt && src.payload.departmentId === deptId && tgt.payload.departmentId === deptId;
  });
  const parent = new Map<string, string>();
  sameDeptLinks.forEach((l) => {
    const src = typeof l.source === "string" ? l.source : (l.source as { id: string }).id;
    const tgt = typeof l.target === "string" ? l.target : (l.target as { id: string }).id;
    parent.set(tgt, src);
  });
  const back: string[] = [];
  const seen = new Set<string>();
  let current: string | undefined = nodeId;
  const maxPathLen = 32;
  while (current && back.length < maxPathLen && !seen.has(current)) {
    seen.add(current);
    back.push(current);
    current = parent.get(current);
  }
  back.reverse();
  return back;
}
