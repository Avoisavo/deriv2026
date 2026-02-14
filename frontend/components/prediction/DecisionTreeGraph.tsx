"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { Department, GraphNode, GraphLink } from "@/types/decision-tree";
import type { PlanResponse } from "@/types/prediction";
import { PlanModePanel } from "./PlanModePanel";
import { PlanModeOverlay } from "./PlanModeOverlay";

const CORE_NODE_ID = "__core__";
const PREDICTION_NODE_ID = "__prediction__";
const CORE_LABEL = "CORE";
const TREE_ROOT_RADIUS = 95;
const TREE_LEVEL_HEIGHT = 52;
const TREE_ANGLE_SPREAD = 0.88;
/** Minimum angular width per leaf (radians) so subtrees get non-overlapping wedges. */
const MIN_WEDGE_RAD = 0.14;

/** Payload from Supabase Realtime when a new row is inserted (realtime AI decision POC). */
export interface RealtimeDecisionPayload {
  prompt: string;
  consequences: string;
  solution: string;
  outcome: string;
  pathLabels?: string[];
}

export interface DecisionTreeGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  departments: Department[];
  highlightedPathNodeIds: Set<string>;
  selectedNodeId: string | null;
  /** Ordered path node ids (root → selected) for plan mode. */
  pathNodeIds?: string[];
  onNodeClick: (nodeId: string) => void;
  /** Create a real prediction node when user clicks Proceed in overlay; returns the new node id. */
  onAddPredictionNode?: (pathNodeIds: string[], predictedOutput: string) => string;
  /** Central core label (e.g. company name). Default "CORE". */
  coreLabel?: string;
  /** Optional URL for company logo image to show in the core node. */
  coreLogoUrl?: string;
  /** When set, overlay is shown with this content and auto-proceeds after 1s (realtime POC). */
  realtimeDecision?: RealtimeDecisionPayload | null;
  /** Called when overlay is closed or Proceed is clicked for a realtime decision (so parent can clear realtimeDecision). */
  onRealtimeDecisionConsumed?: () => void;
}

type GraphNodeWithPos = GraphNode & { x?: number; y?: number; fx?: number; fy?: number };

function buildGraphDataWithCoreAndClusters(
  nodes: GraphNode[],
  links: GraphLink[],
  departments: Department[],
  showCrossDomainLinks = true
): { nodes: GraphNodeWithPos[]; links: { source: GraphNodeWithPos; target: GraphNodeWithPos }[] } {
  const deptOrder = departments.filter((d) => d.visible).map((d) => d.id);
  const nDepts = Math.max(1, deptOrder.length);
  const angleStep = (2 * Math.PI) / nDepts;

  const coreNode: GraphNodeWithPos = {
    id: CORE_NODE_ID,
    payload: {
      departmentId: "",
      decision: { id: CORE_NODE_ID, title: CORE_LABEL, departmentId: "", version: "", status: "", created: "", category: "", size: "", description: "", evolutionHistory: [] },
    },
    x: 0,
    y: 0,
    fx: 0,
    fy: 0,
  };

  const nodeById = new Map(nodes.map((n) => [n.id, { ...n, id: n.id } as GraphNodeWithPos]));

  const sameDeptLinks = links.filter((l) => {
    const src = nodeById.get(typeof l.source === "string" ? l.source : (l.source as { id: string }).id);
    const tgt = nodeById.get(typeof l.target === "string" ? l.target : (l.target as { id: string }).id);
    return src && tgt && src.payload.departmentId === tgt.payload.departmentId;
  });

  const childrenByNode = new Map<string, string[]>();
  sameDeptLinks.forEach((l) => {
    const src = typeof l.source === "string" ? l.source : (l.source as { id: string }).id;
    const tgt = typeof l.target === "string" ? l.target : (l.target as { id: string }).id;
    if (!childrenByNode.has(src)) childrenByNode.set(src, []);
    childrenByNode.get(src)!.push(tgt);
  });

  const positionByNodeId = new Map<string, { x: number; y: number }>();
  const coreTargets = new Set<string>();

  deptOrder.forEach((deptId, deptIndex) => {
    const deptNodes = nodes.filter((n) => n.payload.departmentId === deptId);
    if (deptNodes.length === 0) return;
    const root = deptNodes.find((n) => !sameDeptLinks.some((l) => (typeof l.target === "string" ? l.target : (l.target as { id: string }).id) === n.id)) ?? deptNodes[0];
    const rootId = root.id;
    coreTargets.add(rootId);

    const baseAngle = deptIndex * angleStep - Math.PI / 2;
    const spread = angleStep * TREE_ANGLE_SPREAD;

    // Wedge-based layout: each subtree gets a contiguous angular wedge so links don't cross.
    function subtreeWedgeWidth(nodeId: string): number {
      const children = childrenByNode.get(nodeId) ?? [];
      if (children.length === 0) return MIN_WEDGE_RAD;
      return Math.max(
        MIN_WEDGE_RAD,
        children.reduce((sum, c) => sum + subtreeWedgeWidth(c), 0)
      );
    }
    function placeInWedge(nodeId: string, angleStart: number, angleEnd: number, depth: number): void {
      const wedgeSize = angleEnd - angleStart;
      const angle = (angleStart + angleEnd) / 2;
      const radius = TREE_ROOT_RADIUS + depth * TREE_LEVEL_HEIGHT;
      positionByNodeId.set(nodeId, {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      });
      const children = childrenByNode.get(nodeId) ?? [];
      const totalChildWidth = children.reduce((sum, c) => sum + subtreeWedgeWidth(c), 0);
      const scale = totalChildWidth > 1e-6 ? wedgeSize / totalChildWidth : 1;
      let cur = angleStart;
      for (const c of children) {
        const rawW = subtreeWedgeWidth(c);
        const w = rawW * scale;
        placeInWedge(c, cur, cur + w, depth + 1);
        cur += w;
      }
    }
    placeInWedge(rootId, baseAngle - spread / 2, baseAngle + spread / 2, 0);
  });

  const decisionNodesWithPos: GraphNodeWithPos[] = nodes.map((n) => {
    const pos = positionByNodeId.get(n.id) ?? { x: 0, y: 0 };
    return {
      ...nodeById.get(n.id)!,
      x: pos.x,
      y: pos.y,
      fx: pos.x,
      fy: pos.y,
    };
  });

  const coreLinks: { source: GraphNodeWithPos; target: GraphNodeWithPos }[] = [];
  coreTargets.forEach((nodeId) => {
    const target = decisionNodesWithPos.find((nd) => nd.id === nodeId);
    if (target) coreLinks.push({ source: coreNode, target });
  });

  const mapLink = (l: GraphLink): { source: GraphNodeWithPos; target: GraphNodeWithPos } | null => {
    const srcId = typeof l.source === "string" ? l.source : (l.source as { id: string }).id;
    const tgtId = typeof l.target === "string" ? l.target : (l.target as { id: string }).id;
    const src = decisionNodesWithPos.find((nd) => nd.id === srcId);
    const tgt = decisionNodesWithPos.find((nd) => nd.id === tgtId);
    if (!src || !tgt) return null;
    return { source: src, target: tgt };
  };

  const sameDeptLinksMapped = sameDeptLinks
    .map(mapLink)
    .filter((l): l is { source: GraphNodeWithPos; target: GraphNodeWithPos } => l !== null);

  // Include cross-department links so path jumps (e.g. Refund/Dispute → Emergency Spend) are visible.
  const crossDeptLinks = links.filter((l) => {
    const src = nodeById.get(typeof l.source === "string" ? l.source : (l.source as { id: string }).id);
    const tgt = nodeById.get(typeof l.target === "string" ? l.target : (l.target as { id: string }).id);
    return src && tgt && src.payload.departmentId !== tgt.payload.departmentId;
  });
  const crossDeptLinksMapped = crossDeptLinks
    .map(mapLink)
    .filter((l): l is { source: GraphNodeWithPos; target: GraphNodeWithPos } => l !== null);

  const allLinks = showCrossDomainLinks
    ? [...coreLinks, ...sameDeptLinksMapped, ...crossDeptLinksMapped]
    : [...coreLinks, ...sameDeptLinksMapped];

  return {
    nodes: [coreNode, ...decisionNodesWithPos],
    links: allLinks,
  };
}

