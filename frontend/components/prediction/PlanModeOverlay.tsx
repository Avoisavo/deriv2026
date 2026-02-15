"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";

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
  /** True to show the linking animation (cross-domain visual linking before expansion). */
  showLinking?: boolean;
  /** Consequences text (what will happen). Can be from AI or demo. */
  consequencesText?: string;
  /** Solution text (AI-proposed solution). */
  solutionText?: string;
  /** Outcome text (outcome after implementing solution). */
  outcomeText?: string;
  /** Label for the prediction pill (default "Prediction"). When provided (e.g. from API predictedOutput), last pill shows this. */
  predictionLabel?: string;
  /** Probability of predicted outcome (0–100), from the plan API. */
  probabilityPercent?: number;
  /** Per-edge confidence (0.6–1) and relation description from the plan API; length = pathLabels.length. */
  pathEdges?: { confidence: number; relationDescription: string }[];
  /** Called when user clicks Proceed in the final modal – virtual prediction becomes a real node. */
  onYes: () => void;
  /** Called when user clicks Cancel – virtual prediction is discarded. */
  onNo: () => void;
  /** Called when user closes overlay / goes back. */
  onClose: () => void;
  /** If set, after typing is done and modal is shown, auto-click Proceed after this many ms (e.g. 1000). */
  autoProceedAfterMs?: number;
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

/** Fallback descriptions for why path steps are related (used when API does not return pathEdges). Based on prediction-nodes domains: Support, Finance, Ops, Compliance, Marketing. */
const EDGE_DESCRIPTIONS = [
  "Support volume or response-time change drives the next outcome (e.g. ticket spike → backlog or refund uptick).",
  "Finance control or threshold change affects downstream capacity or spend (e.g. vendor threshold → contractor reduction).",
  "Ops alert or incident (latency, error rate, rollback) triggers the next decision or escalation.",
  "Compliance hold, KYC queue, or monitoring change ties to support verification delays or dispute intake.",
  "Cross-domain: support backlog or complaints feed into Finance watchlist or emergency-spend workflow.",
  "Cost controls or hiring freeze increases reliance on Ops rollback readiness and incident playbooks.",
  "Payment holds or verification delays surface in support tickets and escalate to dispute or refund watchlist.",
  "Incident declaration or rollback links to Compliance audit trail and Finance emergency approval flow.",
  "Campaign or conversion dip aligns with ops latency and support confirm-stuck complaints.",
  "Error-rate or latency breach triggers cost-control pause and ties to Compliance communication note.",
];

/** Stable random confidence in [0.6, 1] from a seed (index). */
function edgeConfidence(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return 0.6 + (1 - 0.6) * (Math.abs(x - Math.floor(x)));
}

