/** Response shape from /api/prediction/analyze (Gemini analysis of events JSON). */
export interface AnalyzeEventsResponse {
  departmentName: string;
  /** Overall summary (optional when each node has its own consequence/solution). */
  consequences?: string;
  solution?: string;
  predictedOutput: string;
  /** Each node = one output; node has its own events, consequence, solution and output. */
  nodes: {
    /** Output label for this node. */
    title: string;
    description?: string;
    briefDescription?: string;
    /** Events that happened / led to this node. */
    eventsHappened?: string;
    /** Consequence for this node (what happens). */
    consequence?: string;
    /** Solution for this node (recommended actions). */
    solution?: string;
  }[];
  links: { sourceIndex: number; targetIndex: number }[];
}

/** Per-node details from prediction-nodes.txt (e.g. /api/prediction/node-details). Keyed by node title (output). */
export interface NodeDetail {
  consequences?: string;
  solution?: string;
  eventSummary?: string;
}

export type NodeDetailsMap = Record<string, NodeDetail>;

/** Response shape from /api/prediction/plan (question + existing graph → path + analysis). */
export interface PlanResponse {
  consequences: string;
  solution: string;
  predictedOutput: string;
  pathNodeIds: string[];
}