/**
 * Find an angle (from lastNode) to place the prediction node: prefers the "outward" direction
 * (path continuation away from core) and picks the largest angular gap near that direction
 * so the node sits at the end of the branch without overlapping others.
 */
function findPredictionNodeAngle(
  lastNode: { x: number; y: number },
  allNodes: { id: string; x?: number; y?: number }[],
  excludeIds: Set<string>,
  radius: number
): { angle: number; distance: number } {
  const x0 = lastNode.x;
  const y0 = lastNode.y;
  const outwardAngle = Math.atan2(y0, x0);
  const nearbyAngles: number[] = [];
  for (const n of allNodes) {
    if (excludeIds.has(n.id)) continue;
    const x = (n.x ?? 0) - x0;
    const y = (n.y ?? 0) - y0;
    const d = Math.hypot(x, y);
    if (d < 1e-6) continue;
    if (d > radius) continue;
    nearbyAngles.push(Math.atan2(y, x));
  }
  const baseDistance = TREE_LEVEL_HEIGHT * 1.8;
  if (nearbyAngles.length === 0) return { angle: outwardAngle, distance: baseDistance };
  nearbyAngles.sort((a, b) => a - b);
  let bestScore = -1;
  let bestAngle = outwardAngle;
  for (let i = 0; i < nearbyAngles.length; i++) {
    const next = nearbyAngles[(i + 1) % nearbyAngles.length];
    let gap = next - nearbyAngles[i];
    if (gap <= 0) gap += 2 * Math.PI;
    const midAngle = nearbyAngles[i] + gap / 2;
    let midNorm = midAngle;
    if (midNorm > Math.PI) midNorm -= 2 * Math.PI;
    if (midNorm < -Math.PI) midNorm += 2 * Math.PI;
    let diff = Math.abs(midNorm - outwardAngle);
    if (diff > Math.PI) diff = 2 * Math.PI - diff;
    const alignment = 1 - diff / Math.PI;
    const score = gap * (0.4 + 0.6 * alignment);
    if (score > bestScore) {
      bestScore = score;
      bestAngle = midNorm;
    }
  }
  const minClearance = TREE_LEVEL_HEIGHT * 1.2;
  let distance = baseDistance;
  const maxDistance = baseDistance * 2.2;
  for (let iter = 0; iter < 12; iter++) {
    const px = x0 + Math.cos(bestAngle) * distance;
    const py = y0 + Math.sin(bestAngle) * distance;
    let clear = true;
    for (const n of allNodes) {
      if (excludeIds.has(n.id)) continue;
      const nx = n.x ?? 0;
      const ny = n.y ?? 0;
      const d = Math.hypot(px - nx, py - ny);
      if (d < minClearance && d > 1e-6) {
        clear = false;
        distance = Math.min(distance + minClearance - d, maxDistance);
        break;
      }
    }
    if (clear) break;
  }
  return { angle: bestAngle, distance: Math.max(distance, baseDistance) };
}

