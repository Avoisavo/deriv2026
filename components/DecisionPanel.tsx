import React, { useState, useEffect, useCallback, useRef } from "react";
import { RealityNode } from "../types/reality-tree";
import {
  ShieldCheck,
  Zap,
  Activity,
  X,
  ArrowRight,
  GripVertical,
} from "lucide-react";

interface Props {
  node: RealityNode;
  scenarioId: string | null;
  onClose?: () => void;
}

const DecisionPanel: React.FC<Props> = ({ node, scenarioId, onClose }) => {
  const isScenario = !!scenarioId;
  const isSimulated = node.id === "S2";
  const [width, setWidth] = useState(440);
  const isResizing = useRef(false);

  const MIN_WIDTH = 320;
  const MAX_WIDTH = 700;

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
      setWidth(newWidth);
    }
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
    document.body.style.cursor = "default";
  }, [handleMouseMove]);

  const startResizing = useCallback(
    (e: React.MouseEvent) => {
      isResizing.current = true;
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", stopResizing);
      document.body.style.cursor = "col-resize";
    },
    [handleMouseMove, stopResizing],
  );

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", stopResizing);
    };
  }, [handleMouseMove, stopResizing]);

  const panelStyle = {
    width:
      typeof window !== "undefined" && window.innerWidth >= 768
        ? `${width}px`
        : "100%",
  };

  const simulatedContent = {
    safeProtocols: [
      {
        title: "Enable rollback readiness",
        desc: "Prepare version 1.4.2 deployment candidates.",
      },
      {
        title: "Status page banner",
        desc: "Inform users of potential checkout disruption in APAC.",
      },
    ],
    conditional: {
      title: "If errors continue 15 min → rollback",
      desc: "Automatic trigger if error rate stays above 2.0% until 01:25 AM.",
    },
  };

  return (
    <aside
      style={panelStyle}
      className="h-full bg-white border-l border-slate-200 flex flex-col shadow-2xl z-[120] animate-in slide-in-from-bottom md:slide-in-from-right duration-500 fixed md:relative bottom-0 right-0 max-h-[70vh] md:max-h-full rounded-t-3xl md:rounded-none transition-[width] duration-75 ease-out"
    >
      {/* Resize Handle */}
      <div
        onMouseDown={startResizing}
        className="hidden md:flex absolute left-0 top-0 bottom-0 w-1 hover:w-2 hover:bg-indigo-500/30 cursor-col-resize items-center justify-center group transition-all z-[80]"
      >
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical size={16} className="text-indigo-400" />
        </div>
      </div>

      {/* Panel Header */}
      <div
        className={`p-6 md:p-8 border-b transition-colors duration-500 shrink-0 ${isScenario ? "bg-indigo-50 border-indigo-100" : "bg-slate-50/50 border-slate-100"}`}
      >
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h2
              className={`text-[10px] font-black uppercase tracking-[0.2em] ${isScenario ? "text-indigo-600" : "text-slate-400"}`}
            >
              {isScenario
                ? `If Branch confirms next...`
                : "Recommended Actions"}
            </h2>
            <div className="text-base md:text-lg font-black text-slate-800 flex items-center gap-2">
              {isScenario ? "Conditional Strategy" : "Live Decision Protocol"}
              <div
                className={`w-2 h-2 rounded-full ${isScenario ? "bg-indigo-500" : "bg-slate-900"}`}
              />
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-slate-400 hover:text-black transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 md:space-y-12 scrollbar-hide">
        {!isScenario && node.beliefs && (
          <div className="space-y-4 md:space-y-5">
            <div className="flex items-center gap-2 text-slate-500">
              <Activity size={14} />
              <h3 className="text-[10px] font-black uppercase tracking-widest">
                Likelihood Analysis
              </h3>
            </div>
            <div className="space-y-4 md:space-y-5">
              {node.beliefs.map((b, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[11px] md:text-xs font-bold text-slate-800">
                    <span className="truncate mr-2">{b.label}</span>
                    <span className="text-slate-400 shrink-0">{b.val}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-400 rounded-full"
                      style={{ width: `${b.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4 md:space-y-5">
          <div className="flex items-center gap-2 text-emerald-600">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Safe Protocols
            </span>
          </div>

          <div className="space-y-3">
            {(isSimulated
              ? simulatedContent.safeProtocols
              : [
                  {
                    title: "Stricter monitoring for APAC checkout",
                    desc: "Ensures high-fidelity data collection.",
                  },
                  {
                    title: "Route APAC traffic to backup instance",
                    desc: "Protective redundancy measure.",
                  },
                ].filter((_, i) => !isScenario || i === 0)
            ).map((protocol, i) => (
              <div
                key={i}
                className="group relative bg-white rounded-xl border border-slate-100 p-4 md:p-5 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-xl" />
                <h3 className="font-bold text-xs text-slate-800 mb-1">
                  {isScenario
                    ? "Prepare customer status banner"
                    : protocol.title}
                </h3>
                <p className="text-[10px] md:text-[11px] text-slate-400 leading-relaxed italic">
                  {isScenario
                    ? "Mitigates trust damage if errors manifest."
                    : protocol.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 md:space-y-5">
          <div
            className={`flex items-center gap-2 ${isScenario ? "text-indigo-600" : "text-amber-600"}`}
          >
            <Zap size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isScenario ? "Targeted Response" : "Conditional Strategy"}
            </span>
          </div>

          <div
            className={`relative rounded-xl border p-4 md:p-5 border-l-4 transition-all ${isScenario ? "bg-indigo-50 border-indigo-200 border-l-indigo-600" : "bg-amber-50 border-amber-200 border-l-amber-500"}`}
          >
            <h3
              className={`font-bold text-xs mb-2 ${isScenario ? "text-indigo-900" : "text-amber-900"}`}
            >
              {isScenario
                ? "Execute mitigation for verified path"
                : isSimulated
                  ? simulatedContent.conditional.title
                  : "If checkout errors rise (O2)"}
            </h3>
            <p
              className={`text-[10px] md:text-[11px] leading-relaxed mb-4 ${isScenario ? "text-indigo-800/70" : "text-amber-800/70"}`}
            >
              {isScenario
                ? "Rollback latest deploy and redirect all APAC gateway traffic to secondary provider."
                : isSimulated
                  ? simulatedContent.conditional.desc
                  : "Initiate emergency rollback. Requires O2 signal verification."}
            </p>
            <button
              className={`w-full py-2 bg-white border text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded transition-colors ${isScenario ? "border-indigo-200 text-indigo-700 hover:bg-indigo-100 shadow-sm" : "border-amber-200 text-amber-700 hover:bg-amber-100 shadow-sm"}`}
            >
              {isScenario ? "Authorize Plan" : "View Requirements"}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 border-t border-slate-100 bg-white shrink-0">
        <button className="w-full h-12 md:h-14 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl active:scale-95 group">
          {isScenario ? "CONFIRM ACTION" : "ACTIVATE PROTOCOL"}
          <ArrowRight
            size={14}
            className="group-hover:translate-x-1 transition-transform"
          />
        </button>
      </div>
    </aside>
  );
};

export default DecisionPanel;
