import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import { RealityNode } from "../types/reality-tree";
import { Search, History, TrendingUp } from "lucide-react";

interface Props {
  activeNode: RealityNode;
  selectedOutcomeId: string | null; // Expanded branch
  selectedNodeId: string | null; // Node in preview mode
  onSelectBranch: (id: string | null) => void;
  onSelectNode: (id: string | null) => void;
  isSimulated: boolean;
}

const RealityTree: React.FC<Props> = ({
  activeNode,
  selectedOutcomeId,
  selectedNodeId,
  onSelectBranch,
  onSelectNode,
  isSimulated,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.8);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const NODE_WIDTH = isMobile ? 220 : 280;
  const NODE_HEIGHT = isMobile ? 100 : 130;

  const centerTree = useCallback(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setOffset({
        x: width * 0.15,
        y: height / 2 - NODE_HEIGHT / 2,
      });
    }
  }, [NODE_HEIGHT]);

  useEffect(() => {
    centerTree();
    const observer = new ResizeObserver(() =>
      requestAnimationFrame(centerTree),
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [centerTree]);

  const nodes = useMemo(() => {
    const spacing = isMobile ? 400 : 550;

    const baseNodes = [
      {
        id: "ROOT_INIT",
        title: "Customers complaining (tickets spiked)",
        isInitialRoot: true,
        x: isSimulated ? -spacing : 0,
        y: 0,
        type: isSimulated ? "past" : "live",
        facts: ["Ticket count > 450/hr", "APAC latency detected"],
      },
      {
        id: "O1",
        title: "More failed checkouts",
        prob: 0.35,
        x: isSimulated ? 0 : spacing,
        y: isSimulated ? -250 : -300,
        type: isSimulated ? "past" : "outcome",
        opacity: isSimulated ? 0.3 : 1,
      },
      {
        id: "O2",
        title: "Checkout errors rise",
        prob: 0.45,
        is_high_prob: true,
        x: isSimulated ? 0 : spacing,
        y: 0,
        type: isSimulated ? "live" : "outcome",
        facts: isSimulated
          ? ["Error rate increased to 2.4%", "Stripe API returning 403s"]
          : [],
      },
      {
        id: "O3",
        title: "Partner traffic quality drops",
        prob: 0.15,
        x: isSimulated ? 0 : spacing,
        y: isSimulated ? 250 : 300,
        type: isSimulated ? "past" : "outcome",
        opacity: isSimulated ? 0.3 : 1,
      },
      {
        id: "O4",
        title: "Stabilizes (no worsening)",
        prob: 0.05,
        x: isSimulated ? 0 : spacing,
        y: isSimulated ? 500 : 600,
        type: isSimulated ? "past" : "outcome",
        opacity: isSimulated ? 0.3 : 1,
      },
    ];

    const simulatedOutcomes = [
      {
        id: "O2A",
        parentId: "O2",
        title: "Revenue drops today",
        prob: 0.55,
        is_high_prob: true,
        x: spacing,
        y: -200,
        type: "outcome",
      },
      {
        id: "O2B",
        parentId: "O2",
        title: "Refunds increase",
        prob: 0.25,
        x: spacing,
        y: 100,
        type: "outcome",
      },
      {
        id: "O2C",
        parentId: "O2",
        title: "Stabilizes after rollback",
        prob: 0.2,
        x: spacing,
        y: 400,
        type: "outcome",
      },
    ];

    return [
      ...baseNodes,
      ...simulatedOutcomes.map((o) => ({
        ...o,
        x: isSimulated ? o.x : spacing,
        y: isSimulated ? o.y : 0,
        opacity: isSimulated ? 1 : 0,
        scale: isSimulated ? 1 : 0.5,
      })),
    ];
  }, [isMobile, isSimulated]);

  const ghosts = useMemo(() => {
    const gMap: Record<
      string,
      { id: string; title: string; desc: string; prob?: number }[]
    > = {
      O1: [
        {
          id: "G1A",
          title: "Provider alert triggers",
          desc: "Critical infrastructure failure suspected.",
          prob: 0.65,
        },
        {
          id: "G1B",
          title: "Cart abandonment up",
          desc: "Direct revenue loss due to flow disruption.",
          prob: 0.35,
        },
      ],
      O2: isSimulated
        ? []
        : [
            {
              id: "G2A",
              title: "Revenue drops today",
              desc: "Projected -12% delta based on latency.",
              prob: 0.75,
            },
            {
              id: "G2B",
              title: "Refunds increase",
              desc: "Expect spike in ticket volume.",
              prob: 0.25,
            },
            {
              id: "G2C",
              title: "Stabilizes after rollback",
              desc: "Verify fix success & document root cause.",
              prob: 0.05, // Added a small prob value for consistency
            },
          ],
      O3: [
        {
          id: "G3A",
          title: "Partner Y attrition",
          desc: "Cohort-specific attrition confirmed.",
          prob: 0.8,
        },
        {
          id: "G3B",
          title: "Scam complaints",
          desc: "Brand reputation risk if ads remain misaligned.",
          prob: 0.2,
        },
      ],
      O4: [
        {
          id: "G4A",
          title: "Volume recovers",
          desc: "Temporary glitch resolved; baseline stable.",
          prob: 0.9,
        },
        {
          id: "G4B",
          title: "Conversion recovers",
          desc: "Users successfully completing flows.",
          prob: 0.1,
        },
      ],
      O2A: [
        {
          id: "G2AA",
          title: "Manual override triggered",
          desc: "Systems rerouting to secondary region.",
          prob: 0.6,
        },
        {
          id: "G2AB",
          title: "Shareholder impact",
          desc: "Public disclosure required for significant delta.",
          prob: 0.4,
        },
      ],
      O2B: [
        {
          id: "G2BA",
          title: "Trust deficit",
          desc: "Long term churn for affected APAC cohort.",
          prob: 0.85,
        },
        {
          id: "G2BB",
          title: "Competitor Migration",
          desc: "Users switching to alternative platforms during downtime.",
          prob: 0.15,
        },
      ],
      O2C: [
        {
          id: "G2CA",
          title: "Full System Audit",
          desc: "Verifying root cause across all clusters.",
          prob: 0.55,
        },
        {
          id: "G2CB",
          title: "Baseline Restored",
          desc: "Conversion rates returning to pre-incident levels.",
          prob: 0.45,
        },
      ],
    };
    return gMap;
  }, [isSimulated]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".reality-node")) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const ghostXDest = isMobile
    ? (isMobile ? 400 : 550) + NODE_WIDTH + 150
    : (isMobile ? 400 : 550) + NODE_WIDTH + 350;

  const renderPaths = () => {
    return (
      <>
        {nodes
          .filter((n) => ["O1", "O2", "O3", "O4"].includes(n.id))
          .map((n) => {
            const root = nodes.find((r) => r.id === "ROOT_INIT")!;
            const startX = root.x + NODE_WIDTH;
            const startY = root.y + NODE_HEIGHT / 2;
            const endX = n.x;
            const endY = n.y + NODE_HEIGHT / 2;
            const isActive = n.id === "O2";
            return (
              <path
                key={`p-root-${n.id}`}
                d={`M ${startX} ${startY} C ${startX + 150} ${startY}, ${endX - 150} ${endY}, ${endX} ${endY}`}
                className={`fill-none transition-all duration-700 ${isActive ? "stroke-amber-500 stroke-[4] animate-dash" : "stroke-slate-200 stroke-[2]"} ${n.opacity === 0 ? "opacity-0" : "opacity-100"}`}
                style={{ strokeDasharray: isActive ? "4 4" : "6 4" }}
              />
            );
          })}

        {nodes
          .filter((n) => (n as any).parentId === "O2")
          .map((n) => {
            const parent = nodes.find((p) => p.id === "O2")!;
            const startX = parent.x + NODE_WIDTH;
            const startY = parent.y + NODE_HEIGHT / 2;
            const endX = n.x;
            const endY = n.y + NODE_HEIGHT / 2;
            const isActive = n.is_high_prob;
            const nodeOpacity = (n as any).opacity ?? 1;

            return (
              <path
                key={`p-o2-${n.id}`}
                d={`M ${startX} ${startY} C ${startX + 150} ${startY}, ${endX - 150} ${endY}, ${endX} ${endY}`}
                className={`fill-none transition-all duration-700 ${isActive ? "stroke-amber-500 stroke-[4] animate-dash" : "stroke-slate-200 stroke-[2]"} ${nodeOpacity === 0 ? "opacity-0" : "opacity-100"}`}
                style={{ strokeDasharray: isActive ? "4 4" : "6 4" }}
              />
            );
          })}

        {Object.entries(ghosts).map(([parentId, gs]) => {
          const parent = nodes.find((o) => o.id === parentId);
          if (!parent) return null;

          const startX = parent.x + NODE_WIDTH;
          const startY = parent.y + NODE_HEIGHT / 2;
          const isExpanded = selectedOutcomeId === parentId;

          return gs.map((g, i) => {
            const destY =
              parent.y -
              (isMobile ? 80 : 120) +
              i * (isMobile ? 180 : 250) +
              NODE_HEIGHT / 2;
            const endX = isExpanded ? ghostXDest : startX;
            const endY = isExpanded ? destY : startY;

            return (
              <path
                key={`p-ghost-${g.id}`}
                d={`M ${startX} ${startY} C ${startX + 100} ${startY}, ${endX - 100} ${endY}, ${endX} ${endY}`}
                className={`fill-none transition-all duration-500 ease-in-out ${isExpanded ? "stroke-indigo-400 stroke-[2] opacity-100" : "stroke-indigo-200 stroke-[1] opacity-0"}`}
                style={{ strokeDasharray: "4,4" }}
              />
            );
          });
        })}
      </>
    );
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDragging(false)}
      onWheel={(e) =>
        setScale((prev) =>
          Math.min(Math.max(0.4, prev + e.deltaY * -0.001), 1.5),
        )
      }
    >
      <div
        className="absolute inset-0 transition-transform duration-75 ease-out origin-center"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
        }}
      >
        <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none overflow-visible">
          {renderPaths()}
        </svg>

        {nodes.map((n: any) => {
          const isSelected = selectedNodeId === n.id;

          return (
            <div
              key={n.id}
              onClick={() => {
                if (n.type === "live" || n.type === "past") {
                  onSelectBranch(null);
                  onSelectNode(null);
                } else {
                  onSelectBranch(selectedOutcomeId === n.id ? null : n.id);
                }
              }}
              className={`reality-node absolute transition-all duration-700 ease-in-out flex flex-col shadow-2xl z-50 rounded-2xl
                ${n.type === "live" ? (isSimulated ? "bg-white border-2 border-orange-500 shadow-orange-200 ring-8 ring-orange-100" : "bg-white border-2 border-slate-900 shadow-slate-200") : ""}
                ${n.type === "past" ? "bg-slate-50 border border-slate-200 opacity-60 grayscale shadow-none rounded-xl" : ""}
                ${n.type === "outcome" ? "bg-white border shadow-md rounded-2xl " + (n.is_high_prob ? "border-amber-500 border-2 shadow-amber-100 ring-8 ring-amber-50" : "border-slate-200") : ""}
                ${isSelected ? "scale-105 border-indigo-500 ring-10 ring-indigo-50 shadow-indigo-100" : ""}
                ${n.type === "outcome" || n.type === "live" ? "cursor-pointer hover:shadow-xl" : "cursor-pointer"}
              `}
              style={{
                left: n.x,
                top: n.y,
                width: NODE_WIDTH,
                minHeight: n.type === "past" ? 80 : NODE_HEIGHT,
                opacity: n.opacity ?? 1,
                transform: `scale(${n.scale ?? 1})`,
                zIndex: isSelected ? 100 : n.type === "live" ? 80 : 50,
              }}
            >
              {isSelected && (
                <span className="absolute -top-4 left-6 bg-indigo-600 text-white text-[9px] md:text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-2xl flex items-center gap-1.5 z-50">
                  <Search size={12} /> Previewing
                </span>
              )}

              <div
                className={`flex justify-between items-start mb-2 pb-0 ${n.type === "live" ? "p-6 md:p-8" : "p-5 md:p-7"}`}
              >
                <div className="flex flex-col gap-2">
                  {n.type === "live" && (
                    <span
                      className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md flex items-center gap-1.5 w-fit
                            ${isSimulated ? "bg-orange-500 text-white shadow-lg shadow-orange-200" : "bg-slate-900 text-white"}`}
                    >
                      <TrendingUp size={10} /> Live State
                    </span>
                  )}
                  {n.type === "past" && (
                    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md flex items-center gap-1 w-fit bg-slate-200 text-slate-500">
                      <History size={10} /> Past State
                    </span>
                  )}
                  <h3
                    className={`font-black leading-tight tracking-tight ${n.type === "past" ? "text-slate-400 text-sm md:text-base" : "text-slate-900 text-base md:text-xl"}`}
                  >
                    {n.title}
                  </h3>
                </div>

                {n.type === "outcome" && (
                  <div className="flex flex-col items-end">
                    <span
                      className={`text-[11px] md:text-[14px] font-black ${n.is_high_prob ? "text-amber-600" : "text-slate-400"}`}
                    >
                      {Math.round(n.prob * 100)}%
                    </span>
                    <span className="text-[7px] md:text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
                      Likeliness
                    </span>
                  </div>
                )}
              </div>

              {n.facts && n.facts.length > 0 && n.type === "live" && (
                <div
                  className={`pt-1 space-y-1.5 mb-6 ${n.type === "live" ? "px-6 md:px-8" : "px-5 md:px-7"}`}
                >
                  {n.facts.map((f: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 text-[10px] md:text-[11px] text-slate-500 font-bold"
                    >
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full shrink-0" />
                      <span className="leading-tight opacity-70">{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {Object.entries(ghosts).map(([parentId, gs]) => {
          const parent = nodes.find((o) => o.id === parentId);
          if (!parent) return null;
          const isExpanded = selectedOutcomeId === parentId;

          return gs.map((g, i) => {
            const destY =
              parent.y - (isMobile ? 80 : 120) + i * (isMobile ? 180 : 250);
            const x = isExpanded ? ghostXDest : parent.x;
            const y = isExpanded ? destY : parent.y;

            return (
              <div
                key={g.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(selectedNodeId === g.id ? null : g.id);
                }}
                className={`reality-node absolute bg-white border border-dashed transition-all duration-500 ease-in-out cursor-pointer rounded-2xl p-5 md:p-7 flex flex-col shadow-2xl z-10
                  ${isExpanded ? "opacity-95 scale-100 pointer-events-auto" : "opacity-0 scale-50 pointer-events-none"}
                  ${selectedNodeId === g.id ? "border-indigo-500 ring-4 md:ring-10 ring-indigo-50 scale-105" : "border-indigo-200 hover:border-indigo-400"}`}
                style={{
                  left: x,
                  top: y,
                  width: isMobile ? 240 : 300,
                  minHeight: isMobile ? 100 : 130,
                  transitionDelay: isExpanded ? `${i * 100}ms` : "0ms",
                }}
              >
                {selectedNodeId === g.id && (
                  <span className="absolute -top-4 left-6 bg-indigo-600 text-white text-[9px] md:text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-2xl flex items-center gap-1.5 z-50">
                    <Search size={12} /> Previewing
                  </span>
                )}
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] block">
                    Next Reality
                  </span>
                  {g.prob !== undefined && (
                    <div className="flex flex-col items-end -mt-1">
                      <span className="text-[12px] md:text-[14px] font-black text-indigo-600">
                        {Math.round(g.prob * 100)}%
                      </span>
                      <span className="text-[7px] md:text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
                        Likeliness
                      </span>
                    </div>
                  )}
                </div>
                <h5 className="font-black text-slate-900 text-sm md:text-base mb-2 leading-tight">
                  {g.title}
                </h5>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  {g.desc}
                </p>
              </div>
            );
          });
        })}
      </div>
    </div>
  );
};

export default RealityTree;
