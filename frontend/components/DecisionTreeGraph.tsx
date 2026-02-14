"use client";

import { useRef, useEffect, useState } from "react";
import type { Department, GraphNode, GraphLink } from "@/types/decision-tree";
import { PlanModePanel } from "@/components/PlanModePanel";

const CORE_NODE_ID = "__core__";
const CORE_LABEL = "CORE";
const TREE_ROOT_RADIUS = 140;
const TREE_LEVEL_HEIGHT = 48;
const TREE_ANGLE_SPREAD = 0.65;

export interface DecisionTreeGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  departments: Department[];
  highlightedPathNodeIds: Set<string>;
  selectedNodeId: string | null;
  /** Ordered path node ids (root → selected) for plan mode. */
  pathNodeIds?: string[];
  onNodeClick: (nodeId: string) => void;
  /** Central core label (e.g. company name). Default "CORE". */
  coreLabel?: string;
  /** Optional URL for company logo image to show in the core node. */
  coreLogoUrl?: string;
}

type GraphNodeWithPos = GraphNode & { x?: number; y?: number; fx?: number; fy?: number };

function buildGraphDataWithCoreAndClusters(
  nodes: GraphNode[],
  links: GraphLink[],
  departments: Department[]
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

    const levels: string[][] = [];
    const visited = new Set<string>([rootId]);
    let currentLevel = [rootId];
    while (currentLevel.length > 0) {
      levels.push([...currentLevel]);
      const nextLevel: string[] = [];
      currentLevel.forEach((id) => {
        (childrenByNode.get(id) ?? []).forEach((c) => {
          if (!visited.has(c)) {
            visited.add(c);
            nextLevel.push(c);
          }
        });
      });
      currentLevel = nextLevel;
    }

    levels.forEach((levelNodeIds, levelIndex) => {
      const radius = TREE_ROOT_RADIUS + levelIndex * TREE_LEVEL_HEIGHT;
      const n = levelNodeIds.length;
      levelNodeIds.forEach((nodeId, i) => {
        const angle = n <= 1 ? baseAngle : baseAngle - spread / 2 + (spread * (i + 0.5)) / n;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        positionByNodeId.set(nodeId, { x, y });
      });
    });
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

  const existingLinks = links
    .map((l) => {
      const src = decisionNodesWithPos.find((nd) => nd.id === (typeof l.source === "string" ? l.source : (l.source as { id: string }).id));
      const tgt = decisionNodesWithPos.find((nd) => nd.id === (typeof l.target === "string" ? l.target : (l.target as { id: string }).id));
      if (!src || !tgt) return null;
      return { source: src, target: tgt };
    })
    .filter((l): l is { source: GraphNodeWithPos; target: GraphNodeWithPos } => l !== null);

  return {
    nodes: [coreNode, ...decisionNodesWithPos],
    links: [...coreLinks, ...existingLinks],
  };
}

