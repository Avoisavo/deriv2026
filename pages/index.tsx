import React, { useState } from "react";
import Head from "next/head";
import RealityTree from "../components/RealityTree";
import DecisionPanel from "../components/DecisionPanel";
import Header from "../components/Header";
import { RealityNode } from "../types/reality-tree";
import { PanelRightOpen, Database, Play } from "lucide-react";

export default function Home() {
  const [expandedBranchId, setExpandedBranchId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [toast, setToast] = useState<{ title: string; msg: string } | null>(
    null,
  );

  const triggerSimulation = () => {
    setToast({
      title: "New evidence received",
      msg: "APAC checkout error rate increased (0.3% → 2.1%)",
    });

    setTimeout(() => {
      setIsSimulated(true);
      setExpandedBranchId(null);
      setSelectedNodeId(null);
    }, 1500);

    setTimeout(() => setToast(null), 6000);
  };

  const activeNode: RealityNode = isSimulated
    ? {
        id: "S2",
        type: "present",
        title: "Checkout errors are rising",
        metric: "Confirmed via APAC Telemetry • Just now",
        status: "LIVE",
        facts: [
          "APAC checkout error rate: 2.1% (was 0.3%)",
          "P95 checkout latency: 1.9s (was 0.8s)",
        ],
        beliefs: [
          { label: "Likelihood: Recent deploy caused regression", val: 70 },
          { label: "Likelihood: Infrastructure saturation", val: 20 },
          { label: "Likelihood: Payment provider instability", val: 10 },
        ],
      }
    : {
        id: "S1",
        type: "present",
        title: "Customers complaining (tickets spiked)",
        metric: "Detected via API • 12s ago",
        status: "LIVE",
        facts: [
          "APAC support tickets +42% in last 30 min",
          "Most complaints mention: slow checkout",
        ],
        beliefs: [
          { label: "Likelihood: Checkout system getting slower", val: 55 },
          { label: "Likelihood: Bad traffic from partner campaign", val: 30 },
          { label: "Likelihood: Competitor price drop", val: 15 },
        ],
      };

  return (
    <div className="w-full h-screen bg-[#FAFAFA] text-slate-900 font-sans flex flex-col md:flex-row overflow-hidden relative">
      <Head>
        <title>Reality Tree | Kinetic Engine</title>
      </Head>

      <Header />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 bg-white border-2 border-slate-900 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 flex items-center gap-5 w-[90%] md:w-auto">
          <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">
              {toast.title}
            </span>
            <span className="text-xs font-bold text-slate-800">
              {toast.msg}
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 relative overflow-hidden grid-bg select-none min-h-[50vh]">
        <RealityTree
          activeNode={activeNode}
          selectedOutcomeId={expandedBranchId}
          selectedNodeId={selectedNodeId}
          onSelectBranch={(id) => {
            setExpandedBranchId(id);
            if (id) {
              setSelectedNodeId(id);
              setIsPanelOpen(true);
            }
          }}
          onSelectNode={(id) => {
            setSelectedNodeId(id);
            if (id) setIsPanelOpen(true);
          }}
          isSimulated={isSimulated}
        />

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-4">
          {!isSimulated && (
            <button
              onClick={triggerSimulation}
              className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-full shadow-2xl hover:bg-slate-800 transition-all active:scale-95 group whitespace-nowrap"
            >
              <Play
                size={14}
                fill="currentColor"
                className="group-hover:translate-x-1 transition-transform"
              />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                New Data (DEMO)
              </span>
            </button>
          )}

          {isSimulated && (
            <button
              onClick={() => {
                setIsSimulated(false);
                setExpandedBranchId(null);
                setSelectedNodeId(null);
              }}
              className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-slate-200 text-slate-400 rounded-full shadow-lg hover:border-slate-400 hover:text-slate-600 transition-all active:scale-95"
            >
              <Database size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                Reset Flow
              </span>
            </button>
          )}
        </div>

        {!isPanelOpen && (
          <button
            onClick={() => setIsPanelOpen(true)}
            className="absolute top-24 right-6 md:top-28 md:right-10 z-[60] p-3 bg-white/80 border border-slate-200/60 rounded-xl shadow-lg hover:bg-white transition-all text-slate-500 hover:text-black backdrop-blur-md"
          >
            <PanelRightOpen size={20} />
          </button>
        )}
      </div>

      {isPanelOpen && (
        <DecisionPanel
          node={activeNode}
          scenarioId={selectedNodeId}
          onClose={() => setIsPanelOpen(false)}
        />
      )}
    </div>
  );
}
