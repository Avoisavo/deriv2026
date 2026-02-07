import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
    PieChart as LucidePieChart,
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
    Sparkles,
    BarChart2,
    TrendingUp,
    AlertCircle
} from "lucide-react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

// Mock data for visualizations
const errorTypeData = [
    { name: 'Timeout', value: 45 },
    { name: '404', value: 25 },
    { name: 'Auth', value: 20 },
    { name: 'Other', value: 10 },
];

const hourlyImpactData = [
    { time: '10:00', errors: 20 },
    { time: '11:00', errors: 45 },
    { time: '12:00', errors: 120 },
    { time: '13:00', errors: 85 },
    { time: '14:00', errors: 50 },
];

const ticketTrendData = [
    { time: 'Mon', tickets: 120 },
    { time: 'Tue', tickets: 132 },
    { time: 'Wed', tickets: 101 },
    { time: 'Thu', tickets: 450 }, // Spike
    { time: 'Fri', tickets: 290 },
];


const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']; // Shades of blue

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
    const [activeTab, setActiveTab] = useState("Overview"); // Changed default tab
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

            {/* LEFT SIDEBAR - VISUALIZATIONS */}
            <aside className="w-[40%] flex-col border-r border-slate-200 bg-[#F7F7F8] h-full hidden md:flex shrink-0 overflow-y-auto custom-scrollbar">
                {/* Header */}
                <div className="h-16 px-6 flex items-center justify-between shrink-0 bg-[#F7F7F8] sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                            <Cpu size={18} />
                        </div>
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight">TRUMAN</h1>
                    </div>
                </div>

                <div className="px-6 py-4 flex flex-col gap-6">
                    {/* Topic Title */}
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <AlertCircle size={12} />
                            Current Topic
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 leading-tight">
                            Checkout Latency Spike
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">CRITICAL</span>
                            <span className="text-xs text-slate-400">Detected 2m ago</span>
                        </div>
                    </div>

                    {/* Chart 1: Ticket Volume Trend */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                <TrendingUp size={14} className="text-slate-400" />
                                Ticket Volume
                            </h3>
                            <span className="text-[10px] text-red-500 font-medium">+42%</span>
                        </div>
                        <div className="h-32 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={ticketTrendData}>
                                    <defs>
                                        <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="time" hide />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                                        itemStyle={{ color: '#0f172a' }}
                                    />
                                    <Area type="monotone" dataKey="tickets" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTickets)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Chart 2: Hourly Impact */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                <BarChart2 size={14} className="text-slate-400" />
                                Hourly Errors
                            </h3>
                        </div>
                        <div className="h-32 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={hourlyImpactData}>
                                    <XAxis dataKey="time" hide />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                                    />
                                    <Bar dataKey="errors" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Chart 3: Error Distribution */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                <LucidePieChart size={14} className="text-slate-400" />
                                Error Types
                            </h3>
                        </div>
                        <div className="h-40 w-full flex items-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={errorTypeData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={60}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {errorTypeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-col gap-1 ml-2">
                                {errorTypeData.map((entry, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="text-[10px] text-slate-600">{entry.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* CENTER: AI CHAT (Full Width) */}
            <main className="w-[60%] flex flex-col h-full bg-white relative z-20 shadow-xl">
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