export function PlanModeOverlay({
  pathLabels,
  pillVisibleCount,
  prompt,
  onPromptChange,
  onPromptSubmit,
  isExpanded,
  showLinking = false,
  consequencesText = DEFAULT_CONSEQUENCES,
  solutionText = DEFAULT_SOLUTION,
  outcomeText = DEFAULT_OUTCOME,
  predictionLabel,
  probabilityPercent,
  pathEdges,
  onYes,
  onNo,
  onClose,
  autoProceedAfterMs,
}: PlanModeOverlayProps) {
  const lastPillLabel = predictionLabel ?? "Prediction";

  /** Per-edge confidence (0.6–1) and description; from API when present (API returns pathEdges for path segments only, not for last→prediction), else fallback. */
  const edgeMeta = useMemo(() => {
    const n = pathLabels.length + 1;
    const edgeCount = n - 1;
    const edgesWithCards = edgeCount - 1;
    if (pathEdges && pathEdges.length >= edgesWithCards) {
      const fromApi = pathEdges.slice(0, edgesWithCards).map((e) => ({
        confidence: Math.max(0.6, Math.min(1, e.confidence)),
        description: e.relationDescription?.trim() || "Step in path.",
      }));
      const lastDummy = { confidence: 0.8, description: "" };
      return [...fromApi, lastDummy];
    }
    return Array.from({ length: edgeCount }, (_, i) => ({
      confidence: edgeConfidence(i + pathLabels.join("|").length),
      description: EDGE_DESCRIPTIONS[(i + pathLabels.length) % EDGE_DESCRIPTIONS.length],
    }));
  }, [pathLabels, pathEdges]);
  const [typingSection, setTypingSection] = useState<TypingSection>("consequences");
  const [displayedLength, setDisplayedLength] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [showYesNoModal, setShowYesNoModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoProceedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (autoProceedTimerRef.current) {
      clearTimeout(autoProceedTimerRef.current);
      autoProceedTimerRef.current = null;
    }
    setShowYesNoModal(false);
    onYes();
  }, [onYes]);

  const handleNo = useCallback(() => {
    if (autoProceedTimerRef.current) {
      clearTimeout(autoProceedTimerRef.current);
      autoProceedTimerRef.current = null;
    }
    setShowYesNoModal(false);
    onNo();
  }, [onNo]);

  // When modal is shown and autoProceedAfterMs is set, schedule auto Proceed.
  useEffect(() => {
    if (!showYesNoModal || typingSection !== "done" || autoProceedAfterMs == null || autoProceedAfterMs <= 0) return;
    autoProceedTimerRef.current = setTimeout(() => {
      autoProceedTimerRef.current = null;
      setShowYesNoModal(false);
      onYes();
    }, autoProceedAfterMs);
    return () => {
      if (autoProceedTimerRef.current) {
        clearTimeout(autoProceedTimerRef.current);
        autoProceedTimerRef.current = null;
      }
    };
  }, [showYesNoModal, typingSection, autoProceedAfterMs, onYes]);

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

      {/* Phase 2: Path – nodes and edge cards (score + description) in one flow, between nodes */}
      {(showLinking || isExpanded) && (
        <div className="flex-none border-b border-slate-700/50 px-4 py-5 bg-slate-900/50 overflow-x-auto">
          {LINK_FLOW_STYLE}
          <div className="mx-auto w-full min-w-0" style={{ maxWidth: "min(90rem, 100%)" }}>
            {(() => {
              const n = pathLabels.length + 1;
              const nodes = [...pathLabels.map((l, i) => ({ label: l, isPrediction: false, i })), { label: lastPillLabel, isPrediction: true, i: pathLabels.length }];
              const totalCols = 2 * n - 1;
              const gridCols = Array.from({ length: totalCols }, (_, j) => (j % 2 === 0 ? "minmax(4rem, 0.6fr)" : "minmax(10rem, 1.1fr)")).join(" ");
              return (
                <div
                  className="grid w-full items-start gap-x-0"
                  style={{ gridTemplateColumns: gridCols }}
                >
                  {Array.from({ length: totalCols }, (_, colIdx) => {
                    if (colIdx % 2 === 0) {
                      const i = colIdx / 2;
                      const node = nodes[i];
                      const visible = i < pillVisibleCount || (node.isPrediction && pillVisibleCount >= pathLabels.length);
                      const linkLeftActive = i > 0 && i <= pillVisibleCount;
                      const linkRightActive = i < n - 1 && i + 1 <= pillVisibleCount;
                      return (
                        <div key={`node-${i}`} className="flex min-w-0 flex-col items-center justify-start px-0.5">
                          <div className="relative flex h-10 w-full items-center justify-center">
                            {i > 0 && (
                              <div
                                className={`absolute right-1/2 left-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full transition-all duration-300 ${linkLeftActive ? "plan-link-flow-div" : ""}`}
                                style={{ background: linkLeftActive ? undefined : "rgba(71, 85, 105, 0.4)" }}
                              />
                            )}
                            {i < n - 1 && (
                              <div
                                className={`absolute left-1/2 right-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full transition-all duration-300 ${linkRightActive ? "plan-link-flow-div" : ""}`}
                                style={{ background: linkRightActive ? undefined : "rgba(71, 85, 105, 0.4)" }}
                              />
                            )}
                            <div
                              className="relative z-10 h-3 w-3 shrink-0 rounded-full border-2 transition-all duration-300"
                              style={{
                                backgroundColor: node.isPrediction ? "#fff" : "rgb(251, 191, 36)",
                                borderColor: node.isPrediction ? "rgba(255,255,255,0.9)" : "rgba(251, 191, 36, 0.9)",
                                opacity: visible ? 1 : 0.25,
                              }}
                            />
                          </div>
                          <span
                            className="mt-0.5 max-w-full text-center text-xs font-medium transition-all duration-300"
                            style={{
                              opacity: visible ? 1 : 0.35,
                              color: node.isPrediction ? "rgb(226, 232, 240)" : "rgb(148, 163, 184)",
                            }}
                            title={node.label}
                          >
                            <span className="block truncate">{node.label}</span>
                            {node.isPrediction && typeof probabilityPercent === "number" && (
                              <span className="mt-0.5 block font-semibold text-amber-400/90">{probabilityPercent}%</span>
                            )}
                          </span>
                        </div>
                      );
                    }
                    const edgeIdx = (colIdx - 1) / 2;
                    const meta = edgeMeta[edgeIdx];
                    if (!meta) return null;
                    const edgeVisible = edgeIdx + 1 <= pillVisibleCount;
                    const isLastEdge = edgeIdx === edgeMeta.length - 1;
                    const confidenceDisplay = meta.confidence % 1 === 0
                      ? meta.confidence.toFixed(1)
                      : meta.confidence.toFixed(2);
                    return (
                      <div
                        key={`edge-${edgeIdx}`}
                        className={`flex min-w-0 flex-col items-center justify-start px-1 ${isLastEdge ? "" : "pt-0.5"}`}
                        style={{ opacity: edgeVisible ? 1 : 0.45 }}
                      >
                        <div className={isLastEdge ? "flex h-10 w-full items-center" : "mb-1"}>
                          <div
                            className={`h-0.5 w-full rounded-full transition-all duration-300 ${edgeVisible ? "plan-link-flow-div" : ""}`}
                            style={{ background: edgeVisible ? undefined : "rgba(71, 85, 105, 0.4)" }}
                          />
                        </div>
                        {!isLastEdge && (
                          <div
                            className="w-full min-h-[3.5rem] rounded-lg border border-slate-600/50 bg-slate-800/60 px-2.5 py-2 shadow-sm flex flex-col justify-center"
                            title={meta.description}
                          >
                            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                              Confidence {confidenceDisplay}
                            </div>
                            <p className="text-[11px] leading-snug text-slate-400 break-words line-clamp-2">
                              {meta.description}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Phase 3: After expansion – Consequences / Solution / Outcome */}
      {isExpanded && (
        <>
          <div
            ref={scrollRef}
            className={`flex-1 min-h-0 overflow-auto p-6 ${showYesNoModal ? "pb-14" : ""}`}
          >
            <div className="mx-auto max-w-2xl space-y-6">
              {/* Path mapping: tie Consequences/Solution/Outcome to the path shown above */}
              <p className="text-xs text-slate-500">
                Path: {pathLabels.join(" → ")} → {lastPillLabel}
                {typeof probabilityPercent === "number" && (
                  <span className="ml-1.5 font-medium text-amber-400/90">({probabilityPercent}% probability)</span>
                )}
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
                  <div className="mb-3 flex items-center gap-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                      Outcome
                    </h3>
                    {typeof probabilityPercent === "number" && (
                      <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-400">
                        {probabilityPercent}% probability
                      </span>
                    )}
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-300">
                    {typingSection === "outcome" ? currentDisplayed : outcomeText}
                    {typingSection === "outcome" && !sectionDone && cursorVisible && (
                      <span className="inline-block w-2 h-4 bg-amber-500 ml-0.5 align-middle animate-pulse" />
                    )}
                  </pre>
                </section>
              )}

              {/* Execution section: integrations with purpose/idea */}
              {(typingSection === "outcome" || typingSection === "done") && (
                <section className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-400">
                    Execution
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <img src="/calandarlogo.png" alt="Calendar" className="h-8 w-8 shrink-0 rounded object-contain" />
                      <p className="text-sm text-slate-300">
                        Schedule end-of-life milestones and stakeholder check-ins for the transition plan.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <img src="/gmaillogo.png" alt="Gmail" className="h-8 w-8 shrink-0 rounded object-contain" />
                      <p className="text-sm text-slate-300">
                        Send updates to partners and internal teams about the wattle bottle wind-down timeline.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <img src="/docslogo.png" alt="Docs" className="h-8 w-8 shrink-0 rounded object-contain" />
                      <p className="text-sm text-slate-300">
                        Draft transition plan doc: communication strategy, alternatives, and new product messaging.
                      </p>
                    </div>
                  </div>
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
