"use client";

export interface PlanModeOverlayProps {
  /** Path node labels (glow-up nodes), in order. */
  pathLabels: string[];
  /** How many pills to show so far (for one-by-one animation). */
  pillVisibleCount: number;
  /** Full mitigation plan text. */
  mitigationPlan: string;
  /** How many characters of mitigation plan to show (typing effect). */
  typedLength: number;
  /** True when typing is done; show options and input. */
  typingDone: boolean;
  planInput: string;
  onPlanInputChange: (value: string) => void;
  /** Called when user clicks close; return to graph. */
  onClose: () => void;
}

export function PlanModeOverlay({
  pathLabels,
  pillVisibleCount,
  mitigationPlan,
  typedLength,
  typingDone,
  planInput,
  onPlanInputChange,
  onClose,
}: PlanModeOverlayProps) {
  const nodesSettled = pillVisibleCount >= pathLabels.length;

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-slate-900/98 backdrop-blur-sm">
      {/* Close: back to graph */}
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

      {/* Upper: path nodes translate in one by one (only this until all settled) */}
      <div className="flex flex-wrap items-center justify-center gap-3 border-b border-slate-700 px-4 py-6">
        {pathLabels.map((label, i) => (
          <span
            key={i}
            className="rounded-full bg-amber-500/25 px-4 py-2 text-sm font-medium text-amber-200 shadow-lg shadow-amber-500/20 ring-1 ring-amber-500/40 transition-all duration-300"
            style={{
              opacity: i < pillVisibleCount ? 1 : 0,
              transform: i < pillVisibleCount ? "translateY(0) scale(1)" : "translateY(-8px) scale(0.95)",
            }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Lower: plan typing — only after all nodes have moved to upper div */}
      {nodesSettled && (
        <div className="flex flex-1 flex-col overflow-auto p-6">
          <div className="font-mono text-sm leading-relaxed text-slate-300">
            {mitigationPlan.slice(0, typedLength)}
            {typedLength < mitigationPlan.length && (
              <span className="animate-pulse">|</span>
            )}
          </div>
        </div>
      )}

      {/* Popup modal at bottom: Yes / No + input (only when typing done) */}
      {typingDone && (
        <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-slate-700 bg-slate-900/98 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
          <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
              >
                Yes, auto accept
              </button>
              <button
                type="button"
                className="rounded bg-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-500"
              >
                No
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-400">
                Additional notes
              </label>
              <input
                type="text"
                value={planInput}
                onChange={(e) => onPlanInputChange(e.target.value)}
                placeholder="Enter feedback or instructions…"
                className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
