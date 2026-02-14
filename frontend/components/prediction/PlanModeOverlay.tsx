"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface PlanModeOverlayProps {
  /** Path node labels (information nodes on the lit path), in order. */
  pathLabels: string[];
  /** How many path pills to show so far (one-by-one animation). */
  pillVisibleCount: number;
  /** Prompt input (e.g. "What if our company stop producing wattle bottle?") */
  prompt: string;
  onPromptChange: (value: string) => void;
  /** Called when user submits the prompt; parent lights path and creates prediction node. */
  onPromptSubmit: (prompt: string) => void;
  /** True after prediction node is created; overlay then expands and shows Consequences / Solution / Outcome. */
  isExpanded: boolean;
  /** Consequences text (what will happen). Can be from AI or demo. */
  consequencesText?: string;
  /** Solution text (AI-proposed solution). */
  solutionText?: string;
  /** Outcome text (outcome after implementing solution). */
  outcomeText?: string;
  /** Label for the prediction pill (default "Prediction"). When provided (e.g. from API predictedOutput), last pill shows this. */
  predictionLabel?: string;
  /** Called when user clicks Proceed in the final modal – virtual prediction becomes a real node. */
  onYes: () => void;
  /** Called when user clicks Cancel – virtual prediction is discarded. */
  onNo: () => void;
  /** Called when user closes overlay / goes back. */
  onClose: () => void;
}

const TYPING_SPEED = 12;
const DELAY_BETWEEN_SECTIONS = 400;

const DEFAULT_CONSEQUENCES = `• Revenue from wattle bottle line drops; dependent teams and contracts are affected.
• Supply chain and inventory need rebalancing; some partners may need to be renegotiated or phased out.
• Brand perception may shift; communication and repositioning will be required.`;

const DEFAULT_SOLUTION = `• Run a transition plan: set an end-of-life date, communicate to stakeholders, and offer alternatives.
• Redirect capacity to other product lines and retrain or reassign affected staff.
• Update sustainability and product messaging to reflect the new strategy.`;

const DEFAULT_OUTCOME = `• Clean wind-down of wattle bottle production with minimal disruption.
• Resources and brand focus aligned to higher-priority products; potential for improved margins.
• Clear narrative for customers and investors.`;

/* Flowing linkage: moving gradient on div-based link segments */
const LINK_FLOW_STYLE = (
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
);

type TypingSection = "consequences" | "solution" | "outcome" | "done";

