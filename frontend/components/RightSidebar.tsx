"use client";

import { useState } from "react";
import type { Decision } from "@/types/decision-tree";

export interface RightSidebarProps {
  /** Path decisions (one per lit-up node), in order. Number of entries = number of nodes lit. */
  pathDecisions: Decision[];
}

export function RightSidebar({ pathDecisions }: RightSidebarProps) {
  if (pathDecisions.length === 0) {
    return (
      <aside className="flex h-full w-80 flex-col border-l border-zinc-700 bg-zinc-900 text-zinc-400">
        <div className="border-b border-zinc-700 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Affected nodes
          </h2>
        </div>
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm">
          Select a decision to see the path and affected nodes.
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-80 flex-col border-l border-zinc-700 bg-zinc-900 text-zinc-200">
      <div className="border-b border-zinc-700 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Affected nodes ({pathDecisions.length})
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {pathDecisions.map((decision, index) => (
            <PathNodeCard key={decision.id} decision={decision} index={index} />
          ))}
        </div>
      </div>
    </aside>
  );
}

function PathNodeCard({
  decision,
  index,
}: {
  decision: Decision;
  index: number;
}) {
  const [affectedCodeExpanded, setAffectedCodeExpanded] = useState(false);
  const { title, briefDescription, affectedCodeDescription } = decision;

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3">
      <div className="flex items-start gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/30 text-xs font-medium text-amber-200">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white">{title}</h3>
          {briefDescription && (
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">
              {briefDescription}
            </p>
          )}
          {affectedCodeDescription && (
            <div className="mt-2 rounded border border-zinc-700 bg-zinc-900/50">
              <button
                type="button"
                onClick={() => setAffectedCodeExpanded((e) => !e)}
                className="flex w-full items-center justify-between gap-2 p-2 text-left text-xs font-medium text-zinc-400 hover:bg-zinc-800/80"
              >
                <span>What is affected in the code</span>
                <span
                  className={`shrink-0 text-[10px] transition-transform ${affectedCodeExpanded ? "rotate-180" : ""}`}
                >
                  ▼
                </span>
              </button>
              {affectedCodeExpanded && (
                <pre className="max-h-48 overflow-auto border-t border-zinc-700 p-2 text-[11px] leading-relaxed text-zinc-500 whitespace-pre-wrap font-mono">
                  {affectedCodeDescription}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
