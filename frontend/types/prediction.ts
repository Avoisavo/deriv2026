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

/** Per-edge metadata for the chosen path (one per consecutive pair in pathNodeIds). */
export interface PathEdge {
  /** Confidence that this step belongs in the path, in range 0.6–1. */
  confidence: number;
  /** Short explanation of why these two nodes are related. */
  relationDescription: string;
}

/** Response shape from /api/prediction/plan (question + existing graph → path + analysis). */
export interface PlanResponse {
  consequences: string;
  solution: string;
  predictedOutput: string;
  /** Probability of predicted outcome (0–100), from the model. */
  probabilityPercent?: number;
  pathNodeIds: string[];
  /** Per-edge confidence (0.6–1) and relation description (length = pathNodeIds.length - 1). */
  pathEdges?: PathEdge[];
}
