import React, { useState, useEffect, useCallback, useRef } from "react";
import { RealityNode } from "../types/reality-tree";
import {
  ShieldCheck,
  Zap,
  Activity,
  X,
  GripVertical,
  CheckCircle2,
  ShieldAlert,
  Eye,
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

  // Content for S2 simulated state
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

  // Enriched Scenario Content Mapping
  const scenarioDetails: Record<
    string,
    {
      watchingNext: string;
      recommendation: { type: "support" | "mitigate"; text: string };
      beliefDist: { label: string; val: number }[];
      safeProtocols: { title: string; desc: string }[];
    }
  > = {
    O1: {
      watchingNext: "Payment Gateway Latency",
      recommendation: {
        type: "mitigate",
        text: "Prepare emergency failover to Stripe B",
      },
      beliefDist: [
        { label: "Provider alert", val: 65 },
        { label: "Cart abandonment", val: 35 },
      ],
      safeProtocols: [
        {
          title: "Gateway Warm-up",
          desc: "Keep standby provider session active to reduce switchover latency.",
        },
        {
          title: "Throttle Non-Essential API",
          desc: "Prioritize checkout bandwidth over analytics pings.",
        },
      ],
    },
    O2: {
      watchingNext: "APAC Telemetry Breach",
      recommendation: {
        type: "mitigate",
        text: "Auto-trigger status page banner & rollback readiness",
      },
      beliefDist: [
        { label: "Revenue drop", val: 75 },
        { label: "Refund spike", val: 25 },
      ],
      safeProtocols: [
        {
          title: "Status Page Automation",
          desc: "Draft localized incidence report for APAC stakeholders.",
        },
        {
          title: "Regional CDN Flush",
          desc: "Clear APAC edge cache to ensure latest recovery config propagates.",
        },
      ],
    },
    O3: {
      watchingNext: "Referral Conversion Rate",
      recommendation: {
        type: "mitigate",
        text: "Pause APAC marketing campaigns",
      },
      beliefDist: [
        { label: "Partner attrition", val: 80 },
        { label: "Scam alerts", val: 20 },
      ],
      safeProtocols: [
        {
          title: "Marketing Spend Halt",
          desc: "Instantly pause programmatic ads in high-latency regions.",
        },
        {
          title: "Fraud Engine Boost",
          desc: "Increase sensitivity for referrals originating from affected partners.",
        },
      ],
    },
    O4: {
      watchingNext: "Ticket Arrival Rate",
      recommendation: {
        type: "support",
        text: "Confirm baseline stability & close monitoring",
      },
      beliefDist: [
        { label: "Volume recovery", val: 90 },
        { label: "Conversion recovery", val: 10 },
      ],
      safeProtocols: [
        {
          title: "Baseline Verification",
          desc: "Compare last 5 mins with 24h rolling average.",
        },
        {
          title: "Support Backlog Pulse",
          desc: "Coordinate with CS team to verify actual customer success.",
        },
      ],
    },
    O2A: {
      watchingNext: "Hourly Revenue Delta",
      recommendation: {
        type: "mitigate",
        text: "Immediate CEO-level financial brief",
      },
      beliefDist: [
        { label: "Manual override", val: 60 },
        { label: "Shareholder impact", val: 40 },
      ],
      safeProtocols: [
        {
          title: "Revenue Leak Alert",
          desc: "Notify finance of projected $12k/hr delta in APAC.",
        },
        {
          title: "Investor Comms Draft",
          desc: "Prepare internal memo regarding Q1 performance variance.",
        },
      ],
    },
    O2B: {
      watchingNext: "CS Ticket Volume",
      recommendation: { type: "mitigate", text: "Scale APAC support staff" },
      beliefDist: [{ label: "Trust deficit", val: 100 }],
      safeProtocols: [
        {
          title: "Staff Surge Trigger",
          desc: "Onboard overflow support vendor for APAC complaints.",
        },
        {
          title: "Auto-Refund Protocol",
          desc: "Enable 1-click compensation for orders stuck in 'pending'.",
        },
      ],
    },
    O2C: {
      watchingNext: "Post-Deploy Latency",
      recommendation: {
        type: "support",
        text: "Verify fix success & document root cause",
      },
      beliefDist: [{ label: "System health 100%", val: 100 }],
      safeProtocols: [
        {
          title: "Health Check Probe",
          desc: "Run synthetic transactions across all APAC edge regions.",
        },
        {
          title: "Post-Mortem Init",
          desc: "Schedule engineering review for incident INC-492.",
        },
      ],
    },
    // Adding Layer 3 ghosts for complete coverage
    G1A: {
      watchingNext: "Provider API Status",
      recommendation: {
        type: "mitigate",
        text: "Switch to secondary region immediately",
      },
      beliefDist: [{ label: "Infra saturation", val: 100 }],
      safeProtocols: [
        {
          title: "Region Evacuation",
          desc: "Route all requests away from failing cluster.",
        },
      ],
    },
    G1B: {
      watchingNext: "Checkout Abandonment Rate",
      recommendation: {
        type: "mitigate",
        text: "Trigger 'Wait' message to users",
      },
      beliefDist: [{ label: "Revenue loss", val: 100 }],
      safeProtocols: [
        {
          title: "User Flow Buffer",
          desc: "Insert artificial delay to prevent rate limiting.",
        },
      ],
    },
    G2A: {
      watchingNext: "Gross Merchandise Value",
      recommendation: {
        type: "mitigate",
        text: "Apply emergency discounting for parity",
      },
      beliefDist: [{ label: "Quarterly Target", val: 100 }],
      safeProtocols: [
        {
          title: "GMV recovery",
          desc: "Push targeted promocodes to affected users.",
        },
      ],
    },
    G2B: {
      watchingNext: "Refund Count",
      recommendation: { type: "mitigate", text: "Automate dispute resolution" },
      beliefDist: [{ label: "Brand Equity", val: 100 }],
      safeProtocols: [
        {
          title: "Dispute suppression",
          desc: "Proactively refund small transactions.",
        },
      ],
    },
  };

  const currentScenario = scenarioId ? scenarioDetails[scenarioId] : null;

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
              {isScenario
                ? "Scenario-Specific Protocol"
                : "Live Decision Protocol"}
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
        {currentScenario ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-500">
            {/* Watching Next */}
            <div className="p-4 bg-indigo-900 rounded-xl text-white flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-800 rounded-lg">
                  <Eye size={18} className="text-indigo-300" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">
                    Watching Next
                  </p>
                  <p className="text-sm font-black tracking-tight">
                    {currentScenario.watchingNext}
                  </p>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            </div>

            {/* Actionable Recommendations (Standardized Name) */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-slate-500">
                <CheckCircle2 size={14} />
                <h3 className="text-[10px] font-black uppercase tracking-widest">
                  Actionable Recommendation
                </h3>
              </div>
              <div
                className={`p-5 rounded-xl border-l-4 shadow-sm flex flex-col gap-2 ${currentScenario.recommendation.type === "support" ? "bg-emerald-50 border-emerald-200 border-l-emerald-600" : "bg-rose-50 border-rose-200 border-l-rose-600"}`}
              >
                <div className="flex items-center gap-2">
                  {currentScenario.recommendation.type === "support" ? (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  ) : (
                    <ShieldAlert size={16} className="text-rose-600" />
                  )}
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider ${currentScenario.recommendation.type === "support" ? "text-emerald-700" : "text-rose-700"}`}
                  >
                    {currentScenario.recommendation.type === "support"
                      ? "Strategic Support"
                      : "Mitigation Protocol"}
                  </span>
                </div>
                <p className="text-[13px] font-bold text-slate-800 leading-tight">
                  {currentScenario.recommendation.text}
                </p>
              </div>
            </div>

            {/* Unique Safe Protocols for each scenario */}
            <div className="space-y-4 md:space-y-5">
              <div className="flex items-center gap-2 text-emerald-600">
                <ShieldCheck size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Branch-Specific Guardrails
                </span>
              </div>
              <div className="space-y-3">
                {currentScenario.safeProtocols.map((protocol, i) => (
                  <div
                    key={i}
                    className="group relative bg-white rounded-xl border border-slate-100 p-4 md:p-5 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-xl" />
                    <h3 className="font-bold text-xs text-slate-800 mb-1">
                      {protocol.title}
                    </h3>
                    <p className="text-[10px] md:text-[11px] text-slate-400 leading-relaxed italic">
                      {protocol.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40 py-20">
            <Zap size={32} className="text-slate-300" />
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                Live State Active
              </p>
              <p className="text-[10px] font-medium text-slate-400 max-w-[200px]">
                Intelligence logs only available for predicted reality branches.
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default DecisionPanel;
