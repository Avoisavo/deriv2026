"use client";

import { useState, useMemo } from "react";
import type { Department, Decision, GraphLink } from "@/types/decision-tree";
import type { AnalyzeEventsResponse } from "@/types/prediction";

export interface LeftSidebarProps {
  departments: Department[];
  decisionsByDept: Map<string, Decision[]>;
  /** Links used to build tree structure per department. */
  links?: GraphLink[];
  onToggleVisibility: (departmentId: string) => void;
  onRemoveDepartment: (departmentId: string) => void;
  onAddDepartment: () => void;
  /** When provided, "Add department" opens a modal to paste JSON events; API analyzes and adds department + nodes + links. */
  onAddDepartmentFromAnalysis?: (result: AnalyzeEventsResponse) => void;
  onSelectDecision?: (decisionId: string) => void;
}

/** Tree node: decision + children in link order. */
interface TreeEntry {
  decision: Decision;
  children: TreeEntry[];
}

function buildDeptTree(decisions: Decision[], links: GraphLink[], _deptId: string): TreeEntry[] {
  const ids = new Set(decisions.map((d) => d.id));
  const decisionById = new Map(decisions.map((d) => [d.id, d]));
  const sameDeptLinks = links.filter((l) => {
    const src = typeof l.source === "string" ? l.source : (l.source as { id: string }).id;
    const tgt = typeof l.target === "string" ? l.target : (l.target as { id: string }).id;
    return ids.has(src) && ids.has(tgt);
  });
  const childrenByParent = new Map<string, string[]>();
  const targets = new Set<string>();
  sameDeptLinks.forEach((l) => {
    const src = typeof l.source === "string" ? l.source : (l.source as { id: string }).id;
    const tgt = typeof l.target === "string" ? l.target : (l.target as { id: string }).id;
    targets.add(tgt);
    if (!childrenByParent.has(src)) childrenByParent.set(src, []);
    childrenByParent.get(src)!.push(tgt);
  });
  const roots = decisions.filter((d) => !targets.has(d.id)).map((d) => d.id);
  if (roots.length === 0 && decisions.length > 0) roots.push(decisions[0].id);

  function toEntry(id: string): TreeEntry {
    const decision = decisionById.get(id)!;
    const childIds = childrenByParent.get(id) ?? [];
    return {
      decision,
      children: childIds.map(toEntry).filter(Boolean),
    };
  }

  return roots.map(toEntry).filter((e) => e.decision);
}

const TREE_INDENT = 16;

