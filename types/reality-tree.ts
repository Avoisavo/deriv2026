export interface Belief {
  label: string;
  val: number;
}

export interface RealityNode {
  id: string;
  type: "past" | "present" | "future";
  title: string;
  metric?: string;
  status?: string;
  facts?: string[];
  beliefs?: Belief[];
  prob?: number;
  signal_hint?: string;
  is_high_prob?: boolean;
}
