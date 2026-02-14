module.exports = [
"[project]/components/RealityTree.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/search.js [ssr] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$history$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__History$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/history.js [ssr] (ecmascript) <export default as History>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trending-up.js [ssr] (ecmascript) <export default as TrendingUp>");
;
;
;
const RealityTree = ({ activeNode, selectedOutcomeId, selectedNodeId, onSelectBranch, onSelectNode, isSimulated })=>{
    const containerRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    const [offset, setOffset] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])({
        x: 0,
        y: 0
    });
    const [scale, setScale] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(0.8);
    const [isDragging, setIsDragging] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const dragStart = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])({
        x: 0,
        y: 0
    });
    const isMobile = ("TURBOPACK compile-time value", "undefined") !== "undefined" && window.innerWidth < 768;
    const NODE_WIDTH = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 280;
    const NODE_HEIGHT = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 130;
    const centerTree = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])(()=>{
        if (containerRef.current) {
            const { width, height } = containerRef.current.getBoundingClientRect();
            setOffset({
                x: width * 0.15,
                y: height / 2 - NODE_HEIGHT / 2
            });
        }
    }, [
        NODE_HEIGHT
    ]);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        centerTree();
        const observer = new ResizeObserver(()=>requestAnimationFrame(centerTree));
        if (containerRef.current) observer.observe(containerRef.current);
        return ()=>observer.disconnect();
    }, [
        centerTree
    ]);
    const nodes = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useMemo"])(()=>{
        const spacing = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 550;
        const baseNodes = [
            {
                id: "ROOT_INIT",
                title: "Customers complaining (tickets spiked)",
                isInitialRoot: true,
                x: isSimulated ? -spacing : 0,
                y: 0,
                type: isSimulated ? "past" : "live",
                facts: [
                    "Ticket count > 450/hr",
                    "APAC latency detected"
                ]
            },
            {
                id: "O1",
                title: "More failed checkouts",
                prob: 0.35,
                x: isSimulated ? 0 : spacing,
                y: isSimulated ? -250 : -300,
                type: isSimulated ? "past" : "outcome",
                opacity: isSimulated ? 0.3 : 1
            },
            {
                id: "O2",
                title: "Checkout errors rise",
                prob: 0.45,
                is_high_prob: true,
                x: isSimulated ? 0 : spacing,
                y: 0,
                type: isSimulated ? "live" : "outcome",
                facts: isSimulated ? [
                    "Error rate increased to 2.4%",
                    "Stripe API returning 403s"
                ] : []
            },
            {
                id: "O3",
                title: "Partner traffic quality drops",
                prob: 0.15,
                x: isSimulated ? 0 : spacing,
                y: isSimulated ? 250 : 300,
                type: isSimulated ? "past" : "outcome",
                opacity: isSimulated ? 0.3 : 1
            },
            {
                id: "O4",
                title: "Stabilizes (no worsening)",
                prob: 0.05,
                x: isSimulated ? 0 : spacing,
                y: isSimulated ? 500 : 600,
                type: isSimulated ? "past" : "outcome",
                opacity: isSimulated ? 0.3 : 1
            }
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
                type: "outcome"
            },
            {
                id: "O2B",
                parentId: "O2",
                title: "Refunds increase",
                prob: 0.25,
                x: spacing,
                y: 100,
                type: "outcome"
            },
            {
                id: "O2C",
                parentId: "O2",
                title: "Stabilizes after rollback",
                prob: 0.2,
                x: spacing,
                y: 400,
                type: "outcome"
            }
        ];
        return [
            ...baseNodes,
            ...simulatedOutcomes.map((o)=>({
                    ...o,
                    x: isSimulated ? o.x : spacing,
                    y: isSimulated ? o.y : 0,
                    opacity: isSimulated ? 1 : 0,
                    scale: isSimulated ? 1 : 0.5
                }))
        ];
    }, [
        isMobile,
        isSimulated
    ]);
    const ghosts = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useMemo"])(()=>{
        const gMap = {
            O1: [
                {
                    id: "G1A",
                    title: "Provider alert triggers",
                    desc: "Critical infrastructure failure suspected.",
                    prob: 0.65
                },
                {
                    id: "G1B",
                    title: "Cart abandonment up",
                    desc: "Direct revenue loss due to flow disruption.",
                    prob: 0.35
                }
            ],
            O2: isSimulated ? [] : [
                {
                    id: "G2A",
                    title: "Revenue drops today",
                    desc: "Projected -12% delta based on latency.",
                    prob: 0.75
                },
                {
                    id: "G2B",
                    title: "Refunds increase",
                    desc: "Expect spike in ticket volume.",
                    prob: 0.25
                },
                {
                    id: "G2C",
                    title: "Stabilizes after rollback",
                    desc: "Verify fix success & document root cause.",
                    prob: 0.05
                }
            ],
            O3: [
                {
                    id: "G3A",
                    title: "Partner Y attrition",
                    desc: "Cohort-specific attrition confirmed.",
                    prob: 0.8
                },
                {
                    id: "G3B",
                    title: "Scam complaints",
                    desc: "Brand reputation risk if ads remain misaligned.",
                    prob: 0.2
                }
            ],
            O4: [
                {
                    id: "G4A",
                    title: "Volume recovers",
                    desc: "Temporary glitch resolved; baseline stable.",
                    prob: 0.9
                },
                {
                    id: "G4B",
                    title: "Conversion recovers",
                    desc: "Users successfully completing flows.",
                    prob: 0.1
                }
            ],
            O2A: [
                {
                    id: "G2AA",
                    title: "Manual override triggered",
                    desc: "Systems rerouting to secondary region.",
                    prob: 0.6
                },
                {
                    id: "G2AB",
                    title: "Shareholder impact",
                    desc: "Public disclosure required for significant delta.",
                    prob: 0.4
                }
            ],
            O2B: [
                {
                    id: "G2BA",
                    title: "Trust deficit",
                    desc: "Long term churn for affected APAC cohort.",
                    prob: 0.85
                },
                {
                    id: "G2BB",
                    title: "Competitor Migration",
                    desc: "Users switching to alternative platforms during downtime.",
                    prob: 0.15
                }
            ],
            O2C: [
                {
                    id: "G2CA",
                    title: "Full System Audit",
                    desc: "Verifying root cause across all clusters.",
                    prob: 0.55
                },
                {
                    id: "G2CB",
                    title: "Baseline Restored",
                    desc: "Conversion rates returning to pre-incident levels.",
                    prob: 0.45
                }
            ]
        };
        return gMap;
    }, [
        isSimulated
    ]);
    const handleMouseDown = (e)=>{
        if (e.target.closest(".reality-node")) return;
        setIsDragging(true);
        dragStart.current = {
            x: e.clientX - offset.x,
            y: e.clientY - offset.y
        };
    };
    const handleMouseMove = (e)=>{
        if (!isDragging) return;
        setOffset({
            x: e.clientX - dragStart.current.x,
            y: e.clientY - dragStart.current.y
        });
    };
    const ghostXDest = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : (("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 550) + NODE_WIDTH + 350;
    const renderPaths = ()=>{
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
            children: [
                nodes.filter((n)=>[
                        "O1",
                        "O2",
                        "O3",
                        "O4"
                    ].includes(n.id)).map((n)=>{
                    const root = nodes.find((r)=>r.id === "ROOT_INIT");
                    const startX = root.x + NODE_WIDTH;
                    const startY = root.y + NODE_HEIGHT / 2;
                    const endX = n.x;
                    const endY = n.y + NODE_HEIGHT / 2;
                    const isActive = n.id === "O2";
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                        d: `M ${startX} ${startY} C ${startX + 150} ${startY}, ${endX - 150} ${endY}, ${endX} ${endY}`,
                        className: `fill-none transition-all duration-700 ${isActive ? "stroke-amber-500 stroke-[4] animate-dash" : "stroke-slate-200 stroke-[2]"} ${n.opacity === 0 ? "opacity-0" : "opacity-100"}`,
                        style: {
                            strokeDasharray: isActive ? "4 4" : "6 4"
                        }
                    }, `p-root-${n.id}`, false, {
                        fileName: "[project]/components/RealityTree.tsx",
                        lineNumber: 300,
                        columnNumber: 15
                    }, ("TURBOPACK compile-time value", void 0));
                }),
                nodes.filter((n)=>n.parentId === "O2").map((n)=>{
                    const parent = nodes.find((p)=>p.id === "O2");
                    const startX = parent.x + NODE_WIDTH;
                    const startY = parent.y + NODE_HEIGHT / 2;
                    const endX = n.x;
                    const endY = n.y + NODE_HEIGHT / 2;
                    const isActive = n.is_high_prob;
                    const nodeOpacity = n.opacity ?? 1;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                        d: `M ${startX} ${startY} C ${startX + 150} ${startY}, ${endX - 150} ${endY}, ${endX} ${endY}`,
                        className: `fill-none transition-all duration-700 ${isActive ? "stroke-amber-500 stroke-[4] animate-dash" : "stroke-slate-200 stroke-[2]"} ${nodeOpacity === 0 ? "opacity-0" : "opacity-100"}`,
                        style: {
                            strokeDasharray: isActive ? "4 4" : "6 4"
                        }
                    }, `p-o2-${n.id}`, false, {
                        fileName: "[project]/components/RealityTree.tsx",
                        lineNumber: 321,
                        columnNumber: 15
                    }, ("TURBOPACK compile-time value", void 0));
                }),
                Object.entries(ghosts).map(([parentId, gs])=>{
                    const parent = nodes.find((o)=>o.id === parentId);
                    if (!parent) return null;
                    const startX = parent.x + NODE_WIDTH;
                    const startY = parent.y + NODE_HEIGHT / 2;
                    const isExpanded = selectedOutcomeId === parentId;
                    return gs.map((g, i)=>{
                        const destY = parent.y - (("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 120) + i * (("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 250) + NODE_HEIGHT / 2;
                        const endX = isExpanded ? ghostXDest : startX;
                        const endY = isExpanded ? destY : startY;
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                            d: `M ${startX} ${startY} C ${startX + 100} ${startY}, ${endX - 100} ${endY}, ${endX} ${endY}`,
                            className: `fill-none transition-all duration-500 ease-in-out ${isExpanded ? "stroke-indigo-400 stroke-[2] opacity-100" : "stroke-indigo-200 stroke-[1] opacity-0"}`,
                            style: {
                                strokeDasharray: "4,4"
                            }
                        }, `p-ghost-${g.id}`, false, {
                            fileName: "[project]/components/RealityTree.tsx",
                            lineNumber: 348,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0));
                    });
                })
            ]
        }, void 0, true);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        ref: containerRef,
        className: "w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden",
        onMouseDown: handleMouseDown,
        onMouseMove: handleMouseMove,
        onMouseUp: ()=>setIsDragging(false),
        onWheel: (e)=>setScale((prev)=>Math.min(Math.max(0.4, prev + e.deltaY * -0.001), 1.5)),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            className: "absolute inset-0 transition-transform duration-75 ease-out origin-center",
            style: {
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                    className: "absolute inset-0 w-[5000px] h-[5000px] pointer-events-none overflow-visible",
                    children: renderPaths()
                }, void 0, false, {
                    fileName: "[project]/components/RealityTree.tsx",
                    lineNumber: 380,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                nodes.map((n)=>{
                    const isSelected = selectedNodeId === n.id;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        onClick: ()=>{
                            if (n.type === "live" || n.type === "past") {
                                onSelectBranch(null);
                                onSelectNode(null);
                            } else {
                                onSelectBranch(selectedOutcomeId === n.id ? null : n.id);
                            }
                        },
                        className: `reality-node absolute transition-all duration-700 ease-in-out flex flex-col shadow-2xl z-50 rounded-2xl
                ${n.type === "live" ? isSimulated ? "bg-white border-2 border-orange-500 shadow-orange-200 ring-8 ring-orange-100" : "bg-white border-2 border-slate-900 shadow-slate-200" : ""}
                ${n.type === "past" ? "bg-slate-50 border border-slate-200 opacity-60 grayscale shadow-none rounded-xl" : ""}
                ${n.type === "outcome" ? "bg-white border shadow-md rounded-2xl " + (n.is_high_prob ? "border-amber-500 border-2 shadow-amber-100 ring-8 ring-amber-50" : "border-slate-200") : ""}
                ${isSelected ? "scale-105 border-indigo-500 ring-10 ring-indigo-50 shadow-indigo-100" : ""}
                ${n.type === "outcome" || n.type === "live" ? "cursor-pointer hover:shadow-xl" : "cursor-pointer"}
              `,
                        style: {
                            left: n.x,
                            top: n.y,
                            width: NODE_WIDTH,
                            minHeight: n.type === "past" ? 80 : NODE_HEIGHT,
                            opacity: n.opacity ?? 1,
                            transform: `scale(${n.scale ?? 1})`,
                            zIndex: isSelected ? 100 : n.type === "live" ? 80 : 50
                        },
                        children: [
                            isSelected && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                className: "absolute -top-4 left-6 bg-indigo-600 text-white text-[9px] md:text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-2xl flex items-center gap-1.5 z-50",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                        size: 12
                                    }, void 0, false, {
                                        fileName: "[project]/components/RealityTree.tsx",
                                        lineNumber: 417,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    " Previewing"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/RealityTree.tsx",
                                lineNumber: 416,
                                columnNumber: 17
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: `flex justify-between items-start mb-2 pb-0 ${n.type === "live" ? "p-6 md:p-8" : "p-5 md:p-7"}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "flex flex-col gap-2",
                                        children: [
                                            n.type === "live" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                className: `text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md flex items-center gap-1.5 w-fit
                            ${isSimulated ? "bg-orange-500 text-white shadow-lg shadow-orange-200" : "bg-slate-900 text-white"}`,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                                                        size: 10
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/RealityTree.tsx",
                                                        lineNumber: 430,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    " Live State"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/RealityTree.tsx",
                                                lineNumber: 426,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            n.type === "past" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                className: "text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md flex items-center gap-1 w-fit bg-slate-200 text-slate-500",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$history$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__History$3e$__["History"], {
                                                        size: 10
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/RealityTree.tsx",
                                                        lineNumber: 435,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    " Past State"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/RealityTree.tsx",
                                                lineNumber: 434,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                                className: `font-black leading-tight tracking-tight ${n.type === "past" ? "text-slate-400 text-sm md:text-base" : "text-slate-900 text-base md:text-xl"}`,
                                                children: n.title
                                            }, void 0, false, {
                                                fileName: "[project]/components/RealityTree.tsx",
                                                lineNumber: 438,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/RealityTree.tsx",
                                        lineNumber: 424,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    n.type === "outcome" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "flex flex-col items-end",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                className: `text-[11px] md:text-[14px] font-black ${n.is_high_prob ? "text-amber-600" : "text-slate-400"}`,
                                                children: [
                                                    Math.round(n.prob * 100),
                                                    "%"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/RealityTree.tsx",
                                                lineNumber: 447,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                className: "text-[7px] md:text-[8px] font-bold text-slate-300 uppercase tracking-tighter",
                                                children: "Likeliness"
                                            }, void 0, false, {
                                                fileName: "[project]/components/RealityTree.tsx",
                                                lineNumber: 452,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/RealityTree.tsx",
                                        lineNumber: 446,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/RealityTree.tsx",
                                lineNumber: 421,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            n.facts && n.facts.length > 0 && n.type === "live" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: `pt-1 space-y-1.5 mb-6 ${n.type === "live" ? "px-6 md:px-8" : "px-5 md:px-7"}`,
                                children: n.facts.map((f, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2.5 text-[10px] md:text-[11px] text-slate-500 font-bold",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "w-1.5 h-1.5 bg-slate-300 rounded-full shrink-0"
                                            }, void 0, false, {
                                                fileName: "[project]/components/RealityTree.tsx",
                                                lineNumber: 468,
                                                columnNumber: 23
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                className: "leading-tight opacity-70",
                                                children: f
                                            }, void 0, false, {
                                                fileName: "[project]/components/RealityTree.tsx",
                                                lineNumber: 469,
                                                columnNumber: 23
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, i, true, {
                                        fileName: "[project]/components/RealityTree.tsx",
                                        lineNumber: 464,
                                        columnNumber: 21
                                    }, ("TURBOPACK compile-time value", void 0)))
                            }, void 0, false, {
                                fileName: "[project]/components/RealityTree.tsx",
                                lineNumber: 460,
                                columnNumber: 17
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, n.id, true, {
                        fileName: "[project]/components/RealityTree.tsx",
                        lineNumber: 388,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0));
                }),
                Object.entries(ghosts).map(([parentId, gs])=>{
                    const parent = nodes.find((o)=>o.id === parentId);
                    if (!parent) return null;
                    const isExpanded = selectedOutcomeId === parentId;
                    return gs.map((g, i)=>{
                        const destY = parent.y - (("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 120) + i * (("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 250);
                        const x = isExpanded ? ghostXDest : parent.x;
                        const y = isExpanded ? destY : parent.y;
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            onClick: (e)=>{
                                e.stopPropagation();
                                onSelectNode(selectedNodeId === g.id ? null : g.id);
                            },
                            className: `reality-node absolute bg-white border border-dashed transition-all duration-500 ease-in-out cursor-pointer rounded-2xl p-5 md:p-7 flex flex-col shadow-2xl z-10
                  ${isExpanded ? "opacity-95 scale-100 pointer-events-auto" : "opacity-0 scale-50 pointer-events-none"}
                  ${selectedNodeId === g.id ? "border-indigo-500 ring-4 md:ring-10 ring-indigo-50 scale-105" : "border-indigo-200 hover:border-indigo-400"}`,
                            style: {
                                left: x,
                                top: y,
                                width: ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 300,
                                minHeight: ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 130,
                                transitionDelay: isExpanded ? `${i * 100}ms` : "0ms"
                            },
                            children: [
                                selectedNodeId === g.id && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                    className: "absolute -top-4 left-6 bg-indigo-600 text-white text-[9px] md:text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-2xl flex items-center gap-1.5 z-50",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                            size: 12
                                        }, void 0, false, {
                                            fileName: "[project]/components/RealityTree.tsx",
                                            lineNumber: 509,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        " Previewing"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/RealityTree.tsx",
                                    lineNumber: 508,
                                    columnNumber: 19
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "flex justify-between items-start mb-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                            className: "text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] block",
                                            children: "Next Reality"
                                        }, void 0, false, {
                                            fileName: "[project]/components/RealityTree.tsx",
                                            lineNumber: 513,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        g.prob !== undefined && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "flex flex-col items-end -mt-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                    className: "text-[12px] md:text-[14px] font-black text-indigo-600",
                                                    children: [
                                                        Math.round(g.prob * 100),
                                                        "%"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/components/RealityTree.tsx",
                                                    lineNumber: 518,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                    className: "text-[7px] md:text-[8px] font-bold text-slate-300 uppercase tracking-tighter",
                                                    children: "Likeliness"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/RealityTree.tsx",
                                                    lineNumber: 521,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/RealityTree.tsx",
                                            lineNumber: 517,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/RealityTree.tsx",
                                    lineNumber: 512,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h5", {
                                    className: "font-black text-slate-900 text-sm md:text-base mb-2 leading-tight",
                                    children: g.title
                                }, void 0, false, {
                                    fileName: "[project]/components/RealityTree.tsx",
                                    lineNumber: 527,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                    className: "text-[11px] text-slate-500 leading-relaxed font-medium",
                                    children: g.desc
                                }, void 0, false, {
                                    fileName: "[project]/components/RealityTree.tsx",
                                    lineNumber: 530,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, g.id, true, {
                            fileName: "[project]/components/RealityTree.tsx",
                            lineNumber: 490,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0));
                    });
                })
            ]
        }, void 0, true, {
            fileName: "[project]/components/RealityTree.tsx",
            lineNumber: 374,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/RealityTree.tsx",
        lineNumber: 362,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const __TURBOPACK__default__export__ = RealityTree;
}),
"[project]/components/DecisionPanel.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield-check.js [ssr] (ecmascript) <export default as ShieldCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/zap.js [ssr] (ecmascript) <export default as Zap>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [ssr] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$grip$2d$vertical$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__GripVertical$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/grip-vertical.js [ssr] (ecmascript) <export default as GripVertical>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-check.js [ssr] (ecmascript) <export default as CheckCircle2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$alert$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldAlert$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield-alert.js [ssr] (ecmascript) <export default as ShieldAlert>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/eye.js [ssr] (ecmascript) <export default as Eye>");
;
;
;
const DecisionPanel = ({ node, scenarioId, onClose })=>{
    const isScenario = !!scenarioId;
    const isSimulated = node.id === "S2";
    const [width, setWidth] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(440);
    const isResizing = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(false);
    const MIN_WIDTH = 320;
    const MAX_WIDTH = 700;
    const handleMouseMove = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])((e)=>{
        if (!isResizing.current) return;
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
            setWidth(newWidth);
        }
    }, []);
    const stopResizing = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])(()=>{
        isResizing.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", stopResizing);
        document.body.style.cursor = "default";
    }, [
        handleMouseMove
    ]);
    const startResizing = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])((e)=>{
        isResizing.current = true;
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", stopResizing);
        document.body.style.cursor = "col-resize";
    }, [
        handleMouseMove,
        stopResizing
    ]);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        return ()=>{
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", stopResizing);
        };
    }, [
        handleMouseMove,
        stopResizing
    ]);
    const panelStyle = {
        width: ("TURBOPACK compile-time value", "undefined") !== "undefined" && window.innerWidth >= 768 ? "TURBOPACK unreachable" : "100%"
    };
    // Content for S2 simulated state
    const simulatedContent = {
        safeProtocols: [
            {
                title: "Enable rollback readiness",
                desc: "Prepare version 1.4.2 deployment candidates."
            },
            {
                title: "Status page banner",
                desc: "Inform users of potential checkout disruption in APAC."
            }
        ],
        conditional: {
            title: "If errors continue 15 min → rollback",
            desc: "Automatic trigger if error rate stays above 2.0% until 01:25 AM."
        }
    };
    // Enriched Scenario Content Mapping
    const scenarioDetails = {
        O1: {
            watchingNext: "Payment Gateway Latency",
            recommendation: {
                type: "mitigate",
                text: "Prepare emergency failover to Stripe B"
            },
            beliefDist: [
                {
                    label: "Provider alert",
                    val: 65
                },
                {
                    label: "Cart abandonment",
                    val: 35
                }
            ],
            safeProtocols: [
                {
                    title: "Gateway Warm-up",
                    desc: "Keep standby provider session active to reduce switchover latency."
                },
                {
                    title: "Throttle Non-Essential API",
                    desc: "Prioritize checkout bandwidth over analytics pings."
                }
            ]
        },
        O2: {
            watchingNext: "APAC Telemetry Breach",
            recommendation: {
                type: "mitigate",
                text: "Auto-trigger status page banner & rollback readiness"
            },
            beliefDist: [
                {
                    label: "Revenue drop",
                    val: 75
                },
                {
                    label: "Refund spike",
                    val: 25
                }
            ],
            safeProtocols: [
                {
                    title: "Status Page Automation",
                    desc: "Draft localized incidence report for APAC stakeholders."
                },
                {
                    title: "Regional CDN Flush",
                    desc: "Clear APAC edge cache to ensure latest recovery config propagates."
                }
            ]
        },
        O3: {
            watchingNext: "Referral Conversion Rate",
            recommendation: {
                type: "mitigate",
                text: "Pause APAC marketing campaigns"
            },
            beliefDist: [
                {
                    label: "Partner attrition",
                    val: 80
                },
                {
                    label: "Scam alerts",
                    val: 20
                }
            ],
            safeProtocols: [
                {
                    title: "Marketing Spend Halt",
                    desc: "Instantly pause programmatic ads in high-latency regions."
                },
                {
                    title: "Fraud Engine Boost",
                    desc: "Increase sensitivity for referrals originating from affected partners."
                }
            ]
        },
        O4: {
            watchingNext: "Ticket Arrival Rate",
            recommendation: {
                type: "support",
                text: "Confirm baseline stability & close monitoring"
            },
            beliefDist: [
                {
                    label: "Volume recovery",
                    val: 90
                },
                {
                    label: "Conversion recovery",
                    val: 10
                }
            ],
            safeProtocols: [
                {
                    title: "Baseline Verification",
                    desc: "Compare last 5 mins with 24h rolling average."
                },
                {
                    title: "Support Backlog Pulse",
                    desc: "Coordinate with CS team to verify actual customer success."
                }
            ]
        },
        O2A: {
            watchingNext: "Hourly Revenue Delta",
            recommendation: {
                type: "mitigate",
                text: "Immediate CEO-level financial brief"
            },
            beliefDist: [
                {
                    label: "Manual override",
                    val: 60
                },
                {
                    label: "Shareholder impact",
                    val: 40
                }
            ],
            safeProtocols: [
                {
                    title: "Revenue Leak Alert",
                    desc: "Notify finance of projected $12k/hr delta in APAC."
                },
                {
                    title: "Investor Comms Draft",
                    desc: "Prepare internal memo regarding Q1 performance variance."
                }
            ]
        },
        O2B: {
            watchingNext: "CS Ticket Volume",
            recommendation: {
                type: "mitigate",
                text: "Scale APAC support staff"
            },
            beliefDist: [
                {
                    label: "Trust deficit",
                    val: 100
                }
            ],
            safeProtocols: [
                {
                    title: "Staff Surge Trigger",
                    desc: "Onboard overflow support vendor for APAC complaints."
                },
                {
                    title: "Auto-Refund Protocol",
                    desc: "Enable 1-click compensation for orders stuck in 'pending'."
                }
            ]
        },
        O2C: {
            watchingNext: "Post-Deploy Latency",
            recommendation: {
                type: "support",
                text: "Verify fix success & document root cause"
            },
            beliefDist: [
                {
                    label: "System health 100%",
                    val: 100
                }
            ],
            safeProtocols: [
                {
                    title: "Health Check Probe",
                    desc: "Run synthetic transactions across all APAC edge regions."
                },
                {
                    title: "Post-Mortem Init",
                    desc: "Schedule engineering review for incident INC-492."
                }
            ]
        },
        // Adding Layer 3 ghosts for complete coverage
        G1A: {
            watchingNext: "Provider API Status",
            recommendation: {
                type: "mitigate",
                text: "Switch to secondary region immediately"
            },
            beliefDist: [
                {
                    label: "Infra saturation",
                    val: 100
                }
            ],
            safeProtocols: [
                {
                    title: "Region Evacuation",
                    desc: "Route all requests away from failing cluster."
                }
            ]
        },
        G1B: {
            watchingNext: "Checkout Abandonment Rate",
            recommendation: {
                type: "mitigate",
                text: "Trigger 'Wait' message to users"
            },
            beliefDist: [
                {
                    label: "Revenue loss",
                    val: 100
                }
            ],
            safeProtocols: [
                {
                    title: "User Flow Buffer",
                    desc: "Insert artificial delay to prevent rate limiting."
                }
            ]
        },
        G2A: {
            watchingNext: "Gross Merchandise Value",
            recommendation: {
                type: "mitigate",
                text: "Apply emergency discounting for parity"
            },
            beliefDist: [
                {
                    label: "Quarterly Target",
                    val: 100
                }
            ],
            safeProtocols: [
                {
                    title: "GMV recovery",
                    desc: "Push targeted promocodes to affected users."
                }
            ]
        },
        G2B: {
            watchingNext: "Refund Count",
            recommendation: {
                type: "mitigate",
                text: "Automate dispute resolution"
            },
            beliefDist: [
                {
                    label: "Brand Equity",
                    val: 100
                }
            ],
            safeProtocols: [
                {
                    title: "Dispute suppression",
                    desc: "Proactively refund small transactions."
                }
            ]
        }
    };
    const currentScenario = scenarioId ? scenarioDetails[scenarioId] : null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("aside", {
        style: panelStyle,
        className: "h-full bg-white border-l border-slate-200 flex flex-col shadow-2xl z-[120] animate-in slide-in-from-bottom md:slide-in-from-right duration-500 fixed md:relative bottom-0 right-0 max-h-[70vh] md:max-h-full rounded-t-3xl md:rounded-none transition-[width] duration-75 ease-out",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                onMouseDown: startResizing,
                className: "hidden md:flex absolute left-0 top-0 bottom-0 w-1 hover:w-2 hover:bg-indigo-500/30 cursor-col-resize items-center justify-center group transition-all z-[80]",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "opacity-0 group-hover:opacity-100 transition-opacity",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$grip$2d$vertical$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__GripVertical$3e$__["GripVertical"], {
                        size: 16,
                        className: "text-indigo-400"
                    }, void 0, false, {
                        fileName: "[project]/components/DecisionPanel.tsx",
                        lineNumber: 303,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/components/DecisionPanel.tsx",
                    lineNumber: 302,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/components/DecisionPanel.tsx",
                lineNumber: 298,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: `p-6 md:p-8 border-b transition-colors duration-500 shrink-0 ${isScenario ? "bg-indigo-50 border-indigo-100" : "bg-slate-50/50 border-slate-100"}`,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "flex justify-between items-start",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "space-y-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                                    className: `text-[10px] font-black uppercase tracking-[0.2em] ${isScenario ? "text-indigo-600" : "text-slate-400"}`,
                                    children: isScenario ? `If Branch confirms next...` : "Recommended Actions"
                                }, void 0, false, {
                                    fileName: "[project]/components/DecisionPanel.tsx",
                                    lineNumber: 313,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "text-base md:text-lg font-black text-slate-800 flex items-center gap-2",
                                    children: [
                                        isScenario ? "Scenario-Specific Protocol" : "Live Decision Protocol",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: `w-2 h-2 rounded-full ${isScenario ? "bg-indigo-500" : "bg-slate-900"}`
                                        }, void 0, false, {
                                            fileName: "[project]/components/DecisionPanel.tsx",
                                            lineNumber: 324,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/DecisionPanel.tsx",
                                    lineNumber: 320,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/DecisionPanel.tsx",
                            lineNumber: 312,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        onClose && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: "p-2 -mr-2 text-slate-400 hover:text-black transition-colors",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                size: 20
                            }, void 0, false, {
                                fileName: "[project]/components/DecisionPanel.tsx",
                                lineNumber: 334,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/components/DecisionPanel.tsx",
                            lineNumber: 330,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/DecisionPanel.tsx",
                    lineNumber: 311,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/components/DecisionPanel.tsx",
                lineNumber: 308,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "flex-1 overflow-y-auto p-6 md:p-8 space-y-10 md:space-y-12 scrollbar-hide",
                children: currentScenario ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "space-y-8 animate-in fade-in slide-in-from-top-2 duration-500",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "p-4 bg-indigo-900 rounded-xl text-white flex items-center justify-between shadow-lg",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "p-2 bg-indigo-800 rounded-lg",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__["Eye"], {
                                                size: 18,
                                                className: "text-indigo-300"
                                            }, void 0, false, {
                                                fileName: "[project]/components/DecisionPanel.tsx",
                                                lineNumber: 347,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/components/DecisionPanel.tsx",
                                            lineNumber: 346,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                    className: "text-[9px] font-black uppercase tracking-widest text-indigo-400",
                                                    children: "Watching Next"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/DecisionPanel.tsx",
                                                    lineNumber: 350,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                    className: "text-sm font-black tracking-tight",
                                                    children: currentScenario.watchingNext
                                                }, void 0, false, {
                                                    fileName: "[project]/components/DecisionPanel.tsx",
                                                    lineNumber: 353,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/DecisionPanel.tsx",
                                            lineNumber: 349,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/DecisionPanel.tsx",
                                    lineNumber: 345,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "w-2 h-2 rounded-full bg-indigo-400 animate-pulse"
                                }, void 0, false, {
                                    fileName: "[project]/components/DecisionPanel.tsx",
                                    lineNumber: 358,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/DecisionPanel.tsx",
                            lineNumber: 344,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "space-y-5",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2 text-slate-500",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__["CheckCircle2"], {
                                            size: 14
                                        }, void 0, false, {
                                            fileName: "[project]/components/DecisionPanel.tsx",
                                            lineNumber: 364,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                            className: "text-[10px] font-black uppercase tracking-widest",
                                            children: "Actionable Recommendation"
                                        }, void 0, false, {
                                            fileName: "[project]/components/DecisionPanel.tsx",
                                            lineNumber: 365,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/DecisionPanel.tsx",
                                    lineNumber: 363,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: `p-5 rounded-xl border-l-4 shadow-sm flex flex-col gap-2 ${currentScenario.recommendation.type === "support" ? "bg-emerald-50 border-emerald-200 border-l-emerald-600" : "bg-rose-50 border-rose-200 border-l-rose-600"}`,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-2",
                                            children: [
                                                currentScenario.recommendation.type === "support" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__["CheckCircle2"], {
                                                    size: 16,
                                                    className: "text-emerald-600"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/DecisionPanel.tsx",
                                                    lineNumber: 374,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$alert$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldAlert$3e$__["ShieldAlert"], {
                                                    size: 16,
                                                    className: "text-rose-600"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/DecisionPanel.tsx",
                                                    lineNumber: 376,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                    className: `text-[10px] font-black uppercase tracking-wider ${currentScenario.recommendation.type === "support" ? "text-emerald-700" : "text-rose-700"}`,
                                                    children: currentScenario.recommendation.type === "support" ? "Strategic Support" : "Mitigation Protocol"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/DecisionPanel.tsx",
                                                    lineNumber: 378,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/DecisionPanel.tsx",
                                            lineNumber: 372,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                            className: "text-[13px] font-bold text-slate-800 leading-tight",
                                            children: currentScenario.recommendation.text
                                        }, void 0, false, {
                                            fileName: "[project]/components/DecisionPanel.tsx",
                                            lineNumber: 386,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/DecisionPanel.tsx",
                                    lineNumber: 369,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/DecisionPanel.tsx",
                            lineNumber: 362,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "space-y-4 md:space-y-5",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2 text-emerald-600",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$check$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldCheck$3e$__["ShieldCheck"], {
                                            size: 16
                                        }, void 0, false, {
                                            fileName: "[project]/components/DecisionPanel.tsx",
                                            lineNumber: 395,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                            className: "text-[10px] font-black uppercase tracking-widest",
                                            children: "Branch-Specific Guardrails"
                                        }, void 0, false, {
                                            fileName: "[project]/components/DecisionPanel.tsx",
                                            lineNumber: 396,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/DecisionPanel.tsx",
                                    lineNumber: 394,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "space-y-3",
                                    children: currentScenario.safeProtocols.map((protocol, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "group relative bg-white rounded-xl border border-slate-100 p-4 md:p-5 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-xl"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/DecisionPanel.tsx",
                                                    lineNumber: 406,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                                    className: "font-bold text-xs text-slate-800 mb-1",
                                                    children: protocol.title
                                                }, void 0, false, {
                                                    fileName: "[project]/components/DecisionPanel.tsx",
                                                    lineNumber: 407,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                    className: "text-[10px] md:text-[11px] text-slate-400 leading-relaxed italic",
                                                    children: protocol.desc
                                                }, void 0, false, {
                                                    fileName: "[project]/components/DecisionPanel.tsx",
                                                    lineNumber: 410,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, i, true, {
                                            fileName: "[project]/components/DecisionPanel.tsx",
                                            lineNumber: 402,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)))
                                }, void 0, false, {
                                    fileName: "[project]/components/DecisionPanel.tsx",
                                    lineNumber: 400,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/DecisionPanel.tsx",
                            lineNumber: 393,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/DecisionPanel.tsx",
                    lineNumber: 342,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40 py-20",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__["Zap"], {
                            size: 32,
                            className: "text-slate-300"
                        }, void 0, false, {
                            fileName: "[project]/components/DecisionPanel.tsx",
                            lineNumber: 420,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "space-y-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                    className: "text-xs font-black uppercase tracking-widest text-slate-400",
                                    children: "Live State Active"
                                }, void 0, false, {
                                    fileName: "[project]/components/DecisionPanel.tsx",
                                    lineNumber: 422,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                    className: "text-[10px] font-medium text-slate-400 max-w-[200px]",
                                    children: "Intelligence logs only available for predicted reality branches."
                                }, void 0, false, {
                                    fileName: "[project]/components/DecisionPanel.tsx",
                                    lineNumber: 425,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/DecisionPanel.tsx",
                            lineNumber: 421,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/DecisionPanel.tsx",
                    lineNumber: 419,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/components/DecisionPanel.tsx",
                lineNumber: 340,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/components/DecisionPanel.tsx",
        lineNumber: 293,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const __TURBOPACK__default__export__ = DecisionPanel;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/react-dom [external] (react-dom, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("react-dom", () => require("react-dom"));

module.exports = mod;
}),
"[project]/components/Header.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$command$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Command$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/command.js [ssr] (ecmascript) <export default as Command>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/link.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/router.js [ssr] (ecmascript)");
;
;
;
;
const Header = ()=>{
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const currentPath = router.pathname;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("header", {
        className: "absolute top-8 left-1/2 -translate-x-1/2 z-[100] h-20 flex items-center",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            className: " flex items-center  bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-full  shadow-[0_15px_45px_rgba(0,0,0,0.08)] px-8 py-4 hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] transition-all duration-300 whitespace-nowrap h-[72px] gap-8 ",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                    href: "/",
                    className: "flex items-center gap-4 pr-8 border-r border-slate-100 group/brand",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-xl group-hover/brand:scale-105 transition-transform shrink-0",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$command$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Command$3e$__["Command"], {
                                size: 18
                            }, void 0, false, {
                                fileName: "[project]/components/Header.tsx",
                                lineNumber: 33,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/components/Header.tsx",
                            lineNumber: 32,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                            className: "font-extrabold tracking-tighter text-2xl text-slate-900 font-sans",
                            children: "TRUMAN"
                        }, void 0, false, {
                            fileName: "[project]/components/Header.tsx",
                            lineNumber: 35,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/Header.tsx",
                    lineNumber: 28,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("nav", {
                    className: "flex items-center gap-8",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                            href: "/dashboard",
                            className: `text-[11px] font-black uppercase tracking-[0.2em] transition-colors hover:text-slate-900 
              ${currentPath === "/dashboard" ? "text-slate-900" : "text-slate-400"}`,
                            children: "Dashboard"
                        }, void 0, false, {
                            fileName: "[project]/components/Header.tsx",
                            lineNumber: 42,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                            href: "/simulation",
                            className: `text-[11px] font-black uppercase tracking-[0.2em] transition-colors hover:text-slate-900 
              ${currentPath === "/simulation" ? "text-slate-900" : "text-slate-400"}`,
                            children: "Reality Tree"
                        }, void 0, false, {
                            fileName: "[project]/components/Header.tsx",
                            lineNumber: 49,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/Header.tsx",
                    lineNumber: 41,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/components/Header.tsx",
            lineNumber: 12,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/Header.tsx",
        lineNumber: 11,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const __TURBOPACK__default__export__ = Header;
}),
"[project]/pages/simulation.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SimulationPage
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$head$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/head.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$RealityTree$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/RealityTree.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$DecisionPanel$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/DecisionPanel.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Header$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/Header.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$panel$2d$right$2d$open$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__PanelRightOpen$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/panel-right-open.js [ssr] (ecmascript) <export default as PanelRightOpen>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/database.js [ssr] (ecmascript) <export default as Database>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/play.js [ssr] (ecmascript) <export default as Play>");
;
;
;
;
;
;
;
function SimulationPage() {
    const [expandedBranchId, setExpandedBranchId] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [selectedNodeId, setSelectedNodeId] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [isPanelOpen, setIsPanelOpen] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [isSimulated, setIsSimulated] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [toast, setToast] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const triggerSimulation = ()=>{
        setToast({
            title: "New evidence received",
            msg: "APAC checkout error rate increased (0.3% → 2.1%)"
        });
        setTimeout(()=>{
            setIsSimulated(true);
            setExpandedBranchId(null);
            setSelectedNodeId(null);
        }, 1500);
        setTimeout(()=>setToast(null), 6000);
    };
    const activeNode = isSimulated ? {
        id: "S2",
        type: "present",
        title: "Checkout errors are rising",
        metric: "Confirmed via APAC Telemetry • Just now",
        status: "LIVE",
        facts: [
            "APAC checkout error rate: 2.1% (was 0.3%)",
            "P95 checkout latency: 1.9s (was 0.8s)"
        ],
        beliefs: [
            {
                label: "Likelihood: Recent deploy caused regression",
                val: 70
            },
            {
                label: "Likelihood: Infrastructure saturation",
                val: 20
            },
            {
                label: "Likelihood: Payment provider instability",
                val: 10
            }
        ]
    } : {
        id: "S1",
        type: "present",
        title: "Customers complaining (tickets spiked)",
        metric: "Detected via API • 12s ago",
        status: "LIVE",
        facts: [
            "APAC support tickets +42% in last 30 min",
            "Most complaints mention: slow checkout"
        ],
        beliefs: [
            {
                label: "Likelihood: Checkout system getting slower",
                val: 55
            },
            {
                label: "Likelihood: Bad traffic from partner campaign",
                val: 30
            },
            {
                label: "Likelihood: Competitor price drop",
                val: 15
            }
        ]
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "w-full h-screen bg-[#FAFAFA] text-slate-900 font-sans flex flex-col md:flex-row overflow-hidden relative",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$head$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("title", {
                    children: "Reality Tree | Kinetic Engine"
                }, void 0, false, {
                    fileName: "[project]/pages/simulation.tsx",
                    lineNumber: 70,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/pages/simulation.tsx",
                lineNumber: 69,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Header$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/pages/simulation.tsx",
                lineNumber: 73,
                columnNumber: 13
            }, this),
            toast && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 bg-white border-2 border-slate-900 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 flex items-center gap-5 w-[90%] md:w-auto",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "w-3 h-3 rounded-full bg-amber-500 animate-pulse"
                    }, void 0, false, {
                        fileName: "[project]/pages/simulation.tsx",
                        lineNumber: 78,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "flex flex-col",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                className: "text-[10px] font-black uppercase tracking-[0.2em] text-amber-600",
                                children: toast.title
                            }, void 0, false, {
                                fileName: "[project]/pages/simulation.tsx",
                                lineNumber: 80,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                className: "text-xs font-bold text-slate-800",
                                children: toast.msg
                            }, void 0, false, {
                                fileName: "[project]/pages/simulation.tsx",
                                lineNumber: 83,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/simulation.tsx",
                        lineNumber: 79,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/simulation.tsx",
                lineNumber: 77,
                columnNumber: 17
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "flex-1 relative overflow-hidden grid-bg select-none min-h-[50vh]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$RealityTree$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                        activeNode: activeNode,
                        selectedOutcomeId: expandedBranchId,
                        selectedNodeId: selectedNodeId,
                        onSelectBranch: (id)=>{
                            setExpandedBranchId(id);
                            if (id) {
                                setSelectedNodeId(id);
                                setIsPanelOpen(true);
                            }
                        },
                        onSelectNode: (id)=>{
                            setSelectedNodeId(id);
                            if (id) setIsPanelOpen(true);
                        },
                        isSimulated: isSimulated
                    }, void 0, false, {
                        fileName: "[project]/pages/simulation.tsx",
                        lineNumber: 91,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "absolute bottom-8 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-4",
                        children: [
                            !isSimulated && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                onClick: triggerSimulation,
                                className: "flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-full shadow-2xl hover:bg-slate-800 transition-all active:scale-95 group whitespace-nowrap",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__["Play"], {
                                        size: 14,
                                        fill: "currentColor",
                                        className: "group-hover:translate-x-1 transition-transform"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/simulation.tsx",
                                        lineNumber: 115,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                        className: "text-[10px] font-black uppercase tracking-[0.2em]",
                                        children: "New Data (DEMO)"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/simulation.tsx",
                                        lineNumber: 120,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/simulation.tsx",
                                lineNumber: 111,
                                columnNumber: 25
                            }, this),
                            isSimulated && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                onClick: ()=>{
                                    setIsSimulated(false);
                                    setExpandedBranchId(null);
                                    setSelectedNodeId(null);
                                },
                                className: "flex items-center gap-3 px-8 py-4 bg-white border-2 border-slate-200 text-slate-400 rounded-full shadow-lg hover:border-slate-400 hover:text-slate-600 transition-all active:scale-95",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__["Database"], {
                                        size: 14
                                    }, void 0, false, {
                                        fileName: "[project]/pages/simulation.tsx",
                                        lineNumber: 135,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                        className: "text-[10px] font-black uppercase tracking-[0.2em]",
                                        children: "Reset Flow"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/simulation.tsx",
                                        lineNumber: 136,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/simulation.tsx",
                                lineNumber: 127,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/simulation.tsx",
                        lineNumber: 109,
                        columnNumber: 17
                    }, this),
                    !isPanelOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                        onClick: ()=>setIsPanelOpen(true),
                        className: "absolute top-24 right-6 md:top-28 md:right-10 z-[60] p-3 bg-white/80 border border-slate-200/60 rounded-xl shadow-lg hover:bg-white transition-all text-slate-500 hover:text-black backdrop-blur-md",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$panel$2d$right$2d$open$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__PanelRightOpen$3e$__["PanelRightOpen"], {
                            size: 20
                        }, void 0, false, {
                            fileName: "[project]/pages/simulation.tsx",
                            lineNumber: 148,
                            columnNumber: 25
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/pages/simulation.tsx",
                        lineNumber: 144,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/simulation.tsx",
                lineNumber: 90,
                columnNumber: 13
            }, this),
            isPanelOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$DecisionPanel$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                node: activeNode,
                scenarioId: selectedNodeId,
                onClose: ()=>setIsPanelOpen(false)
            }, void 0, false, {
                fileName: "[project]/pages/simulation.tsx",
                lineNumber: 154,
                columnNumber: 17
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/pages/simulation.tsx",
        lineNumber: 68,
        columnNumber: 9
    }, this);
}
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__6ecea64e._.js.map