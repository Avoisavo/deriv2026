import React from "react";
import { ChevronDown, Command } from "lucide-react";

const Header: React.FC = () => {
  return (
    <header className="absolute top-8 left-1/2 -translate-x-1/2 z-[100] h-20 group flex items-center">
      <div
        className="
        flex items-center gap-0 
        bg-white/95 backdrop-blur-xl
        border border-slate-200/80
        rounded-full 
        shadow-[0_15px_45px_rgba(0,0,0,0.08)]
        pr-10 pl-10 py-4
        hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)]
        transition-all duration-300
        whitespace-nowrap
        h-[72px]
      "
      >
        {/* 1. BRAND SEGMENT */}
        <div className="flex items-center gap-4 pr-10 border-r border-slate-100 cursor-pointer group/brand">
          <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-xl group-hover/brand:scale-105 transition-transform shrink-0">
            <Command size={18} />
          </div>
          <span className="font-extrabold tracking-tighter text-2xl text-slate-900 font-sans">
            TRUMAN
          </span>
        </div>

        <div className="px-10 flex flex-col justify-center cursor-pointer group/context hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover/context:text-slate-600 transition-colors">
              Active Scenario
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
            <span className="text-[10px] font-mono text-slate-400">
              INC-492
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-base font-black text-slate-800 leading-none">
              Checkout Flow / APAC Latency
            </span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>
        </div>
      </div>

      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none tracking-widest">
        Press{" "}
        <span className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-bold uppercase">
          ⌘K
        </span>{" "}
        to search scenarios
      </div>
    </header>
  );
};

export default Header;
