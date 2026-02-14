/**
 * Types for the aggregated decision tree: departments, decisions, and graph.
 * This file only defines shapes; no runtime data or logic.
 */

export interface EvolutionHistoryEntry {
  version: string;
  date: string;
  description: string;
}

export interface Decision {
  id: string;
  title: string;
  departmentId: string;
  version: string;
  status: string;
  created: string;
  category: string;
  size: string;
  description: string;
  /** Short summary for the affected node (e.g. one line). */
  briefDescription?: string;
  /** What is affected in the corresponding code (collapsible in UI). */
  affectedCodeDescription?: string;
  /** Mitigation plan text shown in plan mode (typing animation). */
  mitigationPlan?: string;
  evolutionHistory: EvolutionHistoryEntry[];
}

export interface Department {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  decisionIds: string[];
}

export interface GraphNodePayload {
  decision: Decision;
  departmentId: string;
}

export interface GraphNode {
  id: string;
  payload: GraphNodePayload;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface DecisionTreeData {
  departments: Department[];
  decisions: Decision[];
  nodes: GraphNode[];
  links: GraphLink[];
}
