"use client";

import { useMemo } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { getMockDecisionTreeData } from "@/lib/mockDecisionTree";
import { useDecisionTreeState } from "@/hooks/useDecisionTreeState";
import { LeftSidebar } from "@/components/LeftSidebar";
import { RightSidebar } from "@/components/RightSidebar";
import { DecisionTreeGraph } from "@/components/DecisionTreeGraph";
import { SimulationModal } from "@/components/SimulationModal";
import { useState } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const initialData = getMockDecisionTreeData();

export default function Home() {
  const {
    departments,
    selectedNodeId,
    highlightedPathNodeIds,
    pathNodeIds,
    handleNodeClick,
    handleToggleVisibility,
    handleRemoveDepartment,
    handleAddDepartment,
    visibleNodes,
    visibleLinks,
  } = useDecisionTreeState({
    initialDepartments: initialData.departments,
    nodes: initialData.nodes,
    links: initialData.links,
  });

  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);

  const decisionsByDept = useMemo(() => {
    const m = new Map<string, typeof initialData.decisions>();
    departments.forEach((d) => {
      m.set(
        d.id,
        initialData.decisions.filter((dec) => dec.departmentId === d.id)
      );
    });
    return m;
  }, [departments]);

  const selectedDecision =
    initialData.decisions.find((d) => d.id === selectedNodeId) ?? null;

  const pathDecisions = useMemo(
    () =>
      pathNodeIds
        .map((id) => initialData.decisions.find((d) => d.id === id))
        .filter((d): d is NonNullable<typeof d> => d != null),
    [pathNodeIds]
  );

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} flex h-screen font-sans text-zinc-200 antialiased`}
    >
      <LeftSidebar
        departments={departments}
        decisionsByDept={decisionsByDept}
        onToggleVisibility={handleToggleVisibility}
        onRemoveDepartment={handleRemoveDepartment}
        onAddDepartment={handleAddDepartment}
        onSelectDecision={handleNodeClick}
        onSimulationClick={() => setIsSimulationModalOpen(true)}
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
        />
      </main>
      <RightSidebar pathDecisions={pathDecisions} />
      <SimulationModal
        isOpen={isSimulationModalOpen}
        onClose={() => setIsSimulationModalOpen(false)}
      />
    </div>
  );
}
