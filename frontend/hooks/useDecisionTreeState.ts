"use client";

import { useState, useCallback } from "react";
import type { Department, GraphNode, GraphLink } from "@/types/decision-tree";
import { getRandomPathFromNode } from "@/lib/mockDecisionTree";

export interface UseDecisionTreeStateOptions {
  initialDepartments: Department[];
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface UseDecisionTreeStateReturn {
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  selectedNodeId: string | null;
  highlightedPathNodeIds: Set<string>;
  /** Ordered path node ids (root → selected) for plan mode. */
  pathNodeIds: string[];
  handleNodeClick: (nodeId: string) => void;
  handleToggleVisibility: (departmentId: string) => void;
  handleRemoveDepartment: (departmentId: string) => void;
  handleAddDepartment: () => void;
  visibleNodes: GraphNode[];
  visibleLinks: GraphLink[];
}

const DEFAULT_COLORS = [
  "#22c55e",
  "#f97316",
  "#3b82f6",
  "#ef4444",
  "#eab308",
  "#a855f7",
  "#06b6d4",
  "#6b7280",
];
const DEFAULT_NAMES = [
  "Research",
  "Automation",
  "Operations",
  "Strategy",
  "Product",
  "Engineering",
  "Design",
  "Support",
];

export function useDecisionTreeState({
  initialDepartments,
  nodes,
  links,
}: UseDecisionTreeStateOptions): UseDecisionTreeStateReturn {
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightedPathNodeIds, setHighlightedPathNodeIds] = useState<Set<string>>(new Set());
  const [pathNodeIds, setPathNodeIds] = useState<string[]>([]);

  const visibleDeptIds = new Set(
    departments.filter((d) => d.visible).map((d) => d.id)
  );
  const visibleNodes = nodes.filter((n) => visibleDeptIds.has(n.payload.departmentId));
  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
  const visibleLinks = links.filter(
    (l) => {
      const src = typeof l.source === "string" ? l.source : (l.source as { id: string }).id;
      const tgt = typeof l.target === "string" ? l.target : (l.target as { id: string }).id;
      return visibleNodeIds.has(src) && visibleNodeIds.has(tgt);
    }
  );

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setSelectedNodeId(nodeId);
      const path = getRandomPathFromNode(nodeId, nodes, links);
      setHighlightedPathNodeIds(new Set(path));
      setPathNodeIds(path);
    },
    [nodes, links]
  );

  const handleToggleVisibility = useCallback((departmentId: string) => {
    setDepartments((prev) =>
      prev.map((d) =>
        d.id === departmentId ? { ...d, visible: !d.visible } : d
      )
    );
  }, []);

  const handleRemoveDepartment = useCallback((departmentId: string) => {
    setDepartments((prev) => prev.filter((d) => d.id !== departmentId));
    setSelectedNodeId((id) => {
      const node = nodes.find((n) => n.id === id);
      if (node?.payload.departmentId === departmentId) return null;
      return id;
    });
  }, [nodes]);

  const handleAddDepartment = useCallback(() => {
    const used = new Set(departments.map((d) => d.id));
    let idx = 0;
    while (used.has(`dept-new-${idx}`)) idx++;
    const id = `dept-new-${idx}`;
    const colorIdx = departments.length % DEFAULT_COLORS.length;
    const nameIdx = departments.length % DEFAULT_NAMES.length;
    setDepartments((prev) => [
      ...prev,
      {
        id,
        name: `${DEFAULT_NAMES[nameIdx]} (new)`,
        color: DEFAULT_COLORS[colorIdx],
        visible: true,
        decisionIds: [],
      },
    ]);
  }, [departments.length]);

  return {
    departments,
    setDepartments,
    selectedNodeId,
    highlightedPathNodeIds,
    pathNodeIds,
    handleNodeClick,
    handleToggleVisibility,
    handleRemoveDepartment,
    handleAddDepartment,
    visibleNodes,
    visibleLinks,
  };
}
