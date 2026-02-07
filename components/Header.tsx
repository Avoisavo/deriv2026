import React from "react";
import { Command } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";

const Header: React.FC = () => {
  const router = useRouter();
  const currentPath = router.pathname;

  return (
    <header className="absolute top-8 left-1/2 -translate-x-1/2 z-[100] h-20 flex items-center">
      <div
        className="
        flex items-center 
        bg-white/95 backdrop-blur-xl
        border border-slate-200/80
        rounded-full 
        shadow-[0_15px_45px_rgba(0,0,0,0.08)]
        px-8 py-4
        hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)]
        transition-all duration-300
        whitespace-nowrap
        h-[72px]
        gap-8
      "
      >
        {/* BRAND SEGMENT */}
        <Link
          href="/"
          className="flex items-center gap-4 pr-8 border-r border-slate-100 group/brand"
        >
          <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-xl group-hover/brand:scale-105 transition-transform shrink-0">
            <Command size={18} />
          </div>
          <span className="font-extrabold tracking-tighter text-2xl text-slate-900 font-sans">
            TRUMAN
          </span>
        </Link>

        {/* NAVIGATION LINKS */}
        <nav className="flex items-center gap-8">
          <Link
            href="#"
            className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors pointer-events-none opacity-50"
          >
            Dashboard
          </Link>
          <Link
            href="/simulation"
            className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors hover:text-slate-900 
              ${currentPath === "/simulation" ? "text-slate-900" : "text-slate-400"}`}
          >
            Reality Tree
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
