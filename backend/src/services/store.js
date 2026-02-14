import { transformDataset } from "./transformService.js";
import { generateInsight, applyEvidenceToInsight } from "./insightService.js";
import { loadSourceData } from "../lib/loadData.js";
import { clamp, dedupeArray, toSlug } from "../lib/utils.js";

class TrumanStore {
  constructor() {
    this.ready = false;
    this.state = {
      meta: {},
      summaries: [],
      informationNodes: [],
      nodeLinks: [],
      insightBlocks: [],
      briefingCards: [],
      injections: [],
    };
  }

  async initialize() {
    const sourceData = await loadSourceData();
    this.state = {
      ...this.state,
      ...transformDataset(sourceData),
      injections: [],
    };
    this.ready = true;
  }

  assertReady() {
    if (!this.ready) {
      throw new Error("Store is not initialized");
    }
  }

  getOverview() {
    this.assertReady();
    return {
      meta: this.state.meta,
      counts: {
        summaries: this.state.summaries.length,
        information_nodes: this.state.informationNodes.length,
        node_links: this.state.nodeLinks.length,
        insight_blocks: this.state.insightBlocks.length,
      },
      latest_summary_at: this.state.summaries[0]?.created_at ?? null,
    };
  }

  getSummaries({ limit = 50, source, importance }) {
    this.assertReady();
    let rows = [...this.state.summaries];
    if (source) rows = rows.filter((r) => r.source === source);
    if (importance) rows = rows.filter((r) => r.importance === importance);
    return rows.slice(0, limit);
  }

  getNodes({ limit = 100, tag, entity }) {
    this.assertReady();
    let rows = [...this.state.informationNodes];
    if (tag) rows = rows.filter((r) => r.tags.includes(toSlug(tag)));
    if (entity) rows = rows.filter((r) => r.entities.includes(toSlug(entity)) || r.entities.includes(entity));
    return rows.slice(0, limit);
  }

  getLinks({ nodeId }) {
    this.assertReady();
    if (!nodeId) return this.state.nodeLinks;
    return this.state.nodeLinks.filter((l) => l.from_node_id === nodeId || l.to_node_id === nodeId);
  }

  getBriefing() {
    this.assertReady();
    return this.state.briefingCards;
  }

  createInsight({ scenarioPrompt, selectedNodeIds }) {
    this.assertReady();
    const insightId = `ins_${String(this.state.insightBlocks.length + 1).padStart(4, "0")}`;
    const insight = generateInsight({
      scenarioPrompt,
      selectedNodeIds,
      allNodes: this.state.informationNodes,
      insightId,
      generatedAt: new Date().toISOString(),
    });
    this.state.insightBlocks.unshift(insight);
    return insight;
  }

  getInsight(insightId) {
    this.assertReady();
    return this.state.insightBlocks.find((i) => i.insight_id === insightId) ?? null;
  }

  getAllInsights() {
    this.assertReady();
    return this.state.insightBlocks;
  }

  injectEvidence({ title, source, contentText, targetInsightId }) {
    this.assertReady();
    const now = new Date().toISOString();
    const text = String(contentText ?? "");
    const textLower = text.toLowerCase();
    const tags = dedupeArray(
      textLower
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length > 3)
        .slice(0, 8)
    );

    const summaryId = `sum_${String(this.state.summaries.length + 1).padStart(4, "0")}`;
    const nodeId = `node_${String(this.state.informationNodes.length + 1).padStart(4, "0")}`;
    const summary = {
      summary_id: summaryId,
      update_id: `inj_${String(this.state.injections.length + 1).padStart(4, "0")}`,
      source: source ?? "demo_injection",
      title: title ?? "Injected evidence",
      summary: text.slice(0, 220),
      entities: tags,
      tags,
      importance: "high",
      confidence: Number(clamp(0.55 + tags.length * 0.04, 0.45, 0.93).toFixed(2)),
      created_at: now,
    };

    const node = {
      node_id: nodeId,
      summary_id: summaryId,
      event_id: `ev_inj_${String(this.state.injections.length + 1).padStart(4, "0")}`,
      event_type: "EVIDENCE_INJECTED",
      event_text: summary.summary,
      domain: "operations",
      entities: tags,
      tags,
      importance: "high",
      confidence: summary.confidence,
      timestamp: now,
      source_refs: { raw_id: null, payload_ref: null },
    };

    this.state.summaries.unshift(summary);
    this.state.informationNodes.unshift(node);

    for (const existing of this.state.informationNodes.slice(1, 30)) {
      const shared = dedupeArray(existing.tags.filter((t) => node.tags.includes(t)));
      if (shared.length === 0) continue;
      this.state.nodeLinks.unshift({
        link_id: `link_${String(this.state.nodeLinks.length + 1).padStart(4, "0")}`,
        from_node_id: node.node_id,
        to_node_id: existing.node_id,
        link_type: "shared_entity_or_tag",
        shared_keys: shared,
        strength: Number(clamp(shared.length / 3, 0.22, 0.88).toFixed(2)),
        created_at: now,
      });
    }

    let updatedInsight = null;
    if (targetInsightId) {
      const idx = this.state.insightBlocks.findIndex((x) => x.insight_id === targetInsightId);
      if (idx >= 0) {
        this.state.insightBlocks[idx] = applyEvidenceToInsight(this.state.insightBlocks[idx], summary);
        updatedInsight = this.state.insightBlocks[idx];
      }
    }

    const injection = {
      injection_id: summary.update_id,
      timestamp: now,
      summary_id: summary.summary_id,
      node_id: node.node_id,
      target_insight_id: targetInsightId ?? null,
    };

    this.state.injections.unshift(injection);

    return { injection, summary, node, updatedInsight };
  }
}

export const trumanStore = new TrumanStore();
