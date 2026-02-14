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
  onSimulationClick?: () => void;
}

export function LeftSidebar({
  departments,
  decisionsByDept,
  onToggleVisibility,
  onRemoveDepartment,
  onAddDepartment,
  onSelectDecision,
  onSimulationClick,
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

        <button
          type="button"
          onClick={onSimulationClick}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-amber-900/30 bg-amber-950/20 py-2 text-sm font-medium text-amber-500 transition-colors hover:border-amber-700/50 hover:bg-amber-900/30 hover:text-amber-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          Simulation
        </button>
      </div>
    </aside>
  );
}