export function DecisionTreeGraph({
  nodes,
  links,
  departments,
  highlightedPathNodeIds,
  selectedNodeId,
  pathNodeIds = [],
  onNodeClick,
  coreLabel = CORE_LABEL,
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
  const hasSelection = Boolean(selectedNodeId && pathNodeIds.length > 0);
  const selectionRef = useRef({ highlightedPathNodeIds, selectedNodeId });
  selectionRef.current = { highlightedPathNodeIds, selectedNodeId };
  const lastGraphDataRef = useRef<{ nodes: unknown[]; links: unknown[] } | null>(null);

  const pathLabels = pathNodeIds.map(
    (id) => nodes.find((n) => n.id === id)?.payload?.decision?.title ?? id
  );

  const deptColorMap = new Map(departments.map((d) => [d.id, d.color]));
  const PATH_NODE_SIZE = 14;
  const PATH_GLOW_RADIUS = 8;
  const NORMAL_NODE_SIZE = 6;
  const DIM_NODE_SIZE = 4;
  const DIM_COLOR = "#4b5563";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset panel state when selection is cleared.
  useEffect(() => {
    if (!hasSelection) {
      setPanelExpanded(false);
      setPillVisibleCount(0);
    }
  }, [hasSelection]);

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

      const graphData = buildGraphDataWithCoreAndClusters(nodes, links, departments);
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
          (node as GraphNodeWithPos).id === CORE_NODE_ID ? "#f59e0b" : deptColorMap.get((node as GraphNodeWithPos).payload?.departmentId ?? "") ?? "#6b7280"
        )
        .nodeVal((node: unknown) => {
          const { highlightedPathNodeIds: pathSet, selectedNodeId: selId } = selectionRef.current;
          const id = (node as GraphNodeWithPos).id;
          const onPath = id === CORE_NODE_ID || pathSet.has(id) || id === selId;
          const hasSel = pathSet.size > 0 || selId !== null;
          if (id === CORE_NODE_ID) return 28;
          if (hasSel) return onPath ? PATH_NODE_SIZE + PATH_GLOW_RADIUS : DIM_NODE_SIZE;
          return NORMAL_NODE_SIZE;
        })
        .nodeCanvasObject((node: unknown, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const { highlightedPathNodeIds: pathSet, selectedNodeId: selId } = selectionRef.current;
          const hasSelection = pathSet.size > 0 || selId !== null;
          const isOnPath = (id: string) => pathSet.has(id) || id === selId;
          const n = node as GraphNodeWithPos;
          const x = n.x ?? 0;
          const y = n.y ?? 0;
          const isCore = n.id === CORE_NODE_ID;
          if (isCore) {
            const size = 28;
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
          const onPath = isOnPath(n.id);
          const dimmed = hasSelection && !onPath;
          const size = dimmed ? DIM_NODE_SIZE : onPath ? PATH_NODE_SIZE : NORMAL_NODE_SIZE;
          const color = dimmed ? DIM_COLOR : (deptColorMap.get(n.payload?.departmentId ?? "") ?? "#6b7280");
          if (onPath) {
            ctx.beginPath();
            ctx.arc(x, y, size + PATH_GLOW_RADIUS, 0, 2 * Math.PI);
            ctx.fillStyle = "rgba(250, 204, 21, 0.4)";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x, y, size + 4, 0, 2 * Math.PI);
            ctx.fillStyle = "rgba(250, 204, 21, 0.25)";
            ctx.fill();
          }
          ctx.beginPath();
          ctx.arc(x, y, size, 0, 2 * Math.PI);
          ctx.fillStyle = onPath ? "rgba(250, 204, 21, 0.95)" : color;
          ctx.fill();
          ctx.strokeStyle = onPath ? "rgba(250, 204, 21, 1)" : dimmed ? "rgba(75, 85, 99, 0.5)" : "rgba(0,0,0,0.2)";
          ctx.lineWidth = onPath ? 2.5 : dimmed ? 0.5 : 0.5;
          ctx.stroke();
          const fontSize = (onPath ? 11 : dimmed ? 6 : 8) / globalScale;
          ctx.font = `${onPath ? "bold " : ""}${fontSize}px Sans-Serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = onPath ? "#fef08a" : dimmed ? "rgba(156, 163, 175, 0.9)" : "rgba(255,255,255,0.85)";
          ctx.fillText(label, x, y + size + fontSize);
        })
        .linkColor((link: unknown) => {
          const { highlightedPathNodeIds: pathSet, selectedNodeId: selId } = selectionRef.current;
          const isOnPath = (id: string) => pathSet.has(id) || id === selId;
          const l = link as { source?: { id: string }; target?: { id: string } };
          const srcId = l.source && typeof l.source === "object" ? l.source.id : "";
          const tgtId = l.target && typeof l.target === "object" ? l.target.id : "";
          const hasSel = pathSet.size > 0 || selId !== null;
          const onPath = hasSel && (isOnPath(srcId) && isOnPath(tgtId) || (srcId === CORE_NODE_ID && isOnPath(tgtId)) || (tgtId === CORE_NODE_ID && isOnPath(srcId)));
          return onPath ? "rgba(250, 204, 21, 0.9)" : "rgba(100, 100, 100, 0.35)";
        })
        .linkWidth((link: unknown) => {
          const { highlightedPathNodeIds: pathSet, selectedNodeId: selId } = selectionRef.current;
          const isOnPath = (id: string) => pathSet.has(id) || id === selId;
          const l = link as { source?: { id: string }; target?: { id: string } };
          const srcId = l.source && typeof l.source === "object" ? l.source.id : "";
          const tgtId = l.target && typeof l.target === "object" ? l.target.id : "";
          const hasSel = pathSet.size > 0 || selId !== null;
          if (srcId === CORE_NODE_ID || tgtId === CORE_NODE_ID) return hasSel && (isOnPath(srcId) || isOnPath(tgtId)) ? 2.5 : 1;
          return hasSel && isOnPath(srcId) && isOnPath(tgtId) ? 3 : 0.8;
        })
        .onNodeClick((node: unknown) => {
          const n = node as GraphNodeWithPos;
          if (n.id !== CORE_NODE_ID) onNodeClick(n.id);
        })
        .onEngineStop(() => {
          if (!destroyed && graphRef.current?.zoomToFit) graphRef.current.zoomToFit(300, 60);
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
    const graphData = buildGraphDataWithCoreAndClusters(nodes, links, departments);
    lastGraphDataRef.current = { nodes: graphData.nodes, links: graphData.links };
    graph.graphData(lastGraphDataRef.current);
  }, [nodes, links, departments]);

  useEffect(() => {
    if (!graphRef.current || !lastGraphDataRef.current) return;
    graphRef.current.graphData(lastGraphDataRef.current);
  }, [highlightedPathNodeIds, selectedNodeId]);

  useEffect(() => {
    if (!graphRef.current) return;
    const w = dimensions.width || 800;
    const h = dimensions.height || 600;
    graphRef.current.width(w).height(h);
    const t = window.setTimeout(() => graphRef.current?.zoomToFit?.(0, 60), 50);
    return () => window.clearTimeout(t);
  }, [dimensions.width, dimensions.height]);

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-900">
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

      {/* Expandable plan overlay at bottom: layered on top of graph, 60% height when expanded */}
      {hasSelection && (
        <PlanModePanel
          pathLabels={pathLabels}
          pillVisibleCount={pillVisibleCount}
          isExpanded={panelExpanded}
          onToggleExpand={() => setPanelExpanded((e) => !e)}
        />
      )}
    </div>
  );
}
