"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  Department,
  Decision,
  GraphNode,
  GraphLink,
  DecisionTreeData,
} from "@/types/decision-tree";
import type { AnalyzeEventsResponse } from "@/types/prediction";
import { getPathFromRootToNode } from "@/lib/mockDecisionTree";

const PREDICTION_TREE_STORAGE_KEY = "prediction-tree-data";

function loadTreeFromStorage(fallback: DecisionTreeData): DecisionTreeData {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(PREDICTION_TREE_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as DecisionTreeData).departments) &&
      Array.isArray((parsed as DecisionTreeData).decisions) &&
      Array.isArray((parsed as DecisionTreeData).nodes) &&
      Array.isArray((parsed as DecisionTreeData).links)
    ) {
      const data = parsed as DecisionTreeData;
      return {
        departments: data.departments,
        decisions: data.decisions,
        nodes: data.nodes,
        links: data.links,
      };
    }
  } catch {
    // ignore invalid or old data
  }
  return fallback;
}

function saveTreeToStorage(data: DecisionTreeData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      PREDICTION_TREE_STORAGE_KEY,
      JSON.stringify({
        departments: data.departments,
        decisions: data.decisions,
        nodes: data.nodes,
        links: data.links,
      })
    );
  } catch {
    // ignore quota or other errors
  }
}

