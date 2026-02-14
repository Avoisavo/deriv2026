"use client";

import { useState } from "react";
import type { Department, Decision } from "@/types/decision-tree";

export interface LeftSidebarProps {
  departments: Department[];
  decisionsByDept: Map<string, Decision[]>;
  onToggleVisibility: (departmentId: string) => void;
  onRemoveDepartment: (departmentId: string) => void;
  onAddDepartment: () => void;
  onSelectDecision?: (decisionId: string) => void;
}

export function LeftSidebar({
  departments,
  decisionsByDept,
  onToggleVisibility,
  onRemoveDepartment,
  onAddDepartment,
  onSelectDecision,
}: LeftSidebarProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
                <ul className="max-h-48 list-none overflow-y-auto border-t border-zinc-700 px-2 py-1">
                  {decisions.map((d) => (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => onSelectDecision?.(d.id)}
                        className="w-full truncate rounded px-2 py-1 text-left text-xs text-zinc-300 hover:bg-zinc-700"
                      >
                        {d.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      <div className="border-t border-zinc-700 p-2">
        <button
          type="button"
          onClick={onAddDepartment}
          className="w-full rounded-lg border border-dashed border-zinc-600 py-2 text-sm text-zinc-400 hover:border-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
        >
          + Add department
        </button>
      </div>
    </aside>
  );
}