/** Returns a demo path (root + first child) for the first visible department. */
function getDemoPathForPrompt(
  nodes: GraphNode[],
  links: GraphLink[],
  departments: Department[]
): string[] {
  const visibleDeptIds = departments.filter((d) => d.visible).map((d) => d.id);
  if (visibleDeptIds.length === 0) return [];
  const deptId = visibleDeptIds[0];
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const sameDeptLinks = links.filter((l) => {
    const src = nodeById.get(typeof l.source === "string" ? l.source : (l.source as { id: string }).id);
    const tgt = nodeById.get(typeof l.target === "string" ? l.target : (l.target as { id: string }).id);
    return src && tgt && src.payload.departmentId === deptId && tgt.payload.departmentId === deptId;
  });
  const childrenByNode = new Map<string, string[]>();
  sameDeptLinks.forEach((l) => {
    const src = typeof l.source === "string" ? l.source : (l.source as { id: string }).id;
    const tgt = typeof l.target === "string" ? l.target : (l.target as { id: string }).id;
    if (!childrenByNode.has(src)) childrenByNode.set(src, []);
    childrenByNode.get(src)!.push(tgt);
  });
  const deptNodes = nodes.filter((n) => n.payload.departmentId === deptId);
  const root = deptNodes.find((n) => !sameDeptLinks.some((l) => (typeof l.target === "string" ? l.target : (l.target as { id: string }).id) === n.id)) ?? deptNodes[0];
  const path = [root.id];
  const firstChild = childrenByNode.get(root.id)?.[0];
  if (firstChild) path.push(firstChild);
  return path;
}