const DEFAULT_COLORS = [
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

export interface UsePredictionTreeStateReturn {
  departments: Department[];
  nodes: GraphNode[];
  links: GraphLink[];
  decisions: Decision[];
  selectedNodeId: string | null;
  highlightedPathNodeIds: Set<string>;
  pathNodeIds: string[];
  handleNodeClick: (nodeId: string) => void;
  handleToggleVisibility: (departmentId: string) => void;
  handleRemoveDepartment: (departmentId: string) => void;
  handleAddDepartment: () => void;
  handleAddDepartmentFromAnalysis: (result: AnalyzeEventsResponse) => void;
  /** Create a new prediction node after the last node of the chosen path; returns the new node id. Used when user clicks Proceed in overlay. */
  handleAddPredictionNode: (pathNodeIds: string[], predictedOutput: string) => string;
  visibleNodes: GraphNode[];
  visibleLinks: GraphLink[];
}

export interface UsePredictionTreeStateOptions {
  /** When true, do not restore from localStorage (e.g. when initialData is from prediction-nodes.txt). */
  skipRestoreFromStorage?: boolean;
}

export function usePredictionTreeState(
  initialData: DecisionTreeData,
  options?: UsePredictionTreeStateOptions
): UsePredictionTreeStateReturn {
  const { skipRestoreFromStorage = false } = options ?? {};
  const [departments, setDepartments] = useState<Department[]>(
    initialData.departments
  );
  const [nodes, setNodes] = useState<GraphNode[]>(initialData.nodes);
  const [links, setLinks] = useState<GraphLink[]>(initialData.links);
  const [decisions, setDecisions] = useState<Decision[]>(initialData.decisions);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightedPathNodeIds, setHighlightedPathNodeIds] = useState<
    Set<string>
  >(new Set());
  const [pathNodeIds, setPathNodeIds] = useState<string[]>([]);
  const hasLoadedFromStorage = useRef(false);
  const skipNextSave = useRef(true);

  // Restore tree from localStorage after mount (unless we have file data and want to show it)
  useEffect(() => {
    if (skipRestoreFromStorage) {
      hasLoadedFromStorage.current = true;
      return;
    }
    const saved = loadTreeFromStorage(initialData);
    setDepartments(saved.departments);
    setDecisions(saved.decisions);
    setNodes(saved.nodes);
    setLinks(saved.links);
    hasLoadedFromStorage.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount

  // Persist tree whenever it changes (skip first run to avoid overwriting with initialData)
  useEffect(() => {
    if (!hasLoadedFromStorage.current) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    saveTreeToStorage({ departments, decisions, nodes, links });
  }, [departments, decisions, nodes, links]);

  const visibleDeptIds = new Set(
    departments.filter((d) => d.visible).map((d) => d.id)
  );
  const visibleNodes = nodes.filter((n) =>
    visibleDeptIds.has(n.payload.departmentId)
  );
  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
  const visibleLinks = links.filter((l) => {
    const src =
      typeof l.source === "string" ? l.source : (l.source as { id: string }).id;
    const tgt =
      typeof l.target === "string" ? l.target : (l.target as { id: string }).id;
    return visibleNodeIds.has(src) && visibleNodeIds.has(tgt);
  });

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setSelectedNodeId(nodeId);
      const path = getPathFromRootToNode(nodeId, nodes, links);
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
    setDecisions((prev) => prev.filter((d) => d.departmentId !== departmentId));
    setNodes((prev) =>
      prev.filter((n) => n.payload.departmentId !== departmentId)
    );
    setLinks((prev) => {
      const removeIds = new Set(
        nodes
          .filter((n) => n.payload.departmentId === departmentId)
          .map((n) => n.id)
      );
      return prev.filter((l) => {
        const src =
          typeof l.source === "string"
            ? l.source
            : (l.source as { id: string }).id;
        const tgt =
          typeof l.target === "string"
            ? l.target
            : (l.target as { id: string }).id;
        return !removeIds.has(src) && !removeIds.has(tgt);
      });
    });
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
    setDepartments((prev) => [
      ...prev,
      {
        id,
        name: "New department",
        color: DEFAULT_COLORS[colorIdx],
        visible: true,
        decisionIds: [],
      },
    ]);
  }, [departments.length]);

  const handleAddDepartmentFromAnalysis = useCallback(
    (result: AnalyzeEventsResponse) => {
      const ts = Date.now();
      const deptId = `dept-${ts}`;
      const colorIdx = departments.length % DEFAULT_COLORS.length;
      const newNodeIds: string[] = [];
      const newDecisions: Decision[] = [];
      const newNodes: GraphNode[] = [];
      const decisionIds: string[] = [];

      result.nodes.forEach((n, i) => {
        const decId = `dec-${ts}-${i}`;
        newNodeIds.push(decId);
        decisionIds.push(decId);
        const decision: Decision = {
          id: decId,
          title: n.title,
          departmentId: deptId,
          version: "v1.0",
          status: "ACTIVE",
          created: new Date().toISOString().slice(0, 10),
          category: "Prediction",
          size: "—",
          description: n.description ?? n.title,
          briefDescription: n.consequence ?? n.briefDescription ?? n.title,
          mitigationPlan: n.solution ?? result.solution,
          evolutionHistory: [],
        };
        newDecisions.push(decision);
        newNodes.push({
          id: decId,
          payload: { decision, departmentId: deptId },
        });
      });

      const newLinks: GraphLink[] = result.links.map((l) => ({
        source: newNodeIds[l.sourceIndex],
        target: newNodeIds[l.targetIndex],
      }));

      const newDept: Department = {
        id: deptId,
        name: result.departmentName,
        color: DEFAULT_COLORS[colorIdx],
        visible: true,
        decisionIds,
      };

      setDepartments((prev) => [...prev, newDept]);
      setDecisions((prev) => [...prev, ...newDecisions]);
      setNodes((prev) => [...prev, ...newNodes]);
      setLinks((prev) => [...prev, ...newLinks]);
    },
    [departments.length]
  );

  const handleAddPredictionNode = useCallback(
    (pathNodeIds: string[], predictedOutput: string): string => {
      if (pathNodeIds.length === 0) {
        const ts = Date.now();
        const fallbackId = `dec-pred-${ts}`;
        const deptId = departments[0]?.id ?? `dept-${ts}`;
        const decision: Decision = {
          id: fallbackId,
          title: predictedOutput,
          departmentId: deptId,
          version: "v1.0",
          status: "ACTIVE",
          created: new Date().toISOString().slice(0, 10),
          category: "Prediction",
          size: "—",
          description: predictedOutput,
          briefDescription: predictedOutput,
          evolutionHistory: [],
        };
        const newNode: GraphNode = {
          id: fallbackId,
          payload: { decision, departmentId: deptId },
        };
        setDecisions((prev) => [...prev, decision]);
        setNodes((prev) => [...prev, newNode]);
        setDepartments((prev) =>
          prev.map((d) =>
            d.id === deptId
              ? { ...d, decisionIds: [...d.decisionIds, fallbackId] }
              : d
          )
        );
        return fallbackId;
      }

      const lastNodeId = pathNodeIds[pathNodeIds.length - 1];
      const lastNode = nodes.find((n) => n.id === lastNodeId);
      const departmentId = lastNode?.payload.departmentId ?? departments[0]?.id;
      if (!departmentId) return lastNodeId;

      const ts = Date.now();
      const newId = `dec-pred-${ts}`;
      const decision: Decision = {
        id: newId,
        title: predictedOutput,
        departmentId,
        version: "v1.0",
        status: "ACTIVE",
        created: new Date().toISOString().slice(0, 10),
        category: "Prediction",
        size: "—",
        description: predictedOutput,
        briefDescription: predictedOutput,
        evolutionHistory: [],
      };
      const newNode: GraphNode = {
        id: newId,
        payload: { decision, departmentId },
      };
      const newLink: GraphLink = { source: lastNodeId, target: newId };

      setDecisions((prev) => [...prev, decision]);
      setNodes((prev) => [...prev, newNode]);
      setLinks((prev) => [...prev, newLink]);
      setDepartments((prev) =>
        prev.map((d) =>
          d.id === departmentId
            ? { ...d, decisionIds: [...d.decisionIds, newId] }
            : d
        )
      );
      return newId;
    },
    [nodes, departments]
  );

  return {
    departments,
    nodes,
    links,
    decisions,
    selectedNodeId,
    highlightedPathNodeIds,
    pathNodeIds,
    handleNodeClick,
    handleToggleVisibility,
    handleRemoveDepartment,
    handleAddDepartment,
    handleAddDepartmentFromAnalysis,
    handleAddPredictionNode,
    visibleNodes,
    visibleLinks,
  };
}
