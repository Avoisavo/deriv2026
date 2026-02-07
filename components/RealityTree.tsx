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

  const structure = useMemo(() => {
    const spacing = isMobile ? 400 : 550;

    if (!isSimulated) {
      return {
        root: { x: 0, y: 0, title: "Customers complaining (tickets spiked)" },
        outcomes: [
          {
            id: "O1",
            x: spacing,
            y: -300,
            title: "More failed checkouts",
            prob: 0.35,
          },
          {
            id: "O2",
            x: spacing,
            y: 0,
            title: "Checkout errors rise",
            prob: 0.45,
            is_high_prob: true,
          },
          {
            id: "O3",
            x: spacing,
            y: 300,
            title: "Partner traffic quality drops",
            prob: 0.15,
          },
          {
            id: "O4",
            x: spacing,
            y: 600,
            title: "Stabilizes (no worsening)",
            prob: 0.05,
          },
        ],
        ghosts: {
          O1: [
            {
              id: "G1A",
              title: "Provider alert triggers",
              desc: "Critical infrastructure failure suspected.",
            },
            {
              id: "G1B",
              title: "Cart abandonment up",
              desc: "Direct revenue loss due to flow disruption.",
            },
          ],
          O2: [
            {
              id: "G2A",
              title: "Revenue drops today",
              desc: "Projected -12% delta based on latency.",
            },
            {
              id: "G2B",
              title: "Refunds increase",
              desc: "Expect spike in ticket volume.",
            },
          ],
          O3: [
            {
              id: "G3A",
              title: "Partner Y attrition",
              desc: "Cohort-specific attrition confirmed.",
            },
            {
              id: "G3B",
              title: "Scam complaints",
              desc: "Brand reputation risk if ads remain misaligned.",
            },
          ],
          O4: [
            {
              id: "G4A",
              title: "Volume recovers",
              desc: "Temporary glitch resolved; baseline stable.",
            },
            {
              id: "G4B",
              title: "Conversion recovers",
              desc: "Users successfully completing flows.",
            },
          ],
        },
      };
    }

    return {
      pastRoot: {
        x: -400,
        y: 0,
        title: "Customers complaining (tickets spiked)",
      },
      root: { x: 0, y: 0, title: "Checkout errors are rising" },
      outcomes: [
        {
          id: "O2A",
          x: spacing,
          y: -200,
          title: "Revenue drops today",
          prob: 0.55,
          is_high_prob: true,
        },
        {
          id: "O2B",
          x: spacing,
          y: 100,
          title: "Refunds increase",
          prob: 0.25,
        },
        {
          id: "O2C",
          x: spacing,
          y: 400,
          title: "Stabilizes after rollback",
          prob: 0.2,
        },
      ],
      collapsedOutcomes: [
        { id: "O1", x: 0, y: -250, title: "Failed checkouts", prob: 0.18 },
        { id: "O3", x: 0, y: 250, title: "Partner quality drops", prob: 0.07 },
        {
          id: "O4",
          x: 0,
          y: 500,
          title: "Stabilizes (no worsening)",
          prob: 0.02,
        },
      ],
      ghosts: {
        O2A: [
          {
            id: "G2AA",
            title: "Manual override triggered",
            desc: "Systems rerouting to secondary region.",
          },
          {
            id: "G2AB",
            title: "Shareholder impact",
            desc: "Public disclosure required for significant delta.",
          },
        ],
        O2B: [
          {
            id: "G2BA",
            title: "Trust deficit",
            desc: "Long term churn for affected APAC cohort.",
          },
        ],
      },
    };
  }, [isMobile, isSimulated]);

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

  const renderPaths = () => {
    const rootX = structure.root.x + NODE_WIDTH;
    const rootY = structure.root.y + NODE_HEIGHT / 2;

    return (
      <>
        {isSimulated && (
          <path
            d={`M ${structure.pastRoot!.x + NODE_WIDTH} ${structure.pastRoot!.y + NODE_HEIGHT / 2} C ${structure.pastRoot!.x + NODE_WIDTH + 150} ${structure.pastRoot!.y + NODE_HEIGHT / 2}, ${structure.root.x - 150} ${rootY}, ${structure.root.x} ${rootY}`}
            className="fill-none stroke-slate-300 stroke-[4] stroke-dasharray-[8,4]"
          />
        )}

        {structure.outcomes.map((out) => {
          const endX = out.x;
          const endY = out.y + NODE_HEIGHT / 2;
          const isActivePath = out.is_high_prob;
          return (
            <path
              key={`p-root-${out.id}`}
              d={`M ${rootX} ${rootY} C ${rootX + 150} ${rootY}, ${endX - 150} ${endY}, ${endX} ${endY}`}
              className={`fill-none transition-all duration-700 ${isActivePath ? "stroke-amber-500 stroke-[4] animate-dash" : "stroke-slate-200 stroke-[2]"}`}
              style={{ strokeDasharray: isActivePath ? "4 4" : "6 4" }}
            />
          );
        })}

        {isSimulated &&
          structure.collapsedOutcomes?.map((out) => (
            <path
              key={`p-past-${out.id}`}
              d={`M ${structure.pastRoot!.x + NODE_WIDTH} ${structure.pastRoot!.y + NODE_HEIGHT / 2} C ${structure.pastRoot!.x + NODE_WIDTH + 100} ${structure.pastRoot!.y + NODE_HEIGHT / 2}, ${out.x - 100} ${out.y + NODE_HEIGHT / 2}, ${out.x} ${out.y + NODE_HEIGHT / 2}`}
              className="fill-none stroke-slate-100 stroke-[1.5]"
            />
          ))}

        {selectedOutcomeId &&
          (structure.ghosts as any)[selectedOutcomeId]?.map(
            (g: any, i: number) => {
              const out = structure.outcomes.find(
                (o) => o.id === selectedOutcomeId,
              )!;
              const startX = out.x + NODE_WIDTH;
              const startY = out.y + NODE_HEIGHT / 2;
              const ghostX = isMobile
                ? spacing + NODE_WIDTH + 200
                : spacing + NODE_WIDTH + 400;
              const endY =
                out.y -
                (isMobile ? 100 : 150) +
                i * (isMobile ? 200 : 300) +
                NODE_HEIGHT / 2;
              return (
                <path
                  key={`p-ghost-${g.id}`}
                  d={`M ${startX} ${startY} C ${startX + 180} ${startY}, ${ghostX - 180} ${endY}, ${ghostX} ${endY}`}
                  className="fill-none stroke-indigo-400 stroke-[2] stroke-dasharray-[4,4]"
                />
              );
            },
          )}
      </>
    );
  };

  const spacing = isMobile ? 400 : 550;

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

        {/* LAYER 0: PAST ROOT */}
        {isSimulated && structure.pastRoot && (
          <div
            onClick={() => {
              onSelectBranch(null);
              onSelectNode(null);
            }}
            className="reality-node absolute transition-all duration-500 rounded-xl p-5 md:p-7 flex flex-col shadow-lg bg-slate-50 border border-slate-200 opacity-60 z-10 cursor-pointer hover:opacity-100"
            style={{
              left: structure.pastRoot.x,
              top: structure.pastRoot.y,
              width: NODE_WIDTH,
              height: 80,
            }}
          >
            <div className="flex justify-between items-start mb-2 text-slate-400">
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1 bg-slate-200">
                <History size={10} /> Past State
              </span>
            </div>
            <h3 className="font-bold text-slate-400 text-sm md:text-base leading-tight">
              {structure.pastRoot.title}
            </h3>
          </div>
        )}

        {/* LAYER 1: ACTIVE ROOT */}
        <div
          onClick={() => {
            onSelectBranch(null);
            onSelectNode(null);
          }}
          className={`reality-node absolute transition-all duration-700 rounded-2xl p-6 md:p-8 flex flex-col shadow-2xl z-50 cursor-pointer
            ${isSimulated ? "bg-white border-2 border-orange-500 shadow-orange-100 hover:shadow-orange-200" : "bg-white border-2 border-slate-900 hover:shadow-slate-200"}`}
          style={{
            left: structure.root.x,
            top: structure.root.y,
            width: NODE_WIDTH,
            minHeight: NODE_HEIGHT,
          }}
        >
          <div className="flex justify-between items-start mb-4">
            <span
              className={`text-[9px] md:text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded flex items-center gap-2
              ${isSimulated ? "bg-orange-500 text-white" : "bg-slate-900 text-white"}`}
            >
              <TrendingUp size={12} /> Live State
            </span>
          </div>
          <h3 className="font-black text-slate-900 text-base md:text-lg leading-snug mb-3">
            {activeNode.title}
          </h3>
          <div className="space-y-1.5 mt-auto">
            {activeNode.facts?.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-[10px] md:text-[11px] text-slate-600 font-medium"
              >
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full shrink-0" />
                <span className="leading-tight">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* LAYER 2: OUTCOMES */}
        {structure.outcomes.map((out) => (
          <div
            key={out.id}
            onClick={() =>
              onSelectBranch(selectedOutcomeId === out.id ? null : out.id)
            }
            className={`reality-node absolute transition-all duration-400 cursor-pointer rounded-2xl p-5 md:p-7 flex flex-col border shadow-sm z-30
              ${out.is_high_prob ? "bg-white border-amber-500 border-2 shadow-xl ring-8 ring-amber-50" : "bg-white border-slate-200"}
              ${selectedNodeId === out.id ? "scale-105 border-indigo-500 ring-4 md:ring-10 ring-indigo-50" : "hover:border-slate-400"}`}
            style={{
              left: out.x,
              top: out.y,
              width: NODE_WIDTH,
              minHeight: NODE_HEIGHT - 20,
            }}
          >
            {selectedNodeId === out.id && (
              <span className="absolute -top-4 left-6 bg-indigo-600 text-white text-[9px] md:text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-2xl flex items-center gap-1.5 z-50">
                <Search size={12} /> Previewing
              </span>
            )}

            <div className="flex justify-between items-start mb-2">
              <h4 className="font-black text-slate-900 text-sm md:text-base leading-tight max-w-[75%]">
                {out.title}
              </h4>
              <div className="flex flex-col items-end">
                <span
                  className={`text-[11px] md:text-[13px] font-black ${out.is_high_prob ? "text-amber-600" : "text-slate-400"}`}
                >
                  {Math.round(out.prob * 100)}%
                </span>
                <span className="text-[7px] md:text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
                  Likeliness
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* LAYER 3: GHOST FUTURES */}
        {selectedOutcomeId &&
          (structure.ghosts as any)[selectedOutcomeId]?.map(
            (g: any, i: number) => (
              <div
                key={g.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(selectedNodeId === g.id ? null : g.id);
                }}
                className={`reality-node absolute bg-white border border-dashed transition-all duration-300 cursor-pointer rounded-2xl p-5 md:p-7 flex flex-col opacity-90 shadow-2xl animate-in zoom-in-95 duration-300 z-10
              ${selectedNodeId === g.id ? "border-indigo-500 ring-4 md:ring-10 ring-indigo-50 scale-105" : "border-indigo-200 hover:border-indigo-400"}`}
                style={{
                  left: isMobile
                    ? spacing + NODE_WIDTH + 200
                    : spacing + NODE_WIDTH + 400,
                  top:
                    structure.outcomes.find((o) => o.id === selectedOutcomeId)!
                      .y -
                    (isMobile ? 100 : 150) +
                    i * (isMobile ? 200 : 300),
                  width: isMobile ? 240 : 300,
                  minHeight: isMobile ? 100 : 130,
                }}
              >
                {selectedNodeId === g.id && (
                  <span className="absolute -top-4 left-6 bg-indigo-600 text-white text-[9px] md:text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-2xl flex items-center gap-1.5 z-50">
                    <Search size={12} /> Previewing
                  </span>
                )}
                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2 block">
                  Next Reality
                </span>
                <h5 className="font-black text-slate-900 text-sm md:text-base mb-2 leading-tight">
                  {g.title}
                </h5>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  {g.desc}
                </p>
              </div>
            ),
          )}
      </div>
    </div>
  );
};

export default RealityTree;