export function DecisionTreeGraph({
  nodes,
  links,
  departments,
  highlightedPathNodeIds,
  selectedNodeId,
  pathNodeIds = [],
  onNodeClick,
  onAddPredictionNode,
  coreLabel = CORE_LABEL,
  realtimeDecision = null,
  onRealtimeDecisionConsumed,
}: DecisionTreeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  interface ForceGraphRef {
    graphData: (d: { nodes: unknown[]; links: unknown[] }) => ForceGraphRef;
    width: (w: number) => ForceGraphRef;
    height: (h: number) => ForceGraphRef;
    zoomToFit?: (durationMs?: number, padding?: number) => ForceGraphRef;
    _destructor: () => void;
  }
  const graphRef = useRef<ForceGraphRef | null>(null);
  const [mounted, setMounted] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [pillVisibleCount, setPillVisibleCount] = useState(0);
  const [planPrompt, setPlanPrompt] = useState("");
  const [promptPathNodeIds, setPromptPathNodeIds] = useState<string[] | null>(null);
  const [showPredictionNode, setShowPredictionNode] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [planResult, setPlanResult] = useState<PlanResponse | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  /** Flow animation: 0 = core only, 1 = core + first path node, etc. */
  const [pathFlowIndex, setPathFlowIndex] = useState(0);
  const pathFlowProgressRef = useRef(0);
  const [showCrossDomainLinks, setShowCrossDomainLinks] = useState(false);
  const effectivePathNodeIds = promptPathNodeIds
    ? [...promptPathNodeIds, ...(showPredictionNode ? [PREDICTION_NODE_ID] : [])]
    : pathNodeIds;
  const hasSelection = Boolean(
    (selectedNodeId && pathNodeIds.length > 0) || (promptPathNodeIds && promptPathNodeIds.length > 0)
  );
  const selectionRef = useRef({
    highlightedPathNodeIds,
    selectedNodeId,
    pathNodeIds: effectivePathNodeIds,
    pathFlowIndex,
    pathFlowProgressRef,
  });
  selectionRef.current = {
    highlightedPathNodeIds,
    selectedNodeId,
    pathNodeIds: effectivePathNodeIds,
    pathFlowIndex,
    pathFlowProgressRef,
  };
  const lastGraphDataRef = useRef<{ nodes: unknown[]; links: unknown[] } | null>(null);
  const pendingOverlayAfterFlowRef = useRef(false);
  const deptColorMapRef = useRef(new Map<string, string>());
  deptColorMapRef.current = new Map(departments.map((d) => [d.id, d.color]));

  const pathLabels = effectivePathNodeIds
    .filter((id) => id !== PREDICTION_NODE_ID)
    .map((id) => nodes.find((n) => n.id === id)?.payload?.decision?.title ?? id);

  const handlePromptSubmit = useCallback(
    async (prompt: string) => {
      if (!prompt.trim()) return;
      setPlanError(null);
      setPlanResult(null);
      setPlanLoading(true);
      const payloadNodes = nodes.map((n) => ({
        id: n.id,
        title: n.payload.decision?.title ?? n.id,
        description: n.payload.decision?.description,
        department: departments.find((d) => d.id === n.payload.decision?.departmentId)?.name,
      }));
      const payloadLinks = links.map((l) => ({
        source: typeof l.source === "string" ? l.source : (l.source as { id: string }).id,
        target: typeof l.target === "string" ? l.target : (l.target as { id: string }).id,
      }));
      try {
        const res = await fetch("/api/prediction/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: prompt.trim(),
            nodes: payloadNodes,
            links: payloadLinks,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setPlanError(data?.error ?? "Plan request failed");
          setPlanLoading(false);
          return;
        }
        const result = data as PlanResponse;
        setPlanResult(result);
        // Use existing UI flow: path from API only; virtual white prediction node is shown after path animation
        if (result.pathNodeIds && result.pathNodeIds.length > 0) {
          setPromptPathNodeIds(result.pathNodeIds);
          setShowPredictionNode(false);
          pendingOverlayAfterFlowRef.current = true;
          pathFlowProgressRef.current = 0;
          setPathFlowIndex(0);
        }
      } catch (e) {
        setPlanError(e instanceof Error ? e.message : "Plan request failed");
      } finally {
        setPlanLoading(false);
      }
    },
    [nodes, links, departments]
  );

  const handleOverlayYes = useCallback(() => {
    const path = promptPathNodeIds ?? [];
    const predictedOutput = planResult?.predictedOutput ?? "Prediction";
    if (onAddPredictionNode) {
      const newId = onAddPredictionNode(path, predictedOutput);
      setPromptPathNodeIds([...path, newId]);
    } else {
      setPromptPathNodeIds(null);
    }
    setShowPredictionNode(false);
    setShowOverlay(false);
  }, [promptPathNodeIds, planResult?.predictedOutput, onAddPredictionNode]);

  const handleOverlayNo = useCallback(() => {
    setShowOverlay(false);
    setPromptPathNodeIds(null);
    setShowPredictionNode(false);
  }, []);

  const isRealtimeOverlay = realtimeDecision != null;
  const overlayVisible = showOverlay || isRealtimeOverlay;
  const overlayPathLabels = isRealtimeOverlay
    ? (realtimeDecision?.pathLabels ?? ["Realtime"])
    : pathLabels;
  const overlayPillCount = overlayPathLabels.length;
  const overlayPrompt = isRealtimeOverlay ? realtimeDecision?.prompt ?? "" : planPrompt;
  const overlayConsequences = isRealtimeOverlay ? realtimeDecision?.consequences ?? "" : planResult?.consequences;
  const overlaySolution = isRealtimeOverlay ? realtimeDecision?.solution ?? "" : planResult?.solution;
  const overlayOutcome = isRealtimeOverlay ? realtimeDecision?.outcome ?? "" : planResult?.predictedOutput;

  const handleOverlayYesForRealtime = useCallback(() => {
    onRealtimeDecisionConsumed?.();
    setShowOverlay(false);
  }, [onRealtimeDecisionConsumed]);

  const handleOverlayNoOrCloseForRealtime = useCallback(() => {
    onRealtimeDecisionConsumed?.();
    setShowOverlay(false);
  }, [onRealtimeDecisionConsumed]);

  const PATH_NODE_SIZE = 14;
  const PATH_GLOW_RADIUS = 5;
  const NORMAL_NODE_SIZE = 12;
  const DIM_NODE_SIZE = 8;
  const DIM_COLOR = "#4b5563";
  const CORE_NODE_SIZE = 36;
  const PER_NODE_MS = 800;
  const PREDICTION_LINK_MS = 1200;
  const HOLD_BEFORE_PREDICTION_MS = 1000;
  const HOLD_AFTER_FLOW_MS = 3000;
  const PREDICTION_NODE_EXTEND = TREE_LEVEL_HEIGHT * 1.8;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset panel state when selection is cleared.
  useEffect(() => {
    if (!hasSelection) {
      setPanelExpanded(false);
      setPillVisibleCount(0);
      setPathFlowIndex(0);
      pathFlowProgressRef.current = 0;
    }
  }, [hasSelection]);

  // Prompt flow: phase 1 flow to last info node (0.5s per node), hold, create prediction node, flow link to it (0.5s), hold 3s, expand
  useEffect(() => {
    const path = promptPathNodeIds;
    if (!path || path.length === 0 || !pendingOverlayAfterFlowRef.current) return;
    setPathFlowIndex(0);
    pathFlowProgressRef.current = 0;
    const N = path.length;
    const phase1Duration = N * PER_NODE_MS;
    const start = performance.now();
    let rafId: number;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const tickPhase1 = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(elapsed / phase1Duration, 1);
      const eased = 1 - Math.pow(1 - t, 1.2);
      const progress = eased * N;
      pathFlowProgressRef.current = progress;
      setPathFlowIndex(Math.min(Math.ceil(progress), N));
      if (graphRef.current && lastGraphDataRef.current) {
        const { nodes: nds, links: lnks } = lastGraphDataRef.current;
        graphRef.current.graphData({ nodes: [...nds], links: [...lnks] });
      }
      if (t >= 1) {
        timeoutId = setTimeout(() => {
          setShowPredictionNode(true);
          requestAnimationFrame(() => {
            const phase3Start = performance.now();
            const phase3Duration = PREDICTION_LINK_MS;
            const tickPhase3 = () => {
              const phase3Elapsed = performance.now() - phase3Start;
              const t3 = Math.min(phase3Elapsed / phase3Duration, 1);
              const progress3 = N + t3;
              pathFlowProgressRef.current = progress3;
              setPathFlowIndex(Math.min(Math.ceil(progress3), N + 1));
              if (graphRef.current && lastGraphDataRef.current) {
                const { nodes: nds, links: lnks } = lastGraphDataRef.current;
                graphRef.current.graphData({ nodes: [...nds], links: [...lnks] });
              }
              if (t3 < 1) rafId = requestAnimationFrame(tickPhase3);
              else {
                pendingOverlayAfterFlowRef.current = false;
                timeoutId = setTimeout(() => setShowOverlay(true), HOLD_AFTER_FLOW_MS);
              }
            };
            rafId = requestAnimationFrame(tickPhase3);
          });
        }, HOLD_BEFORE_PREDICTION_MS);
        return;
      }
      rafId = requestAnimationFrame(tickPhase1);
    };
    rafId = requestAnimationFrame(tickPhase1);
    return () => {
      cancelAnimationFrame(rafId);
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, [promptPathNodeIds?.join(",")]);

  // Node-click flow: 0.5s per node, progress 0 to pathNodeIds.length (only when not in prompt flow)
  useEffect(() => {
    if (promptPathNodeIds != null || !hasSelection || pathNodeIds.length === 0) return;
    setPathFlowIndex(0);
    pathFlowProgressRef.current = 0;
    const maxProgress = pathNodeIds.length;
    const duration = maxProgress * PER_NODE_MS;
    const start = performance.now();
    let rafId: number;
    const tick = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 1.2);
      const progress = eased * maxProgress;
      pathFlowProgressRef.current = progress;
      setPathFlowIndex(Math.min(Math.ceil(progress), maxProgress));
      if (graphRef.current && lastGraphDataRef.current) {
        const { nodes: nds, links: lnks } = lastGraphDataRef.current;
        graphRef.current.graphData({ nodes: [...nds], links: [...lnks] });
      }
      if (t < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [hasSelection, selectedNodeId, pathNodeIds.join(",")]);

  // When panel is collapsed, reset animation state so next expand starts fresh.
  useEffect(() => {
    if (!panelExpanded) {
      setPillVisibleCount(0);
    }
  }, [panelExpanded]);

  // Animate path pills when panel is expanded.
  useEffect(() => {
    if (!panelExpanded || !hasSelection || pillVisibleCount >= pathLabels.length) return;
    const t = window.setTimeout(() => setPillVisibleCount((c) => c + 1), 120);
    return () => window.clearTimeout(t);
  }, [panelExpanded, hasSelection, pillVisibleCount, pathLabels.length]);

  useEffect(() => {
    if (!mounted) return;
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      if (el) {
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        if (w > 0 && h > 0) setDimensions({ width: w, height: h });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    const t = window.setTimeout(update, 150);
    return () => {
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const el = containerRef.current;
    if (!el) return;
    // Use container's current size so canvas never exceeds container (avoids scrollWidth > clientWidth cutoff).
    const w = Math.max(1, el.offsetWidth || dimensions.width || 800);
    const h = Math.max(1, el.offsetHeight || dimensions.height || 600);
    let destroyed = false;
    import("force-graph").then((mod) => {
      if (destroyed || !el.parentElement) return;
      interface ForceGraphInstance {
        graphData: (d: { nodes: unknown[]; links: unknown[] }) => ForceGraphInstance;
        nodeId: (id: string) => ForceGraphInstance;
        width: (w: number) => ForceGraphInstance;
        height: (h: number) => ForceGraphInstance;
        backgroundColor: (c: string) => ForceGraphInstance;
        nodeLabel: (fn: (n: unknown) => string) => ForceGraphInstance;
        nodeColor: (fn: (n: unknown) => string) => ForceGraphInstance;
        nodeVal: (fn: (n: unknown) => number) => ForceGraphInstance;
        nodeCanvasObject: (fn: (n: unknown, ctx: CanvasRenderingContext2D, s: number) => void) => ForceGraphInstance;
        linkColor: (fn: (l: unknown) => string) => ForceGraphInstance;
        linkWidth: (fn: (l: unknown) => number) => ForceGraphInstance;
        linkCanvasObjectMode?: (fn: () => string) => ForceGraphInstance;
        linkCanvasObject?: (fn: (l: unknown, ctx: CanvasRenderingContext2D, globalScale: number) => void) => ForceGraphInstance;
        onNodeClick: (fn: (n: unknown) => void) => ForceGraphInstance;
        onEngineStop: (fn: () => void) => ForceGraphInstance;
        zoomToFit: (durationMs?: number, padding?: number) => ForceGraphInstance;
        _destructor: () => void;
      }
      const FG = mod.default as unknown as (() => (el: HTMLElement) => ForceGraphInstance) | ((el: HTMLElement) => ForceGraphInstance);
      const graph: ForceGraphInstance =
        (typeof FG === "function" && (FG as { length?: number }).length === 0)
          ? (FG as () => (el: HTMLElement) => ForceGraphInstance)()(el)
          : (FG as (el: HTMLElement) => ForceGraphInstance)(el);
      graphRef.current = graph;

      const graphData = buildGraphDataWithCoreAndClusters(nodes, links, departments, showCrossDomainLinks);
      const graphNodes = graphData.nodes;
      const graphLinks = graphData.links;
      lastGraphDataRef.current = { nodes: graphNodes, links: graphLinks };

      graph
        .graphData({ nodes: graphNodes, links: graphLinks })
        .nodeId("id")
        .width(w)
        .height(h)
        .backgroundColor("#0f172a")
        .nodeLabel((node: unknown) => ((node as GraphNodeWithPos).id === CORE_NODE_ID ? coreLabel : (node as GraphNodeWithPos).payload?.decision?.title ?? (node as GraphNodeWithPos).id))
        .nodeColor((node: unknown) =>
          (node as GraphNodeWithPos).id === CORE_NODE_ID ? "#f59e0b" : deptColorMapRef.current.get((node as GraphNodeWithPos).payload?.departmentId ?? "") ?? "#6b7280"
        )
        .nodeVal((node: unknown) => {
          const { pathNodeIds: pIds, pathFlowProgressRef: progressRef } = selectionRef.current;
          const progress = progressRef.current;
          const id = (node as GraphNodeWithPos).id;
          const hasSel = pIds.length > 0;
          const pathIdx = id === CORE_NODE_ID ? -1 : id === PREDICTION_NODE_ID ? pIds.length - 1 : pIds.indexOf(id);
          const onPath = hasSel && (id === CORE_NODE_ID ? progress >= 0 : pathIdx >= 0 && progress >= pathIdx + 1);
          if (id === CORE_NODE_ID) return CORE_NODE_SIZE;
          if (id === PREDICTION_NODE_ID) return onPath ? PATH_NODE_SIZE + PATH_GLOW_RADIUS : PATH_NODE_SIZE;
          if (hasSel) return onPath ? PATH_NODE_SIZE + PATH_GLOW_RADIUS : DIM_NODE_SIZE;
          return NORMAL_NODE_SIZE;
        })
        .nodeCanvasObject((node: unknown, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const { pathNodeIds: pIds, pathFlowProgressRef: progressRef } = selectionRef.current;
          const progress = progressRef.current;
          const hasSelection = pIds.length > 0;
          const n = node as GraphNodeWithPos;
          const pathIdx = n.id === CORE_NODE_ID ? -1 : n.id === PREDICTION_NODE_ID ? pIds.length - 1 : pIds.indexOf(n.id);
          const onPath = hasSelection && (n.id === CORE_NODE_ID ? progress >= 0 : pathIdx >= 0 && progress >= pathIdx + 1);
          const x = n.x ?? 0;
          const y = n.y ?? 0;
          const isCore = n.id === CORE_NODE_ID;
          const isPrediction = n.id === PREDICTION_NODE_ID;
          const nodeColor = deptColorMapRef.current.get(n.payload?.departmentId ?? "") ?? "#6b7280";
          if (isPrediction) {
            const pathLen = pIds.length;
            const lastInfoProgress = pathLen - 1;
            const appearStart = lastInfoProgress + 0.5;
            const appearEnd = pathLen;
            const visible = progress >= appearStart;
            const opacity = visible
              ? Math.min(1, (progress - appearStart) / Math.max(0.2, appearEnd - appearStart))
              : 0;
            if (opacity <= 0) return;
            const size = PATH_NODE_SIZE;
            ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.arc(x, y, size + PATH_GLOW_RADIUS, 0, 2 * Math.PI);
            ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x, y, size, 0, 2 * Math.PI);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.font = `bold ${10 / globalScale}px Sans-Serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#1e293b";
            const predLabel = (n.payload?.decision?.title as string) ?? "Prediction";
            ctx.fillText(predLabel, x, y + size + 10 / globalScale);
            ctx.globalAlpha = 1;
            return;
          }
          if (isCore) {
            const size = CORE_NODE_SIZE;
            ctx.beginPath();
            ctx.arc(x, y, size + 8, 0, 2 * Math.PI);
            ctx.fillStyle = "rgba(245, 158, 11, 0.25)";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x, y, size, 0, 2 * Math.PI);
            ctx.fillStyle = "#f59e0b";
            ctx.fill();
            ctx.strokeStyle = "rgba(250, 204, 21, 0.9)";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.font = `bold ${14 / globalScale}px Sans-Serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#fff";
            ctx.fillText(coreLabel, x, y);
            return;
          }
          const label = n.payload?.decision?.title ?? n.id;
          const dimmed = hasSelection && !onPath;
          const size = dimmed ? DIM_NODE_SIZE : onPath ? PATH_NODE_SIZE : NORMAL_NODE_SIZE;
          const color = dimmed ? DIM_COLOR : nodeColor;
          if (onPath) {
            ctx.beginPath();
            ctx.arc(x, y, size + PATH_GLOW_RADIUS, 0, 2 * Math.PI);
            ctx.fillStyle = `${nodeColor}40`;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x, y, size + 4, 0, 2 * Math.PI);
            ctx.fillStyle = `${nodeColor}30`;
            ctx.fill();
          }
          ctx.beginPath();
          ctx.arc(x, y, size, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = onPath ? `${nodeColor}ee` : dimmed ? "rgba(75, 85, 99, 0.5)" : "rgba(0,0,0,0.2)";
          ctx.lineWidth = onPath ? 2.5 : dimmed ? 0.5 : 0.5;
          ctx.stroke();
          const fontSize = (onPath ? 11 : dimmed ? 6 : 8) / globalScale;
          ctx.font = `${onPath ? "bold " : ""}${fontSize}px Sans-Serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = onPath ? "rgba(255,255,255,0.95)" : dimmed ? "rgba(156, 163, 175, 0.9)" : "rgba(255,255,255,0.85)";
          ctx.fillText(label, x, y + size + fontSize);
        })
        .linkColor((link: unknown) => {
          const { pathNodeIds: pIds, pathFlowProgressRef: progressRef } = selectionRef.current;
          const progress = progressRef.current;
          if (pIds.length === 0) return "rgba(100, 100, 100, 0.35)";
          const l = link as { source?: { id: string }; target?: { id: string } };
          const srcId = l.source && typeof l.source === "object" ? l.source.id : "";
          const tgtId = l.target && typeof l.target === "object" ? l.target.id : "";
          const coreToFirst = srcId === CORE_NODE_ID && tgtId === pIds[0];
          const onPathCoreLink = progress >= 0 && coreToFirst;
          let onPathDeptLink = false;
          if (pIds.length >= 2) {
            for (let i = 0; i < pIds.length - 1; i++) {
              if (srcId === pIds[i] && tgtId === pIds[i + 1] && progress >= i + 1) {
                onPathDeptLink = true;
                break;
              }
            }
          }
          const onPath = onPathCoreLink || onPathDeptLink;
          return onPath ? "rgba(200, 200, 200, 0.85)" : "rgba(100, 100, 100, 0.35)";
        })
        .linkWidth((link: unknown) => {
          const { pathNodeIds: pIds, pathFlowProgressRef: progressRef } = selectionRef.current;
          const progress = progressRef.current;
          if (pIds.length === 0) {
            const l = link as { source?: { id: string }; target?: { id: string } };
            const srcId = l.source && typeof l.source === "object" ? l.source.id : "";
            const tgtId = l.target && typeof l.target === "object" ? l.target.id : "";
            return srcId === CORE_NODE_ID || tgtId === CORE_NODE_ID ? 1 : 0.8;
          }
          const l = link as { source?: { id: string }; target?: { id: string } };
          const srcId = l.source && typeof l.source === "object" ? l.source.id : "";
          const tgtId = l.target && typeof l.target === "object" ? l.target.id : "";
          const coreToFirst = srcId === CORE_NODE_ID && tgtId === pIds[0];
          const onPathCoreLink = progress >= 0 && coreToFirst;
          let onPathDeptLink = false;
          if (pIds.length >= 2) {
            for (let i = 0; i < pIds.length - 1; i++) {
              if (srcId === pIds[i] && tgtId === pIds[i + 1] && progress >= i + 1) {
                onPathDeptLink = true;
                break;
              }
            }
          }
          const onPath = onPathCoreLink || onPathDeptLink;
          if (srcId === CORE_NODE_ID || tgtId === CORE_NODE_ID) return onPath ? 2.5 : 1;
          return onPath ? 3 : 0.8;
        });
      if (typeof graph.linkCanvasObjectMode === "function") {
        graph.linkCanvasObjectMode(() => "replace");
      }
      if (typeof graph.linkCanvasObject === "function") {
        graph.linkCanvasObject((link: unknown, ctx: CanvasRenderingContext2D) => {
          const { pathNodeIds: pIds, pathFlowProgressRef: progressRef } = selectionRef.current;
          const progress = progressRef.current;
          const l = link as { source?: { id: string; x?: number; y?: number }; target?: { id: string; x?: number; y?: number } };
          const src = l.source;
          const tgt = l.target;
          if (!src || !tgt) return;
          const sx = src.x ?? 0;
          const sy = src.y ?? 0;
          const tx = tgt.x ?? 0;
          const ty = tgt.y ?? 0;
          const srcId = src.id ?? "";
          const tgtId = tgt.id ?? "";
          let onPath = false;
          let revealFraction = 1;
          if (pIds.length > 0) {
            const coreToFirst = srcId === CORE_NODE_ID && tgtId === pIds[0];
            if (coreToFirst) {
              onPath = true;
              revealFraction = Math.min(Math.max(progress - 0, 0), 1);
            } else {
              for (let i = 0; i < pIds.length - 1; i++) {
                if (srcId === pIds[i] && tgtId === pIds[i + 1]) {
                  onPath = true;
                  revealFraction = Math.min(Math.max(progress - (i + 1), 0), 1);
                  break;
                }
              }
            }
          }
          const endX = sx + (tx - sx) * revealFraction;
          const endY = sy + (ty - sy) * revealFraction;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(endX, endY);
          ctx.strokeStyle = onPath ? "rgba(200, 200, 200, 0.85)" : "rgba(100, 100, 100, 0.35)";
          ctx.lineWidth = onPath ? (srcId === CORE_NODE_ID || tgtId === CORE_NODE_ID ? 2.5 : 3) : (srcId === CORE_NODE_ID || tgtId === CORE_NODE_ID ? 1 : 0.8);
          ctx.stroke();
        });
      }
      graph.onNodeClick((node: unknown) => {
          const n = node as GraphNodeWithPos;
          if (n.id !== CORE_NODE_ID && n.id !== PREDICTION_NODE_ID) onNodeClick(n.id);
        })
        .onEngineStop(() => {
          if (!destroyed && graphRef.current?.zoomToFit) graphRef.current.zoomToFit(400, 120);
        });
    });

    return () => {
      destroyed = true;
      if (graphRef.current) {
        try {
          graphRef.current._destructor();
        } catch (_) {
          // ignore
        }
        graphRef.current = null;
      }
    };
  }, [mounted]); // Create once when mounted; data/size updated in other effects

  useEffect(() => {
    if (!graphRef.current || nodes.length === 0) return;
    const graph = graphRef.current;
    let graphData = buildGraphDataWithCoreAndClusters(nodes, links, departments, showCrossDomainLinks);
    if (showPredictionNode && promptPathNodeIds && promptPathNodeIds.length > 0) {
      const lastId = promptPathNodeIds[promptPathNodeIds.length - 1];
      const lastNode = graphData.nodes.find((n) => (n as GraphNodeWithPos).id === lastId) as GraphNodeWithPos | undefined;
      if (lastNode) {
        const x0 = lastNode.x ?? 0;
        const y0 = lastNode.y ?? 0;
        const excludeIds = new Set([lastId, CORE_NODE_ID, PREDICTION_NODE_ID, ...promptPathNodeIds]);
        const { angle, distance } = findPredictionNodeAngle(
          { x: x0, y: y0 },
          graphData.nodes as { id: string; x?: number; y?: number }[],
          excludeIds,
          TREE_ROOT_RADIUS + TREE_LEVEL_HEIGHT * 4
        );
        const predX = x0 + Math.cos(angle) * distance;
        const predY = y0 + Math.sin(angle) * distance;
        const predictionLabel = planResult?.predictedOutput ?? "Prediction";
        const predictionNode: GraphNodeWithPos = {
          id: PREDICTION_NODE_ID,
          payload: {
            departmentId: "",
            decision: {
              id: PREDICTION_NODE_ID,
              title: predictionLabel,
              departmentId: "",
              version: "",
              status: "",
              created: "",
              category: "",
              size: "",
              description: "",
              evolutionHistory: [],
            },
          },
          x: predX,
          y: predY,
          fx: predX,
          fy: predY,
        };
        const predLink = { source: lastNode, target: predictionNode };
        graphData = {
          nodes: [...graphData.nodes, predictionNode],
          links: [...graphData.links, predLink],
        };
      }
    }
    lastGraphDataRef.current = { nodes: graphData.nodes, links: graphData.links };
    graph.graphData(lastGraphDataRef.current);
    const t = window.setTimeout(() => graph.zoomToFit?.(400, 120), 350);
    return () => window.clearTimeout(t);
  }, [nodes, links, departments, showCrossDomainLinks, showPredictionNode, promptPathNodeIds?.join(","), pathNodeIds?.join(","), planResult?.predictedOutput]);

  useEffect(() => {
    if (!graphRef.current || !lastGraphDataRef.current) return;
    const { nodes: nds, links: lnks } = lastGraphDataRef.current;
    graphRef.current.graphData({ nodes: [...nds], links: [...lnks] });
  }, [highlightedPathNodeIds, selectedNodeId, pathFlowIndex, effectivePathNodeIds]);

  useEffect(() => {
    if (!graphRef.current) return;
    const w = dimensions.width || 800;
    const h = dimensions.height || 600;
    graphRef.current.width(w).height(h);
    const t = window.setTimeout(() => graphRef.current?.zoomToFit?.(0, 120), 80);
    return () => window.clearTimeout(t);
  }, [dimensions.width, dimensions.height]);

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-900">
      {/* Toggle: show/hide cross-domain links (clean tree per domain) */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2 rounded-md border border-slate-600/80 bg-slate-800/95 px-3 py-1.5 shadow-lg">
        <span className="text-sm text-slate-300">Cross-domain links</span>
        <button
          type="button"
          role="switch"
          aria-checked={showCrossDomainLinks}
          onClick={() => setShowCrossDomainLinks((v) => !v)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 ${
            showCrossDomainLinks ? "bg-amber-500" : "bg-slate-600"
          }`}
        >
          <span
            className={`pointer-events-none absolute left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
              showCrossDomainLinks ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Graph: always full size; overlay layers on top without shrinking it */}
      <div
        ref={containerRef}
        className="h-full min-h-0 min-w-0 flex-1 overflow-hidden bg-slate-900"
      >
        {!mounted && (
          <div className="flex h-full items-center justify-center text-zinc-500">
            Loading graph…
          </div>
        )}
      </div>

      {/* Plan panel at bottom: input + Predict; expand to see path + consequences/solution */}
      <PlanModePanel
        pathLabels={pathLabels}
        pillVisibleCount={pillVisibleCount}
        isExpanded={panelExpanded}
        onToggleExpand={() => setPanelExpanded((e) => !e)}
        planPrompt={planPrompt}
        onPlanPromptChange={setPlanPrompt}
        onPromptSubmit={handlePromptSubmit}
        canExpand={hasSelection || planResult != null}
        planResult={planResult}
        planLoading={planLoading}
        planError={planError}
      />

      {/* Full-screen overlay: Consequences / Solution / Outcome then Yes/No modal */}
      {overlayVisible && (
        <PlanModeOverlay
          pathLabels={overlayPathLabels}
          pillVisibleCount={overlayPillCount}
          prompt={overlayPrompt}
          onPromptChange={setPlanPrompt}
          onPromptSubmit={handlePromptSubmit}
          isExpanded={true}
          consequencesText={overlayConsequences}
          solutionText={overlaySolution}
          outcomeText={overlayOutcome}
          predictionLabel={overlayOutcome}
          onYes={isRealtimeOverlay ? handleOverlayYesForRealtime : handleOverlayYes}
          onNo={isRealtimeOverlay ? handleOverlayNoOrCloseForRealtime : handleOverlayNo}
          onClose={isRealtimeOverlay ? handleOverlayNoOrCloseForRealtime : handleOverlayNo}
          autoProceedAfterMs={isRealtimeOverlay ? 1000 : undefined}
        />
      )}
    </div>
  );
}
