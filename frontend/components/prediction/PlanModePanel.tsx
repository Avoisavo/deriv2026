"use client";

import { useEffect, useRef } from "react";
import type { PlanResponse } from "@/types/prediction";

export interface PlanModePanelProps {
  /** Path node labels (glow-up nodes), in order. */
  pathLabels: string[];
  /** How many pills to show so far (for one-by-one animation). */
  pillVisibleCount: number;
  /** Panel is expanded (60% height) or collapsed (bar only). */
  isExpanded: boolean;
  /** Toggle expand/collapse. */
  onToggleExpand: () => void;
  /** Input value shown in the collapsed bar (plan prompt). */
  planPrompt?: string;
  /** Called when the user changes the plan prompt in the collapsed bar. */
  onPlanPromptChange?: (value: string) => void;
  /** Called when user submits the prompt (e.g. Predict button). */
  onPromptSubmit?: (prompt: string) => void;
  /** When false, expand is disabled (e.g. until prediction flow has run). */
  canExpand?: boolean;
  /** Result from plan API: consequences, solution, predictedOutput. */
  planResult?: PlanResponse | null;
  /** Plan API is loading. */
  planLoading?: boolean;
  /** Plan API error message. */
  planError?: string | null;
}

export function PlanModePanel({
  pathLabels,
  pillVisibleCount,
  isExpanded,
  onToggleExpand,
  planPrompt = "",
  onPlanPromptChange,
  onPromptSubmit,
  canExpand = true,
  planResult = null,
  planLoading = false,
  planError = null,
}: PlanModePanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [planResult]);

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-10 flex flex-col overflow-hidden border-t border-slate-700 bg-slate-900/98 backdrop-blur-sm shadow-[0_-4px_24px_rgba(0,0,0,0.4)] transition-[height] duration-300 ease-out ${
        isExpanded ? "h-[60%]" : "h-12"
      }`}
    >
      {/* Collapsed bar: input field + Predict button + expand toggle (when allowed) */}
      <div className="flex flex-none items-center gap-2 px-4 py-2 min-h-12">
        <input
          type="text"
          value={planPrompt}
          onChange={(e) => onPlanPromptChange?.(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onPromptSubmit?.(planPrompt)}
          placeholder="e.g. What if our company stop producing wattle bottle?"
          className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        {onPromptSubmit && (
          <button
            type="button"
            onClick={() => onPromptSubmit(planPrompt)}
            disabled={!planPrompt.trim() || planLoading}
            className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {planLoading ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Predicting…
              </>
            ) : (
              "Predict"
            )}
          </button>
        )}
        {canExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            className="flex shrink-0 items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 transition-colors duration-200"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
          >
            <span className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>▼</span>
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden relative">
          {/* Upper: path as linkage + nodes (flowing links, circles kept round) */}
          <div className="flex-none border-b border-slate-700/50 px-4 py-4 bg-slate-900/50">
            <style>{`
              @keyframes plan-link-flow-div {
                0% { background-position: 0% 50%; }
                100% { background-position: 200% 50%; }
              }
              .plan-link-flow-div {
                background: linear-gradient(
                  90deg,
                  rgba(251, 191, 36, 0.8) 0%,
                  rgba(251, 191, 36, 0.95) 25%,
                  rgba(251, 191, 36, 0.8) 50%,
                  rgba(251, 191, 36, 0.95) 75%,
                  rgba(251, 191, 36, 0.8) 100%
                ) !important;
                background-size: 200% 100% !important;
                animation: plan-link-flow-div 1.2s linear infinite;
              }
            `}</style>
            <div className="mx-auto max-w-4xl">
              {pathLabels.length > 0 && (() => {
                const n = pathLabels.length;
                return (
                  <div className="grid w-full" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
                    {/* Row 1: one circle per column + link segments so nodes match column spacing */}
                    {pathLabels.map((_, i) => {
                      const visible = i < pillVisibleCount;
                      const linkRightVisible = i < n - 1 && i + 1 <= pillVisibleCount;
                      const linkLeftVisible = i > 0 && i <= pillVisibleCount;
                      return (
                        <div key={i} className="relative flex items-center justify-center min-h-10">
                          {i > 0 && (
                            <div
                              className={`absolute left-0 right-1/2 top-1/2 h-0.5 -translate-y-1/2 rounded-full transition-all duration-300 ${linkLeftVisible ? "plan-link-flow-div" : ""}`}
                              style={{
                                background: linkLeftVisible ? undefined : "rgba(71, 85, 105, 0.4)",
                              }}
                            />
                          )}
                          {i < n - 1 && (
                            <div
                              className={`absolute left-1/2 right-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full transition-all duration-300 ${linkRightVisible ? "plan-link-flow-div" : ""}`}
                              style={{
                                background: linkRightVisible ? undefined : "rgba(71, 85, 105, 0.4)",
                              }}
                            />
                          )}
                          <div
                            className="relative z-10 h-3 w-3 shrink-0 rounded-full border-2 transition-all duration-300"
                            style={{
                              backgroundColor: "rgb(251, 191, 36)",
                              borderColor: "rgba(251, 191, 36, 0.9)",
                              opacity: visible ? 1 : 0.25,
                            }}
                          />
                        </div>
                      );
                    })}
                    {/* Row 2: one label per column, directly under the node */}
                    {pathLabels.map((label, i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center justify-start pt-0.5 transition-all duration-300"
                        style={{
                          opacity: i < pillVisibleCount ? 1 : 0.35,
                          transform: i < pillVisibleCount ? "translateY(0)" : "translateY(4px)",
                        }}
                      >
                        <span className="block text-center text-xs font-medium text-slate-400 truncate w-full px-0.5" title={label}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Main content area: loading, error, or plan result (consequences, solution, predicted output) */}
          <div ref={scrollContainerRef} className="flex min-h-0 flex-1 flex-col overflow-auto p-4 transition-all duration-300">
            {planLoading && (
              <div className="flex flex-1 items-center justify-center animate-in fade-in duration-300">
                <div className="text-center space-y-4">
                  <div className="flex justify-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" />
                  </div>
                  <p className="text-sm text-slate-400 font-medium">Reading graph and selecting path from core to prediction…</p>
                </div>
              </div>
            )}

            {!planLoading && planError && (
              <div className="flex flex-1 flex-col gap-4 animate-in fade-in duration-300">
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">
                  <p className="font-medium mb-1">Prediction failed</p>
                  <p className="text-slate-400">{planError}</p>
                </div>
              </div>
            )}

            {!planLoading && !planError && planResult && (
              <div className="flex flex-1 flex-col gap-4 animate-in fade-in duration-300">
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-5 space-y-4">
                  <section>
                    <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-2">Consequences</h3>
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">{planResult.consequences}</pre>
                  </section>
                  <section>
                    <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-2">Solution</h3>
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">{planResult.solution}</pre>
                  </section>
                  <section>
                    <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-2">Predicted output</h3>
                    <p className="text-sm font-medium text-amber-400">{planResult.predictedOutput}</p>
                    <p className="text-xs text-slate-500 mt-1">Path: Core → {pathLabels.join(" → ")} → Prediction</p>
                  </section>
                </div>
              </div>
            )}

            {!planLoading && !planError && !planResult && (
              <div className="flex flex-1 flex-col justify-center">
                <p className="text-sm text-slate-500 text-center">
                  Enter a question above (e.g. &quot;What if our company stops producing wattle bottle?&quot;) and click <strong>Predict</strong> to get consequences, solution, and a path from core through the graph to a prediction node.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
