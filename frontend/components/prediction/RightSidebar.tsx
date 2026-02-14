"use client";

import { useState } from "react";
import type { Decision, Department } from "@/types/decision-tree";
import type { NodeDetailsMap } from "@/types/prediction";

export interface RightSidebarProps {
  /** Path decisions (one per lit-up node), in order. Number of entries = number of nodes lit. */
  pathDecisions: Decision[];
  /** Optional departments for node circle color. */
  departments?: Department[];
  /** Optional map from node title to consequences/solution/eventSummary from prediction-nodes.txt. */
  nodeDetailsMap?: NodeDetailsMap;
}

export function RightSidebar({ pathDecisions, departments = [], nodeDetailsMap = {} }: RightSidebarProps) {
  const departmentById = new Map(departments.map((d) => [d.id, d]));

  if (pathDecisions.length === 0) {
    return (
      <aside className="flex h-full w-80 flex-col border-l border-zinc-700 bg-zinc-900 text-zinc-400">
        <div className="border-b border-zinc-700 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Path nodes
          </h2>
        </div>
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm">
          Ask a question or select a path on the graph to see the nodes in this path and what each one affects.
        </div>
      </aside>
    );
  }

  const pathSummary =
    pathDecisions.length === 1
      ? "1 node in path"
      : `${pathDecisions.length} nodes from first step to outcome`;

  return (
    <aside className="flex h-full w-80 flex-col border-l border-zinc-700 bg-zinc-900 text-zinc-200">
      <div className="border-b border-zinc-700 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Path nodes ({pathDecisions.length})
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          {pathSummary}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {pathDecisions.map((decision, index) => (
            <PathNodeCard
              key={decision.id}
              decision={decision}
              index={index}
              total={pathDecisions.length}
              department={departmentById.get(decision.departmentId)}
              nodeDetail={nodeDetailsMap[decision.title]}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

function PathNodeCard({
  decision,
  index,
  total,
  department,
  nodeDetail,
}: {
  decision: Decision;
  index: number;
  total: number;
  department?: Department;
  nodeDetail?: { consequences?: string; solution?: string; eventSummary?: string };
}) {
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [affectedCodeExpanded, setAffectedCodeExpanded] = useState(false);
  const { title, briefDescription, affectedCodeDescription } = decision;
  const domainColor = department?.color ?? "rgb(161 161 170)";
  const hasNodeDetail = nodeDetail && (nodeDetail.consequences ?? nodeDetail.solution ?? nodeDetail.eventSummary);

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3">
      <div className="flex items-start gap-2">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{
            backgroundColor: domainColor,
            color: "white",
            textShadow: "0 0 1px rgba(0,0,0,0.5)",
          }}
          title={`Step ${index + 1} of ${total} in path`}
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white">{title}</h3>
          {briefDescription && !hasNodeDetail && (
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">
              {briefDescription}
            </p>
          )}
          {hasNodeDetail && (
            <div className="mt-2 rounded border border-zinc-700 bg-zinc-900/50">
              <button
                type="button"
                onClick={() => setDetailsExpanded((e) => !e)}
                className="flex w-full items-center justify-between gap-2 p-2 text-left text-xs font-medium text-zinc-400 hover:bg-zinc-800/80"
              >
                <span>Details</span>
                <span
                  className={`shrink-0 text-[10px] transition-transform ${detailsExpanded ? "rotate-180" : ""}`}
                >
                  ▼
                </span>
              </button>
              {detailsExpanded && (
                <div className="space-y-1.5 border-t border-zinc-700 p-2 text-sm text-zinc-300">
                  {nodeDetail.eventSummary && (
                    <p className="leading-relaxed">{nodeDetail.eventSummary}</p>
                  )}
                  {nodeDetail.consequences && (
                    <div>
                      <span className="text-[10px] font-medium uppercase text-zinc-500">Consequences</span>
                      <p className="leading-relaxed">{nodeDetail.consequences}</p>
                    </div>
                  )}
                  {nodeDetail.solution && (
                    <div>
                      <span className="text-[10px] font-medium uppercase text-zinc-500">Solution</span>
                      <p className="leading-relaxed">{nodeDetail.solution}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
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