export function PlanModeOverlay({
  pathLabels,
  pillVisibleCount,
  prompt,
  onPromptChange,
  onPromptSubmit,
  isExpanded,
  consequencesText = DEFAULT_CONSEQUENCES,
  solutionText = DEFAULT_SOLUTION,
  outcomeText = DEFAULT_OUTCOME,
  predictionLabel,
  onYes,
  onNo,
  onClose,
}: PlanModeOverlayProps) {
  const lastPillLabel = predictionLabel ?? "Prediction";
  const [typingSection, setTypingSection] = useState<TypingSection>("consequences");
  const [displayedLength, setDisplayedLength] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [showYesNoModal, setShowYesNoModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentFullText =
    typingSection === "consequences"
      ? consequencesText
      : typingSection === "solution"
        ? solutionText
        : typingSection === "outcome"
          ? outcomeText
          : "";
  const currentDisplayed = currentFullText.slice(0, displayedLength);
  const sectionDone = displayedLength >= currentFullText.length;

  useEffect(() => {
    const t = setInterval(() => setCursorVisible((v) => !v), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [currentDisplayed]);

  useEffect(() => {
    if (!isExpanded || pathLabels.length === 0) return;
    if (typingSection === "done") return;

    const full = currentFullText;
    if (displayedLength >= full.length) {
      const nextTimer = window.setTimeout(() => {
        if (typingSection === "consequences") {
          setTypingSection("solution");
          setDisplayedLength(0);
        } else if (typingSection === "solution") {
          setTypingSection("outcome");
          setDisplayedLength(0);
        } else if (typingSection === "outcome") {
          setTypingSection("done");
          setDisplayedLength(0);
          setShowYesNoModal(true);
        }
      }, DELAY_BETWEEN_SECTIONS);
      return () => clearTimeout(nextTimer);
    }

    const charTimer = window.setTimeout(
      () => setDisplayedLength((n) => Math.min(n + 1, full.length)),
      TYPING_SPEED
    );
    return () => clearTimeout(charTimer);
  }, [isExpanded, typingSection, displayedLength, currentFullText, pathLabels.length]);

  const handleSubmit = useCallback(() => {
    if (prompt.trim()) onPromptSubmit(prompt.trim());
  }, [prompt, onPromptSubmit]);

  const handleYes = useCallback(() => {
    setShowYesNoModal(false);
    onYes();
  }, [onYes]);

  const handleNo = useCallback(() => {
    setShowYesNoModal(false);
    onNo();
  }, [onNo]);

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-slate-900/98 backdrop-blur-sm">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-700/80 text-slate-300 hover:bg-slate-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        aria-label="Back to graph"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Phase 1: Prompt input (always visible at top when not expanded, or when expanded as context) */}
      <div className="flex-none border-b border-slate-700 px-4 py-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="e.g. What if our company stop producing wattle bottle?"
            className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            disabled={isExpanded}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!prompt.trim() || isExpanded}
            className="rounded-lg bg-amber-600 px-5 py-3 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExpanded ? "Analyzed" : "Predict"}
          </button>
        </div>
      </div>

      {/* Phase 2: After prediction node – path as linkage + nodes then Consequences / Solution / Outcome */}
      {isExpanded && (
        <>
          <div className="flex-none border-b border-slate-700/50 px-4 py-5 bg-slate-900/50">
            {LINK_FLOW_STYLE}
            <div className="mx-auto max-w-4xl">
              {(() => {
                const n = pathLabels.length + 1;
                const nodes = [...pathLabels.map((l, i) => ({ label: l, isPrediction: false, i })), { label: lastPillLabel, isPrediction: true, i: pathLabels.length }];
                return (
                  <div className="grid w-full" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
                    {/* Row 1: one circle per column + link segments so nodes match column spacing */}
                    {nodes.map((node, i) => {
                      const visible = i < pillVisibleCount || (node.isPrediction && pillVisibleCount >= pathLabels.length);
                      const linkRightVisible = i < n - 1 && i + 1 <= pillVisibleCount;
                      const linkLeftVisible = i > 0 && i <= pillVisibleCount;
                      return (
                        <div key={i} className="relative flex items-center justify-center min-h-10">
                          {/* Left half of link (from previous node) */}
                          {i > 0 && (
                            <div
                              className={`absolute left-0 right-1/2 top-1/2 h-0.5 -translate-y-1/2 rounded-full transition-all duration-300 ${linkLeftVisible ? "plan-link-flow-div" : ""}`}
                              style={{
                                background: linkLeftVisible ? undefined : "rgba(71, 85, 105, 0.4)",
                              }}
                            />
                          )}
                          {/* Right half of link (to next node) */}
                          {i < n - 1 && (
                            <div
                              className={`absolute left-1/2 right-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full transition-all duration-300 ${linkRightVisible ? "plan-link-flow-div" : ""}`}
                              style={{
                                background: linkRightVisible ? undefined : "rgba(71, 85, 105, 0.4)",
                              }}
                            />
                          )}
                          {/* Node circle - fixed size so stays round */}
                          <div
                            className="relative z-10 h-3 w-3 shrink-0 rounded-full border-2 transition-all duration-300"
                            style={{
                              backgroundColor: node.isPrediction ? "#fff" : "rgb(251, 191, 36)",
                              borderColor: node.isPrediction ? "rgba(255,255,255,0.9)" : "rgba(251, 191, 36, 0.9)",
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
                    <div
                      className="flex flex-col items-center justify-start pt-0.5 transition-all duration-300"
                      style={{
                        opacity: pillVisibleCount >= pathLabels.length ? 1 : 0.35,
                        transform: pillVisibleCount >= pathLabels.length ? "translateY(0)" : "translateY(4px)",
                      }}
                    >
                      <span className="block text-center text-xs font-medium text-white truncate w-full px-0.5" title={lastPillLabel}>{lastPillLabel}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          <div
            ref={scrollRef}
            className={`flex-1 min-h-0 overflow-auto p-6 ${showYesNoModal ? "pb-14" : ""}`}
          >
            <div className="mx-auto max-w-2xl space-y-6">
              {/* Path mapping: tie Consequences/Solution/Outcome to the path shown above */}
              <p className="text-xs text-slate-500">
                Path: {pathLabels.join(" → ")} → {lastPillLabel}
              </p>
              <section className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Consequences
                </h3>
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-300">
                  {typingSection === "consequences" ? currentDisplayed : consequencesText}
                  {typingSection === "consequences" && !sectionDone && cursorVisible && (
                    <span className="inline-block w-2 h-4 bg-amber-500 ml-0.5 align-middle animate-pulse" />
                  )}
                </pre>
              </section>

              {(typingSection === "solution" || typingSection === "outcome" || typingSection === "done") && (
                <section className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-400">
                    Solution
                  </h3>
                  <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-300">
                    {typingSection === "solution" ? currentDisplayed : solutionText}
                    {typingSection === "solution" && !sectionDone && cursorVisible && (
                      <span className="inline-block w-2 h-4 bg-amber-500 ml-0.5 align-middle animate-pulse" />
                    )}
                  </pre>
                </section>
              )}

              {(typingSection === "outcome" || typingSection === "done") && (
                <section className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-400">
                    Outcome
                  </h3>
                  <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-300">
                    {typingSection === "outcome" ? currentDisplayed : outcomeText}
                    {typingSection === "outcome" && !sectionDone && cursorVisible && (
                      <span className="inline-block w-2 h-4 bg-amber-500 ml-0.5 align-middle animate-pulse" />
                    )}
                  </pre>
                </section>
              )}
            </div>
          </div>

          {showYesNoModal && (
            <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center gap-3 border-t border-slate-600/50 bg-slate-800/98 backdrop-blur-sm shadow-[0_-4px_20px_rgba(0,0,0,0.3)] px-4 py-3">
              <p className="flex-1 min-w-0 text-sm font-semibold text-slate-200">
                Accept this prediction and add it to the graph?
              </p>
              <div className="flex shrink-0 gap-3">
                <button
                  type="button"
                  onClick={handleNo}
                  className="rounded-xl bg-slate-600 px-6 py-3 text-sm font-medium text-slate-200 hover:bg-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleYes}
                  className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-500"
                >
                  Proceed
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
