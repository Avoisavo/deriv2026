import { clamp, dedupeArray, stableSortByTimeDesc, toSlug } from "../lib/utils.js";

const IMPORTANCE_WEIGHTS = {
  PURCHASE_OBSERVED: 0.62,
  INVENTORY_SNAPSHOT_OBSERVED: 0.78,
  BASELINE_BEHAVIOR_OBSERVED: 0.52,
};

function scoreImportance(eventType) {
  const value = IMPORTANCE_WEIGHTS[eventType] ?? 0.5;
  if (value >= 0.75) return "high";
  if (value >= 0.55) return "medium";
  return "low";
}

function extractTags(event) {
  const tags = [
    event.event_type,
    event.payload?.sku,
    event.payload?.warehouse,
    event.entity_id,
    event.payload?.category,
  ]
    .filter(Boolean)
    .map((x) => toSlug(x));

  if (event.event_type?.includes("INVENTORY")) tags.push("operations");
  if (event.event_type?.includes("PURCHASE")) tags.push("customer_behavior");
  if (event.event_type?.includes("BASELINE")) tags.push("survey");

  return dedupeArray(tags);
}

function summarizeEvent(event, entity) {
  if (event.event_type === "PURCHASE_OBSERVED") {
    return `${entity?.name ?? event.entity_id} purchased ${event.payload?.qty ?? 1}x ${event.payload?.sku ?? "item"}.`;
  }
  if (event.event_type === "INVENTORY_SNAPSHOT_OBSERVED") {
    return `Inventory snapshot for ${entity?.name ?? event.entity_id}: stock ${event.payload?.stock_on_hand ?? "unknown"} at ${event.payload?.warehouse ?? "warehouse"}.`;
  }
  if (event.event_type === "BASELINE_BEHAVIOR_OBSERVED") {
    return `${entity?.name ?? event.entity_id} reports baseline ${event.payload?.plastic_bottles_per_day ?? "unknown"} plastic bottles/day.`;
  }
  return `${event.event_type} observed for ${entity?.name ?? event.entity_id}.`;
}

function classifyDomain(entityType, eventType) {
  if (entityType === "person") return "workforce";
  if (entityType === "item" && eventType.includes("INVENTORY")) return "supply_chain";
  if (entityType === "item") return "product";
  if (entityType === "company") return "strategy";
  return "operations";
}

function computeLinkStrength(a, b) {
  const aSet = new Set([...(a.tags ?? []), ...(a.entities ?? [])]);
  const bSet = new Set([...(b.tags ?? []), ...(b.entities ?? [])]);
  let overlap = 0;
  for (const key of aSet) {
    if (bSet.has(key)) overlap += 1;
  }
  const denom = Math.max(1, Math.min(aSet.size, bSet.size));
  return clamp(overlap / denom, 0.1, 0.95);
}

function collectSharedKeys(a, b) {
  const keys = [];
  const bSet = new Set([...(b.tags ?? []), ...(b.entities ?? [])]);
  for (const item of [...(a.tags ?? []), ...(a.entities ?? [])]) {
    if (bSet.has(item)) keys.push(item);
  }
  return dedupeArray(keys);
}

function buildNodeLinks(nodes) {
  const links = [];
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const sharedKeys = collectSharedKeys(nodes[i], nodes[j]);
      if (sharedKeys.length === 0) continue;
      links.push({
        link_id: `link_${String(links.length + 1).padStart(4, "0")}`,
        from_node_id: nodes[i].node_id,
        to_node_id: nodes[j].node_id,
        link_type: "shared_entity_or_tag",
        shared_keys: sharedKeys,
        strength: Number(computeLinkStrength(nodes[i], nodes[j]).toFixed(2)),
        created_at: new Date().toISOString(),
      });
    }
  }
  return links;
}

function makeBriefingCards(nodes, summaries) {
  const byDomain = new Map();
  for (const node of stableSortByTimeDesc(nodes, "timestamp")) {
    if (!byDomain.has(node.domain)) {
      const summary = summaries.find((s) => s.summary_id === node.summary_id);
      byDomain.set(node.domain, {
        card_id: `card_${node.node_id}`,
        domain: node.domain,
        title: node.event_type,
        summary: summary?.summary ?? node.event_text,
        importance: node.importance,
        confidence: node.confidence,
        timestamp: node.timestamp,
        investigate_node_id: node.node_id,
      });
    }
  }
  return [...byDomain.values()];
}

export function transformDataset(sourceData) {
  const entities = sourceData.dataset.entities ?? [];
  const events = sourceData.dataset.events ?? [];
  const rawRecords = sourceData.dataset.raw_records ?? [];

  const entityById = new Map(entities.map((e) => [e.entity_id, e]));
  const rawById = new Map(rawRecords.map((r) => [r.raw_id, r]));

  const summaries = [];
  const informationNodes = [];

  for (const event of events) {
    const entity = entityById.get(event.entity_id);
    const rawId = String(event.evidence_refs ?? "").replace("raw:", "");
    const rawRecord = rawById.get(rawId);
    const summaryId = `sum_${String(summaries.length + 1).padStart(4, "0")}`;

    const summaryText = summarizeEvent(event, entity);
    const confidenceBase = IMPORTANCE_WEIGHTS[event.event_type] ?? 0.55;
    const confidence = Number(clamp(confidenceBase + 0.15, 0.35, 0.97).toFixed(2));
    const tags = extractTags(event);
    const entitiesForNode = dedupeArray([
      event.entity_id,
      event.payload?.sku,
      entity?.type,
      entity?.name,
    ].map((x) => (x ? toSlug(x) : null)));

    summaries.push({
      summary_id: summaryId,
      update_id: rawRecord?.raw_id ?? event.event_id,
      source: rawRecord?.source ?? "derived_event",
      title: event.event_type,
      summary: summaryText,
      entities: entitiesForNode,
      tags,
      importance: scoreImportance(event.event_type),
      confidence,
      created_at: event.time,
    });

    informationNodes.push({
      node_id: `node_${String(informationNodes.length + 1).padStart(4, "0")}`,
      summary_id: summaryId,
      event_id: event.event_id,
      event_type: event.event_type,
      event_text: summaryText,
      domain: classifyDomain(entity?.type, event.event_type),
      entities: entitiesForNode,
      tags,
      importance: scoreImportance(event.event_type),
      confidence,
      timestamp: event.time,
      source_refs: {
        raw_id: rawRecord?.raw_id ?? null,
        payload_ref: rawRecord?.payload_ref ?? null,
      },
    });
  }

  const nodeLinks = buildNodeLinks(informationNodes);
  const briefingCards = makeBriefingCards(informationNodes, summaries);

  return {
    meta: sourceData.hotLayer.meta ?? { tenant: "unknown", as_of: new Date().toISOString() },
    summaries: stableSortByTimeDesc(summaries, "created_at"),
    informationNodes: stableSortByTimeDesc(informationNodes, "timestamp"),
    nodeLinks,
    insightBlocks: [],
    briefingCards,
  };
}
