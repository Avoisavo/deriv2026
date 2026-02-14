"use client";

import { useMemo, useState, useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { getMockDecisionTreeData } from "@/lib/mockDecisionTree";
import type { DecisionTreeData } from "@/types/decision-tree";
import type { NodeDetailsMap } from "@/types/prediction";
import { usePredictionTreeState } from "@/hooks/usePredictionTreeState";
import { LeftSidebar } from "@/components/prediction/LeftSidebar";
import { RightSidebar } from "@/components/prediction/RightSidebar";
import { DecisionTreeGraph } from "@/components/prediction/DecisionTreeGraph";

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
        />
      </main>
      <RightSidebar pathDecisions={pathDecisions} departments={departments} nodeDetailsMap={nodeDetailsMap} />
    </div>
  );
}
