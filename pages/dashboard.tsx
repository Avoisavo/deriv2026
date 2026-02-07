import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
    PieChart,
    MessageSquare,
    Users,
    Settings,
    Search,
    Bell,
    Menu,
    MoreHorizontal,
    Edit,
    Video,
    Phone,
    Send,
    Cpu,
    Sparkles
} from "lucide-react";

// Mock data for the sidebar chat list
const chats = [
    {
        id: 1,
        name: "Truman AI",
        active: true,
        preview: "Analyzing checkout flow...",
        avatarColor: "bg-slate-900 text-white",
        initials: "AI",
        isAi: true,
    },
    {
        id: 2,
        name: "Capstone Presentation",
        date: "30/12/25",
        sender: "Saraswathy Shamini Gunasekaran...",
        avatarColor: "bg-blue-100 text-blue-600",
        initials: "SG",
    },
    {
        id: 3,
        name: "Yhon Thee (External)",
        date: "27/12/25",
        preview: "New message",
        avatarColor: "bg-red-100 text-red-600",
        initials: "YT",
        unread: true,
    },
];

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

export default function DashboardPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("Chats");
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isAiTyping, setIsAiTyping] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isAiTyping]);

    // Auto-run analysis sequence
    useEffect(() => {
        const sequence = [
            { text: "Hello. I've detected a spike in support tickets affecting APAC. I'm analyzing the root cause now.", delay: 1000 },
            { text: "Currently, we're seeing a 42% spike in tickets compared to the baseline.", delay: 3500 },
            { text: "The most likely cause is a checkout error rate rising to 2.1%. This correlates with the recent APAC deploy.", delay: 6000 },
            {
                text: "Simulating future state... I project immediate revenue impact if this continues. I recommend preparing a rollback.",
                delay: 9000,
                action: { label: "Run Simulation", url: "/simulation" }
            }
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

    const addAiMessage = (text: string, action?: { label: string; url: string }) => {
        setIsAiTyping(true);
        // varying typing time based on length, just for feel, or fixed
        setTimeout(() => {
            setIsAiTyping(false);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString() + Math.random().toString(),
                    sender: "ai",
                    text,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, newMsg]);
        setInputValue("");
        processUserCommand(inputValue);
    };

    const processUserCommand = (cmd: string) => {
        const lowerCmd = cmd.toLowerCase();

        if (lowerCmd.includes("show") || lowerCmd.includes("visualize") || lowerCmd.includes("what")) {
            addAiMessage("Currently, we're seeing a 42% spike in tickets.");
        }
        else if (lowerCmd.includes("cause") || lowerCmd.includes("why")) {
            addAiMessage("The most likely cause is a checkout error rate rising to 2.1%. This correlates with the recent APAC deploy.");
        }
        else if (lowerCmd.includes("simulate") || lowerCmd.includes("future") || lowerCmd.includes("next")) {
            addAiMessage("Simulating future state... I project immediate revenue impact if this continues. I recommend preparing a rollback.", { label: "Run Simulation", url: "/simulation" });
        }
        else {
            addAiMessage("I'm not sure how to handle that specific command, but I'm monitoring the situation.");
        }
    };

    return (
        <div className="flex h-screen w-full bg-white text-slate-900 font-sans overflow-hidden">
            <Head>
                <title>Dashboard | TRUMAN</title>
            </Head>

            {/* SIDEBAR */}
            <aside className="w-[300px] flex-col border-r border-slate-200 bg-[#F7F7F8] h-full hidden md:flex shrink-0">
                {/* Header */}
                <div className="h-16 px-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                            <Cpu size={18} />
                        </div>
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight">TRUMAN</h1>
                    </div>
                    <button className="hover:text-slate-800 transition-colors text-slate-400">
                        <Edit size={18} />
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="px-4 pb-4">
                    <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-lg">
                        {["Chats", "Alerts"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === tab
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
                    <div className="flex flex-col gap-1">
                        {chats.map((chat) => (
                            <div
                                key={chat.id}
                                className={`group relative p-3 rounded-xl cursor-pointer transition-all ${chat.active
                                    ? "bg-white shadow-sm border border-slate-200"
                                    : "hover:bg-slate-200/50 border border-transparent"
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="relative shrink-0">
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${chat.avatarColor}`}
                                        >
                                            {chat.isAi ? <Sparkles size={16} /> : chat.initials}
                                        </div>
                                        {chat.unread && (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center">
                                                <div className="w-2.5 h-2.5 bg-green-500 rounded-full border border-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-sm font-bold text-slate-900 truncate pr-2">
                                                {chat.name}
                                            </span>
                                            {chat.date && (
                                                <span className="text-[10px] text-slate-400 shrink-0">
                                                    {chat.date}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p
                                                className={`text-xs truncate ${chat.unread || chat.active
                                                    ? "text-slate-900 font-medium"
                                                    : "text-slate-500"
                                                    }`}
                                            >
                                                {chat.preview}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

            {/* CENTER: AI CHAT (Full Width) */}
            <main className="flex-1 flex flex-col h-full bg-white relative z-20 shadow-xl">
                {/* Chat Header */}
                <header className="h-16 px-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center">
                            <Sparkles size={16} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900 leading-none">Truman AI</h2>
                            <span className="text-[10px] font-medium text-emerald-500 flex items-center gap-1 mt-1">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                ONLINE
                            </span>
                        </div>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600">
                        <MoreHorizontal size={20} />
                    </button>
                </header>

                {/* Chat Content */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50/30"
                >
                    <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1 ${msg.sender === 'ai' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                    {msg.sender === 'ai' ? <Sparkles size={14} /> : 'ME'}
                                </div>
                                <div className={`flex flex-col gap-1 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === 'ai' ? 'bg-white text-slate-800 rounded-tl-none border border-slate-100' : 'bg-slate-900 text-white rounded-tr-none'}`}>
                                        {msg.text}
                                        {msg.action && (
                                            <button
                                                onClick={() => router.push(msg.action!.url)}
                                                className="mt-3 flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-md active:scale-95"
                                            >
                                                <Sparkles size={12} className="animate-pulse" />
                                                {msg.action.label}
                                            </button>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-slate-400 px-1">
                                        {msg.timestamp}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {isAiTyping && (
                            <div className="flex gap-3 max-w-[85%]">
                                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                                    <Sparkles size={14} />
                                </div>
                                <div className="p-4 bg-white rounded-2xl rounded-tl-none border border-slate-100 text-slate-400 text-xs flex items-center gap-1">
                                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-100">
                    <div className="max-w-3xl mx-auto w-full">
                        <div className="relative group">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Reply to Truman..."
                                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all text-sm placeholder:text-slate-400"
                            />
                            <button
                                onClick={handleSendMessage}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white rounded-lg text-slate-900 hover:bg-slate-100 transition-colors shadow-sm border border-slate-100"
                            >
                                <Send size={16} fill="currentColor" />
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
