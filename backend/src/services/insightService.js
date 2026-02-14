import { clamp, dedupeArray, stableSortByTimeDesc, toSlug } from "../lib/utils.js";

function tokenize(value) {
  return String(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function scoreNodeForScenario(node, queryTokens) {
  const haystack = [
    node.event_type,
    node.event_text,
    ...(node.tags ?? []),
    ...(node.entities ?? []),
    node.domain,
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;
  for (const token of queryTokens) {
    if (haystack.includes(token)) score += 1;
  }
  return score;
}

function chooseRelevantNodes(nodes, scenarioPrompt, selectedNodeIds) {
  if (Array.isArray(selectedNodeIds) && selectedNodeIds.length > 0) {
    const idSet = new Set(selectedNodeIds);
    const picked = nodes.filter((n) => idSet.has(n.node_id));
    return stableSortByTimeDesc(picked, "timestamp").slice(0, 6);
  }

  const queryTokens = tokenize(scenarioPrompt);
  const scored = nodes
    .map((node) => ({ node, score: scoreNodeForScenario(node, queryTokens) }))
    .sort((a, b) => b.score - a.score || Date.parse(b.node.timestamp) - Date.parse(a.node.timestamp));

  const top = scored.filter((s) => s.score > 0).slice(0, 6).map((x) => x.node);
  if (top.length > 0) return top;
  return stableSortByTimeDesc(nodes, "timestamp").slice(0, 4);
}

function buildBeliefs(nodes) {
  const domainCounts = new Map();
  for (const node of nodes) {
    domainCounts.set(node.domain, (domainCounts.get(node.domain) ?? 0) + 1);
  }

  const rankedDomains = [...domainCounts.entries()].sort((a, b) => b[1] - a[1]);
  const beliefs = rankedDomains.slice(0, 3).map(([domain], idx) => {
    const supporting = nodes.filter((n) => n.domain === domain).slice(0, 3);
    const base = idx === 0 ? 0.52 : idx === 1 ? 0.3 : 0.18;
    const confidenceBoost = supporting.reduce((acc, n) => acc + (n.confidence ?? 0.5), 0) / Math.max(1, supporting.length);
    return {
      belief_id: `b${idx + 1}`,
      text: `${domain.replace(/_/g, " ")} signals are a primary driver of current state shifts.`,
      probability: Number(clamp(base + confidenceBoost * 0.15, 0.1, 0.85).toFixed(2)),
      evidence_node_ids: supporting.map((n) => n.node_id),
    };
  });

  const total = beliefs.reduce((acc, b) => acc + b.probability, 0) || 1;
  return beliefs.map((b) => ({ ...b, probability: Number((b.probability / total).toFixed(2)) }));
}

function buildOutcomes(nodes, scenarioPrompt) {
  const allTags = dedupeArray(nodes.flatMap((n) => n.tags ?? []));
  const hasInventory = allTags.includes("operations") || allTags.some((t) => t.includes("inventory"));
  const hasPurchases = allTags.includes("customer_behavior") || allTags.some((t) => t.includes("purchase"));
  const hasSurvey = allTags.includes("survey");

  const outcomes = [
    {
      outcome_id: "o1",
      text: hasInventory
        ? "Inventory pressure increases over the next 2 weeks without intervention."
        : "Operational variance increases over the next 2 weeks.",
      probability: 0.44,
      horizon_days: 14,
    },
    {
      outcome_id: "o2",
      text: hasPurchases
        ? "Behavioral nudges reduce single-use demand within 1 week."
        : "Targeted mitigation restores baseline metrics within 1 week.",
      probability: 0.36,
      horizon_days: 7,
    },
    {
      outcome_id: "o3",
      text: hasSurvey
        ? "New evidence revises assumptions and re-prioritizes sustainability budget."
        : "New cross-domain evidence forces roadmap reprioritization.",
      probability: 0.2,
      horizon_days: 21,
    },
  ];

  if (String(scenarioPrompt).toLowerCase().includes("cost")) {
    outcomes[1].probability += 0.08;
    outcomes[0].probability -= 0.05;
  }

  const sum = outcomes.reduce((acc, o) => acc + o.probability, 0);
  return outcomes.map((o) => ({ ...o, probability: Number((o.probability / sum).toFixed(2)) }));
}

function buildTree(outcomes) {
  return {
    root: { id: "root", label: "Current state", probability: 1 },
    branches: outcomes.map((o) => ({
      id: o.outcome_id,
      label: o.text,
      probability: o.probability,
      horizon_days: o.horizon_days,
      status: "predicted",
    })),
  };
}

export function generateInsight({ scenarioPrompt, selectedNodeIds, allNodes, insightId, generatedAt }) {
  const contextNodes = chooseRelevantNodes(allNodes, scenarioPrompt, selectedNodeIds);
  const beliefs = buildBeliefs(contextNodes);
  const outcomes = buildOutcomes(contextNodes, scenarioPrompt);

  return {
    insight_id: insightId,
    scenario_prompt: scenarioPrompt,
    context_node_ids: contextNodes.map((n) => n.node_id),
    beliefs,
    outcomes,
    reality_tree: buildTree(outcomes),
    model_meta: {
      council: ["llm_a", "llm_b", "llm_c", "llm_d"],
      generated_at: generatedAt,
      rationale_tags: dedupeArray(contextNodes.flatMap((n) => n.tags).slice(0, 12)),
      scenario_key: toSlug(scenarioPrompt),
    },
  };
}

export function applyEvidenceToInsight(insight, evidenceSummary) {
  const outcomes = insight.outcomes.map((outcome) => ({ ...outcome }));
  const text = `${evidenceSummary.title ?? ""} ${evidenceSummary.summary ?? ""}`.toLowerCase();

  if (text.includes("rollback") || text.includes("restor") || text.includes("improv")) {
    const positive = outcomes.find((o) => o.outcome_id === "o2") ?? outcomes[0];
    positive.probability += 0.15;
  } else {
    const risk = outcomes.find((o) => o.outcome_id === "o1") ?? outcomes[0];
    risk.probability += 0.12;
  }

  const total = outcomes.reduce((acc, o) => acc + o.probability, 0);
  const normalized = outcomes.map((o) => ({
    ...o,
    probability: Number(clamp(o.probability / total, 0.05, 0.9).toFixed(2)),
  }));

  return {
    ...insight,
    outcomes: normalized,
    reality_tree: {
      ...insight.reality_tree,
      branches: normalized.map((o) => ({
        id: o.outcome_id,
        label: o.text,
        probability: o.probability,
        horizon_days: o.horizon_days,
        status: "predicted",
      })),
    },
    model_meta: {
      ...insight.model_meta,
      last_evidence_update_at: new Date().toISOString(),
    },
  };
}