function TreeNodes({
  entry,
  depth,
  deptColor,
  isLastSibling,
  onSelectDecision,
}: {
  entry: TreeEntry;
  depth: number;
  deptColor: string;
  isLastSibling: boolean;
  onSelectDecision?: (id: string) => void;
}) {
  const hasChildren = entry.children.length > 0;
  return (
    <li className="flex flex-col">
      <div
        className="flex items-center gap-2 py-1 pr-1"
        style={{
          paddingLeft: 8 + depth * TREE_INDENT,
          borderLeft: depth > 0 ? `2px solid ${deptColor}` : undefined,
          marginLeft: depth > 0 ? 4 : 0,
        }}
      >
        <span
          className="h-2 w-2 shrink-0 rounded-full border border-zinc-600"
          style={{ backgroundColor: deptColor }}
          aria-hidden
        />
        <button
          type="button"
          onClick={() => onSelectDecision?.(entry.decision.id)}
          className="min-w-0 flex-1 truncate rounded py-0.5 text-left text-xs text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
        >
          {entry.decision.title}
        </button>
      </div>
      {hasChildren && (
        <ul className="list-none">
          {entry.children.map((child, i) => (
            <TreeNodes
              key={child.decision.id}
              entry={child}
              depth={depth + 1}
              deptColor={deptColor}
              isLastSibling={i === entry.children.length - 1}
              onSelectDecision={onSelectDecision}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function LeftSidebar({
  departments,
  decisionsByDept,
  links = [],
  onToggleVisibility,
  onRemoveDepartment,
  onAddDepartment,
  onAddDepartmentFromAnalysis,
  onSelectDecision,
}: LeftSidebarProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [eventsJson, setEventsJson] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const treeByDept = useMemo(() => {
    const map = new Map<string, TreeEntry[]>();
    departments.forEach((dept) => {
      const decisions = decisionsByDept.get(dept.id) ?? [];
      map.set(dept.id, buildDeptTree(decisions, links, dept.id));
    });
    return map;
  }, [departments, decisionsByDept, links]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddDepartmentClick = () => {
    if (onAddDepartmentFromAnalysis) {
      setModalOpen(true);
      setEventsJson("");
      setError(null);
    } else {
      onAddDepartment();
    }
  };

  const handleSubmitEvents = async () => {
    if (!onAddDepartmentFromAnalysis) return;
    setError(null);
    const raw = eventsJson.trim();
    if (!raw) {
      setError("Paste JSON events first.");
      return;
    }
    try {
      JSON.parse(raw);
    } catch {
      setError("Invalid JSON.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/prediction/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: raw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Analysis failed");
        return;
      }
      onAddDepartmentFromAnalysis(data as AnalyzeEventsResponse);
      setModalOpen(false);
      setEventsJson("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-zinc-700 bg-zinc-900 text-zinc-200">
      <div className="border-b border-zinc-700 p-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Knowledge branches
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {departments.map((dept) => {
          const decisions = decisionsByDept.get(dept.id) ?? [];
          const isExpanded = expandedIds.has(dept.id);
          return (
            <div
              key={dept.id}
              className="mb-2 rounded-lg border border-zinc-700 bg-zinc-800/50"
            >
              <div className="flex items-center gap-2 p-2">
                <button
                  type="button"
                  onClick={() => toggleExpand(dept.id)}
                  className="text-zinc-400 hover:text-zinc-200"
                  aria-label={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? "▼" : "▶"}
                </button>
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: dept.color }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {dept.name} ({decisions.length})
                </span>
                <button
                  type="button"
                  onClick={() => onToggleVisibility(dept.id)}
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                  title={dept.visible ? "Hide in graph" : "Show in graph"}
                  aria-label={dept.visible ? "Hide" : "Show"}
                >
                  {dept.visible ? "👁" : "👁‍🗨"}
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveDepartment(dept.id)}
                  className="rounded p-1 text-zinc-400 hover:bg-red-900/50 hover:text-red-300"
                  title="Remove department"
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
              {isExpanded && (
                <ul className="max-h-48 list-none overflow-y-auto border-t border-zinc-700 py-1.5 pl-1 pr-2">
                  {treeByDept.get(dept.id)?.map((entry, idx, arr) => (
                    <TreeNodes
                      key={entry.decision.id}
                      entry={entry}
                      depth={0}
                      deptColor={dept.color}
                      isLastSibling={idx === arr.length - 1}
                      onSelectDecision={onSelectDecision}
                    />
                  ))}
                  {(!treeByDept.get(dept.id)?.length) && (
                    <li className="py-1 pl-3 text-xs text-zinc-500">No nodes</li>
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      <div className="border-t border-zinc-700 p-2">
        <button
          type="button"
          onClick={handleAddDepartmentClick}
          className="w-full rounded-lg border border-dashed border-zinc-600 py-2 text-sm text-zinc-400 hover:border-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
        >
          + Add department
        </button>
      </div>

      {/* Modal: Add department from JSON events */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !loading && setModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-zinc-600 bg-zinc-900 p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-sm font-semibold text-zinc-200">
              Add department from events (JSON)
            </h3>
            <p className="mb-3 text-xs text-zinc-500">
              Paste a JSON array of events. The model will analyze them, generate
              consequences, solution, predicted outcome, and linkage.
            </p>
            <textarea
              value={eventsJson}
              onChange={(e) => setEventsJson(e.target.value)}
              placeholder='e.g. [{"event": "Price increase", "impact": "Demand drop"}, {"event": "Supplier delay", "impact": "Stock shortage"}]'
              className="mb-3 w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              rows={6}
              disabled={loading}
            />
            {error && (
              <p className="mb-2 text-xs text-red-400" role="alert">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !loading && setModalOpen(false)}
                className="rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitEvents}
                disabled={loading}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
              >
                {loading ? "Analyzing…" : "Analyze & add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
