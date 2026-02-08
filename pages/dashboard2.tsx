import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  Hash,
  Home,
  MessageSquare,
  Bell,
  Clock,
  Search,
  Plus,
  ChevronDown,
  MoreVertical,
  Send,
  Smile,
  Paperclip,
  Mic,
  Video,
  Phone,
  Info,
  AtSign,
  Users,
  Headphones,
  Layout,
  Sparkles,
  Command,
  ExternalLink,
  MessageCircle,
} from "lucide-react";

type Message = {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  isTyping?: boolean;
  action?: {
    label: string;
    url: string;
  };
};

export default function Dashboard2Page() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAiTyping]);

  useEffect(() => {
    setMounted(true);
    const sequence = [
      {
        text: "Hello. I've detected a spike in support tickets affecting APAC. I'm analyzing the root cause now.",
        delay: 1000,
      },
      {
        text: "Currently, we're seeing a 42% spike in tickets compared to the baseline.",
        delay: 3500,
      },
      {
        text: "The most likely cause is a checkout error rate rising to 2.1%. This correlates with the recent APAC deploy.",
        delay: 6000,
      },
      {
        text: "Simulating future state... I project immediate revenue impact if this continues. I recommend preparing a rollback.",
        delay: 9000,
        action: { label: "Run Simulation", url: "/simulation" },
      },
    ];

    let timeouts: NodeJS.Timeout[] = [];

    sequence.forEach(({ text, delay, action }) => {
      const timer = setTimeout(() => {
        addAiMessage(text, action);
      }, delay);
      timeouts.push(timer);
    });

    return () => timeouts.forEach(clearTimeout);
  }, []);

  const addAiMessage = (
    text: string,
    action?: { label: string; url: string },
  ) => {
    setIsAiTyping(true);
    setTimeout(() => {
      setIsAiTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + Math.random().toString(),
          sender: "ai",
          text,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          action,
        },
      ]);
    }, 1200);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: inputValue,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputValue("");

    // Simulate AI response
    setTimeout(() => {
      addAiMessage(
        "I've analyzed your input. To get more insight and see potential outcomes, I recommend running a simulation.",
        { label: "Run Simulation", url: "/simulation" },
      );
    }, 1000);
  };

  if (!mounted) return null; // Prevent hydration mismatch

  return (
    <div className="flex h-screen w-full bg-[#0b1120] text-slate-100 font-sans overflow-hidden">
      <Head>
        <title>Slack | TRUMAN</title>
      </Head>

      {/* LEFT RAIL - WORKSPACE ICONS */}
      <aside className="w-18 flex flex-col items-center py-4 gap-4 bg-[#0b1120] border-r border-[#ffffff1a] shrink-0">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#0b1120] font-black text-xl hover:ring-4 hover:ring-[#ffffff33] cursor-pointer transition-all shadow-lg">
          TR
        </div>
        <div className="w-10 h-10 flex flex-col items-center justify-center rounded-lg hover:bg-[#ffffff1a] cursor-pointer text-slate-400 hover:text-white transition-colors">
          <Home size={20} />
          <span className="text-[10px] mt-1 font-medium">Home</span>
        </div>
        <div className="w-10 h-10 flex flex-col items-center justify-center rounded-lg hover:bg-[#ffffff1a] cursor-pointer text-slate-400 hover:text-white transition-colors">
          <MessageCircle size={20} />
          <span className="text-[10px] mt-1 font-medium">DMs</span>
        </div>
        <div className="w-10 h-10 flex flex-col items-center justify-center rounded-lg hover:bg-[#ffffff1a] cursor-pointer text-slate-400 hover:text-white transition-colors">
          <Bell size={20} />
          <span className="text-[10px] mt-1 font-medium">Activity</span>
        </div>
        <div className="mt-auto flex flex-col gap-4 items-center">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#ffffff1a] hover:bg-[#ffffff2a] cursor-pointer transition-colors">
            <Plus size={24} />
          </div>
          <div className="w-8 h-8 rounded-lg overflow-hidden relative cursor-pointer ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0b1120] transition-all hover:scale-105">
            <img
              src="https://ui-avatars.com/api/?name=H&background=3b82f6&color=fff"
              alt="User Avatar"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0b1120]"></div>
          </div>
        </div>
      </aside>

      {/* CHANNEL LIST */}
      <aside className="w-64 flex flex-col bg-[#1e293b] shrink-0 border-r border-[#ffffff0a]">
        {/* Workspace Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#ffffff0a] cursor-pointer hover:bg-[#ffffff0d] group">
          <h1 className="font-extrabold text-base text-white flex items-center gap-1.5 truncate">
            A1 Company Ltd.
            <ChevronDown
              size={14}
              className="mt-0.5 group-hover:scale-110 transition-transform text-slate-400"
            />
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto pt-4 flex flex-col gap-1 px-2 custom-scrollbar">
          {/* Sections */}
          <div className="mb-4">
            <div className="px-2 py-1 flex items-center text-slate-400 text-[11px] font-bold uppercase tracking-wider cursor-pointer hover:text-white transition-colors">
              <ChevronDown size={12} className="mr-2" />
              Channels
            </div>
            <div className="mt-1 flex flex-col gap-[1px]">
              <div className="px-3 py-1.5 flex items-center gap-2 rounded-md hover:bg-[#ffffff0d] cursor-pointer group">
                <Hash
                  size={16}
                  className="text-slate-500 group-hover:text-slate-300 transition-colors"
                />
                <span className="text-sm font-medium text-slate-300">
                  announcements
                </span>
              </div>
              <div className="px-3 py-1.5 flex items-center gap-2 rounded-md hover:bg-[#ffffff0d] cursor-pointer group">
                <Hash
                  size={16}
                  className="text-slate-500 group-hover:text-slate-300 transition-colors"
                />
                <span className="text-sm font-medium text-slate-300">
                  project-gizmo
                </span>
              </div>
              <div className="px-3 py-1.5 flex items-center gap-2 rounded-md hover:bg-[#ffffff0d] cursor-pointer group">
                <Hash
                  size={16}
                  className="text-slate-500 group-hover:text-slate-300 transition-colors"
                />
                <span className="text-sm font-medium text-slate-300">
                  team-marketing
                </span>
              </div>
              <div className="px-3 py-1.5 flex items-center gap-2 rounded-md hover:bg-[#ffffff0d] cursor-pointer text-slate-500 border border-dashed border-[#ffffff1a] mt-1 transition-all">
                <Plus size={16} />
                <span className="text-sm font-medium">Add channels</span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="px-2 py-1 flex items-center text-slate-400 text-[11px] font-bold uppercase tracking-wider cursor-pointer hover:text-white transition-colors">
              <ChevronDown size={12} className="mr-2" />
              Direct Messages
            </div>
            <div className="mt-1 flex flex-col gap-[1px]">
              <div className="px-3 py-1.5 flex items-center gap-2 rounded-md bg-[#3b82f6] text-white cursor-pointer group relative shadow-md shadow-blue-900/20">
                <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center">
                  <Command size={12} className="text-white" />
                </div>
                <span className="text-sm font-bold">Truman (AI)</span>
                <div className="ml-auto w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)] border border-blue-600"></div>
              </div>
              <div className="px-3 py-1.5 flex items-center gap-2 rounded-md hover:bg-[#ffffff0d] cursor-pointer group">
                <div className="w-5 h-5 rounded overflow-hidden">
                  <img
                    src="https://ui-avatars.com/api/?name=User&background=64748b&color=fff"
                    alt="User"
                    className="w-full h-full"
                  />
                </div>
                <span className="text-sm font-medium text-slate-300">You</span>
              </div>
            </div>
          </div>
        </div>

        {/* Huddles/Foot info */}
        <div className="p-3 border-t border-[#ffffff0a]">
          <div className="bg-[#ffffff0a] rounded-lg p-2.5 flex items-center justify-between hover:bg-[#ffffff14] transition-colors cursor-pointer group">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                Huddle
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Headphones
                size={14}
                className="text-slate-400 group-hover:text-white transition-colors"
              />
              <Plus
                size={14}
                className="text-slate-400 group-hover:text-white transition-colors"
              />
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col bg-white">
        {/* Search Bar (Modern Slack Style) */}
        <div className="h-10 bg-[#0b1120] border-b border-[#ffffff1a] flex items-center justify-center p-1 px-4 relative z-50 shrink-0">
          <div className="max-w-2xl w-full relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={14} />
            </div>
            <input
              type="text"
              placeholder="Search A1 Company Ltd."
              className="w-full bg-[#ffffff14] hover:bg-[#ffffff24] py-1 pl-10 pr-4 rounded-md text-xs text-white placeholder:text-slate-400 focus:outline-none transition-all border border-transparent focus:border-[#3b82f644]"
            />
          </div>
          <div className="absolute right-4 text-slate-400 hover:text-white cursor-pointer transition-colors">
            <MoreVertical size={18} />
          </div>
        </div>

        {/* Channel Header (Now Context Aware) */}
        <header className="h-12 border-b border-slate-200 px-4 flex items-center justify-between shrink-0 bg-white shadow-sm z-10">
          <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-md transition-colors">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Command size={14} />
            </div>
            <h2 className="text-slate-900 font-extrabold text-base flex items-center gap-1.5">
              Truman (AI)
            </h2>
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <ChevronDown size={14} className="text-slate-400 mt-0.5" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-1.5 cursor-pointer">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded border-2 border-white overflow-hidden shadow-sm hover:z-10 transition-transform hover:scale-110"
                >
                  <img
                    src={`https://ui-avatars.com/api/?name=User${i}&background=${i % 2 === 0 ? "fecaca" : "bfdbfe"}&color=000`}
                    alt="Avatar"
                    className="w-full h-full"
                  />
                </div>
              ))}
              <div className="w-6 h-6 rounded border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] text-slate-600 font-bold shadow-sm">
                15
              </div>
            </div>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-2">
              <div className="hover:bg-slate-100 p-1.5 rounded-md cursor-pointer transition-colors text-slate-500">
                <Phone size={18} />
              </div>
              <div className="hover:bg-slate-100 p-1.5 rounded-md cursor-pointer transition-colors text-slate-500">
                <Video size={18} />
              </div>
              <div className="hover:bg-slate-100 p-1.5 rounded-md cursor-pointer transition-colors text-slate-500">
                <Info size={18} />
              </div>
            </div>
          </div>
        </header>

        {/* Chat Content */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto flex flex-col bg-white custom-scrollbar px-6 pt-4 pb-1"
        >
          {/* Welcome message now focused on DM */}
          <div className="mb-10 mt-6 max-w-4xl">
            <div className="flex items-center gap-5 mb-3">
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                <Command size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  This is your direct message history with Truman (AI)
                </h1>
                <p className="text-slate-600 text-base mt-2 leading-relaxed">
                  Truman is your personal AI analyst. Ask questions, simulate
                  business realities, and find insights in real-time.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 mb-8">
            {/* Mock Google Calendar Message from Image - FIXED HYDRATION BY PLACING IN CONTENT */}
            <div className="group flex gap-4 hover:bg-slate-50 -mx-6 px-6 py-3 transition-colors relative border-b border-transparent hover:border-slate-100">
              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 mt-0.5 shadow-sm border border-slate-100">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg"
                  alt="Google Calendar"
                  className="w-full h-full object-contain p-1.5 bg-white"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-extrabold text-slate-900 hover:underline cursor-pointer">
                    Google Calendar
                  </span>
                  <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">
                    APP
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium tracking-tight">
                    10:15 AM
                  </span>
                </div>
                <div className="mt-2 border-l-4 border-blue-500 pl-4 py-1.5 bg-blue-50/30 rounded-r-lg max-w-md">
                  <div className="text-sm font-black text-blue-700 hover:underline cursor-pointer">
                    Project Status Meeting
                  </div>
                  <div className="text-sm text-slate-700 font-semibold mt-1">
                    Today from 20:30 - 21:00 GMT
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-200 text-xs font-bold text-slate-600 hover:border-slate-300 cursor-pointer shadow-sm transition-all active:scale-95">
                      <span className="text-sm">📐</span> 6
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className="group flex gap-4 hover:bg-slate-50 -mx-6 px-6 py-3 transition-colors relative"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 mt-0.5 shadow-sm">
                  {msg.sender === "ai" ? (
                    <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white">
                      <Command size={20} />
                    </div>
                  ) : (
                    <img
                      src="https://ui-avatars.com/api/?name=H&background=64748b&color=fff"
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-extrabold text-slate-900 hover:underline cursor-pointer">
                      {msg.sender === "ai" ? "Truman (AI)" : "H"}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium uppercase tracking-tight">
                      {msg.timestamp}
                    </span>
                    {msg.sender === "ai" && (
                      <span className="bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest">
                        BOT
                      </span>
                    )}
                  </div>
                  <div className="text-slate-800 text-[15px] leading-relaxed mt-1 break-words">
                    {msg.text}
                  </div>

                  {/* Action Card if AI message has action */}
                  {msg.sender === "ai" && msg.action && (
                    <div className="mt-4 border-l-4 border-orange-400 pl-4 py-1">
                      <div className="bg-white rounded-xl border border-slate-200 p-5 max-w-sm shadow-lg shadow-slate-200/50 hover:shadow-xl hover:border-orange-200 transition-all group/card cursor-pointer">
                        <div className="flex flex-col gap-1 mb-4">
                          <div className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] leading-none mb-1.5">
                            Recommendation
                          </div>
                          <div className="text-base font-black text-slate-900 group-hover/card:text-orange-600 transition-colors">
                            Risk Analysis Required
                          </div>
                        </div>
                        <p className="text-[13px] text-slate-500 leading-relaxed mb-5 font-medium">
                          Current latency spikes suggest immediate attention.
                          Run simulation to evaluate rollback impact.
                        </p>
                        <button
                          onClick={() => router.push(msg.action!.url)}
                          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-[0.15em] rounded-xl transition-all flex items-center justify-center gap-2.5 active:scale-[0.97]"
                        >
                          {msg.action.label}
                          <ExternalLink size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reactions Hover Menu */}
                <div className="absolute right-6 top-0 opacity-0 group-hover:opacity-100 transition-all translate-y-[-50%] bg-white border border-slate-200 rounded-lg shadow-xl flex items-center p-1 z-20 scale-95 group-hover:scale-100">
                  <div className="p-2 hover:bg-slate-100 rounded-md cursor-pointer text-slate-500 hover:text-blue-600 transition-colors">
                    <Smile size={16} />
                  </div>
                  <div className="p-2 hover:bg-slate-100 rounded-md cursor-pointer text-slate-500 hover:text-blue-600 transition-colors">
                    <MessageSquare size={16} />
                  </div>
                  <div className="p-2 hover:bg-slate-100 rounded-md cursor-pointer text-slate-500 hover:text-blue-600 transition-colors">
                    <MoreVertical size={16} />
                  </div>
                </div>
              </div>
            ))}

            {isAiTyping && (
              <div className="flex gap-4 -mx-6 px-6 py-2">
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 mt-0.5 shadow-sm bg-blue-600 flex items-center justify-center text-white">
                  <Command size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-extrabold text-slate-900">
                      Truman AI
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                      analyzing...
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 bg-slate-100 w-16 h-8 justify-center rounded-lg">
                    <div
                      className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="px-6 pb-6 pt-2 bg-white border-t border-slate-100">
          <div className="border border-slate-300 rounded-2xl bg-white focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50 transition-all shadow-lg shadow-slate-200/20 overflow-hidden">
            {/* Toolbar Top */}
            <div className="flex items-center gap-1 p-1 px-2 bg-slate-50/80 border-b border-slate-100">
              <div className="p-2 hover:bg-slate-200 rounded-lg cursor-pointer text-slate-500 transition-colors active:scale-90">
                <Smile size={20} />
              </div>
              <div className="p-2 hover:bg-slate-200 rounded-lg cursor-pointer text-slate-500 transition-colors active:scale-90">
                <Paperclip size={20} />
              </div>
              <div className="p-2 hover:bg-slate-200 rounded-lg cursor-pointer text-slate-500 transition-colors active:scale-90">
                <AtSign size={20} />
              </div>
              <div className="h-5 w-px bg-slate-200 mx-2"></div>
              <div className="p-2 hover:bg-slate-200 rounded-lg cursor-pointer text-slate-500 transition-colors active:scale-90">
                <Command size={20} />
              </div>
            </div>

            {/* Input Box */}
            <div className="relative p-4">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="w-full bg-transparent border-none focus:outline-none text-[16px] text-slate-800 placeholder:text-slate-400 min-h-[44px] resize-none overflow-hidden leading-relaxed"
                rows={1}
              />
            </div>

            {/* Toolbar Bottom */}
            <div className="flex items-center justify-between p-1.5 px-3 bg-white">
              <div className="flex items-center gap-1">
                <div className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer text-slate-400 transition-colors">
                  <Plus size={20} />
                </div>
                <div className="h-5 w-px bg-slate-200 mx-2"></div>
                <div className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer text-slate-400 transition-colors">
                  <Video size={20} />
                </div>
                <div className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer text-slate-400 transition-colors">
                  <Mic size={20} />
                </div>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className={`p-2 px-4 rounded-xl transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest ${
                  inputValue.trim()
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 active:scale-95 hover:bg-blue-700"
                    : "text-slate-300 bg-slate-50"
                }`}
              >
                Send
                <Send
                  size={16}
                  className={
                    inputValue.trim() ? "translate-x-0.5 -translate-y-0.5" : ""
                  }
                />
              </button>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 text-center font-semibold tracking-wide flex items-center justify-center gap-2">
            <span>
              <b>Return</b> to send
            </span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>
              <b>Shift + Return</b> to add a new line
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
