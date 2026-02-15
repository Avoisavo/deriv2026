"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { getMockDecisionTreeData } from "@/lib/mockDecisionTree";
import type { DecisionTreeData } from "@/types/decision-tree";
import type { NodeDetailsMap } from "@/types/prediction";
import { usePredictionTreeState } from "@/hooks/usePredictionTreeState";
import { LeftSidebar } from "@/components/prediction/LeftSidebar";
import { RightSidebar } from "@/components/prediction/RightSidebar";
import { DecisionTreeGraph, type RealtimeDecisionPayload } from "@/components/prediction/DecisionTreeGraph";
import { supabase, REALTIME_EVENTS_TABLE } from "@/lib/supabase";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function PredictionPage() {
  const [initialData, setInitialData] = useState<DecisionTreeData | null>(null);
  const [fromFile, setFromFile] = useState(false);

  useEffect(() => {
    fetch("/api/prediction/tree", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: DecisionTreeData | null) => {
        const hasFileData =
          data &&
          data.departments?.length > 0 &&
          data.nodes?.length > 0;
        setInitialData(hasFileData ? data : getMockDecisionTreeData());
        setFromFile(!!hasFileData);
      })
      .catch(() => {
        setInitialData(getMockDecisionTreeData());
        setFromFile(false);
      });
  }, []);

  if (initialData === null) {
    return (
      <div
        className={`${geistSans.variable} ${geistMono.variable} flex h-screen items-center justify-center font-sans text-zinc-400 antialiased bg-slate-900`}
      >
        Loading prediction tree…
      </div>
    );
  }

  return (
    <PredictionTree initialData={initialData} fromFile={fromFile} />
  );
}

function PredictionTree({
  initialData,
  fromFile,
}: {
  initialData: DecisionTreeData;
  fromFile: boolean;
}) {
  const [nodeDetailsMap, setNodeDetailsMap] = useState<NodeDetailsMap>({});
  const [realtimeDecision, setRealtimeDecision] = useState<RealtimeDecisionPayload | null>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);

  useEffect(() => {
    if (!supabase) {
      console.warn("[Realtime] Supabase client missing (check NEXT_PUBLIC_SUPABASE_* env)");
      return;
    }

    const handleRow = (payload: { prompt?: string; consequences?: string; solution?: string; outcome?: string }) => {
      const prompt = payload.prompt ?? "";
      const consequences = payload.consequences ?? "";
      const solution = payload.solution ?? "";
      const outcome = payload.outcome ?? "";
      setRealtimeDecision({ prompt, consequences, solution, outcome });
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 4000);
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, consequences, solution, outcome }),
      }).catch((err) => console.error("Notify failed:", err));
    };

    supabase.realtime.connect();

    const channel = supabase
      .channel("realtime_poc_events")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: REALTIME_EVENTS_TABLE },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const title = typeof row.title === "string" ? row.title : "";
          const summary = typeof row.summary === "string" ? row.summary : "";
          const evidence = Array.isArray(row.evidence) ? row.evidence.filter((e): e is string => typeof e === "string") : [];
          const solution = evidence.length ? evidence.map((e) => `• ${e}`).join("\n") : summary;
          handleRow({
            prompt: title,
            consequences: summary,
            solution,
            outcome: title,
          });
        }
      )
      .subscribe((status, err) => {
        if (process.env.NODE_ENV === "development") {
          console.log("[Realtime] Subscription status:", status, err ?? "");
        }
      });

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleRealtimeDecisionConsumed = useCallback(() => setRealtimeDecision(null), []);

  useEffect(() => {
    fetch("/api/prediction/node-details", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: NodeDetailsMap) => setNodeDetailsMap(data ?? {}))
      .catch(() => setNodeDetailsMap({}));
  }, []);

  const {
    departments,
    nodes,
    links,
    decisions,
    selectedNodeId,
    highlightedPathNodeIds,
    pathNodeIds,
    handleNodeClick,
    handleToggleVisibility,
    handleRemoveDepartment,
    handleAddDepartment,
    handleAddDepartmentFromAnalysis,
    handleAddPredictionNode,
    visibleNodes,
    visibleLinks,
  } = usePredictionTreeState(initialData, { skipRestoreFromStorage: fromFile });

  const decisionsByDept = useMemo(() => {
    const m = new Map<string, typeof decisions>();
    departments.forEach((d) => {
      m.set(
        d.id,
        decisions.filter((dec) => dec.departmentId === d.id)
      );
    });
    return m;
  }, [departments, decisions]);

  const selectedDecision =
    decisions.find((d) => d.id === selectedNodeId) ?? null;

  const pathDecisions = useMemo(
    () =>
      pathNodeIds
        .map((id) => decisions.find((d) => d.id === id))
        .filter((d): d is NonNullable<typeof d> => d != null),
    [pathNodeIds, decisions]
  );

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} flex h-screen font-sans text-zinc-200 antialiased`}
    >
      <LeftSidebar
        departments={departments}
        decisionsByDept={decisionsByDept}
        links={links}
        onToggleVisibility={handleToggleVisibility}
        onRemoveDepartment={handleRemoveDepartment}
        onAddDepartment={handleAddDepartment}
        onAddDepartmentFromAnalysis={handleAddDepartmentFromAnalysis}
        onSelectDecision={handleNodeClick}
      />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-900 h-full">
        <DecisionTreeGraph
          nodes={visibleNodes}
          links={visibleLinks}
          departments={departments}
          highlightedPathNodeIds={highlightedPathNodeIds}
          selectedNodeId={selectedNodeId}
          pathNodeIds={pathNodeIds}
          onNodeClick={handleNodeClick}
          onAddPredictionNode={handleAddPredictionNode}
          realtimeDecision={realtimeDecision}
          onRealtimeDecisionConsumed={handleRealtimeDecisionConsumed}
        />
      </main>
      <RightSidebar pathDecisions={pathDecisions} departments={departments} nodeDetailsMap={nodeDetailsMap} />

      {/* Green glowing snackbar notification */}
      {showSnackbar && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="relative px-6 py-3 bg-emerald-500/95 text-white font-medium rounded-lg shadow-2xl backdrop-blur-sm border border-emerald-400/50">
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-lg bg-emerald-400 blur-lg opacity-50 -z-10 animate-pulse" />
            <div className="absolute inset-0 rounded-lg bg-emerald-500 blur-md opacity-75 -z-10" />
            {/* Content */}
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Realtime update received</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
