"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface PlanModePanelProps {
  /** Path node labels (glow-up nodes), in order. */
  pathLabels: string[];
  /** How many pills to show so far (for one-by-one animation). */
  pillVisibleCount: number;
  /** Panel is expanded (60% height) or collapsed (bar only). */
  isExpanded: boolean;
  /** Toggle expand/collapse. */
  onToggleExpand: () => void;
  /** Input value shown in the collapsed bar (plan prompt). */
  planPrompt?: string;
  /** Called when the user changes the plan prompt in the collapsed bar. */
  onPlanPromptChange?: (value: string) => void;
  /** Called when user submits the prompt (e.g. Predict button). */
  onPromptSubmit?: (prompt: string) => void;
  /** When false, expand is disabled (e.g. until prediction flow has run). */
  canExpand?: boolean;
}

type DemoStep = "input" | "thinking" | "typing_plan" | "awaiting_channel" | "analyzing_channel" | "completing_plan" | "awaiting_confirmation";
type ChannelChoice = "gmail" | "telegram" | "whatsapp" | "other" | null;

const DEMO_PLAN = `Plan: Send Notification

1. 📝 Draft Message
   - Summarize key updates and action items
   - Include clear call-to-action and deadline
   - Attach supporting documents

2. 📤 Choose Channel
   • Email: Formal, allows attachments
   • Slack/Teams: Quick, threaded discussion
   • WhatsApp: Urgent, high visibility

3. ✅ Prepare Recipients
   - Verify contact list (n=~50)
   - Group by priority/role
   - Check timezone preferences

Select communication channel:`;

const getCompletionText = (channel: ChannelChoice, otherValue: string): string => {
  const name =
    channel === "gmail"
      ? "Gmail"
      : channel === "telegram"
        ? "Telegram"
        : channel === "whatsapp"
          ? "WhatsApp"
          : otherValue.trim() || "selected channel";

  return `

4. ✅ Using ${name}
   → Configure delivery settings
   → Setup tracking & notifications
   → Queue message for sending

5. 📊 Execute & Monitor
   • Send to ~50 recipients
   • Track delivery status
   • Generate completion report

Ready to proceed?`;
};

const TYPING_SPEED = 8; // ms per character (much faster)
const THINKING_DURATION = 800; // ms (faster)
const ANALYZING_DURATION = 400; // ms (faster)

// SVG Icons for channels
const GmailIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0012 5.884V5a2 2 0 00-2-2h-6a2 2 0 00-2 2v.884zm7.997 5.116L10 11.118l-7.997-3.998V19a2 2 0 002 2h6a2 2 0 002-2v-6.884z"/>
  </svg>
);

const TelegramIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0a12.018 12.018 0 00-2.078.292c.256-.092 6.794 2.902 7.63 6.246.106.424.177.855.278 1.283l2.262 8.403c.282 1.05-.037 1.588-.833 1.588-.282 0-.555-.065-.812-.13l-2.324-.776-1.463 1.394-.06.06-.116.035-.155.037-.027.068-.04.154-.03.26l1.028 3.35c.126.412-.037.832-.336 1.148-.665l8.57-6.73c.42-.33.084-.487-.12-.487-.076 0-.146.045-.22.165l-1.794 8.478c-.166.785-.615.97-1.53.613l-3.96-1.558-1.935 1.377c-.182.132-.33.062-.492-.182l-.157-2.285c-.03-.196.117-.294.313-.21l6.31-2.478c.39-.148.853.072.932.49.08.418-.264 1.75-.388 2.528-.18.93-.484 1.487-1.378 2.577-.586.724-.99 1.528-.99 2.636 0 3.025 2.468 5.488 5.488 5.488.033 0 .064-.004.096-.007.877-.074 1.69-.187 2.453-.408 3.284-.34.363-.618-.7-.6-1.034l-2.27-8.47c-.137-.51-.564-.778-1.078-.678z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.403.407-.603.603-.197.2-.394.2-.394.098-.196.295-.295.593-.492.296-.296.493-.593.493-.593.198-.397.1-.795.1-.795.198-.493.296-.99.493-1.485.594-.795.198-1.589-.495-2.383-.495-2.679 0-4.958 4.036-8.994 8.994-8.994s8.994 4.036 8.994 8.994c0 4.958-4.036 8.994-8.994 8.994-.994 0-1.988-.198-2.882-.493-.795-.198-1.589-.594-2.383-.493-.295.1-.593.493-.593.493-.198.397-.394.795-.1.795.1 0 .198-.1.495-.295.593-.492.198-.297.493-.594.593-.603.198-.2.1-.297.198-.495-.198-.297 0-.594-.198-.796-.594-1.488-.594-.795.198-1.589.495-2.383.493-.297-.1-.594-.296-.594-.594 0-.296.198-.593.493-.795.1-.795.1zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10c1.786 0 3.453-.469 4.904-1.285L22 22l-4.285-5.096C19.469 15.453 20 13.786 20 12c0-5.523-4.477-10-10-10z"/>
  </svg>
);

const OtherIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export function PlanModePanel({
  pathLabels,
  pillVisibleCount,
  isExpanded,
  onToggleExpand,
  planPrompt = "",
  onPlanPromptChange,
  onPromptSubmit,
  canExpand = true,
}: PlanModePanelProps) {
  const [demoStep, setDemoStep] = useState<DemoStep>("input");
  const [channelChoice, setChannelChoice] = useState<ChannelChoice>(null);
  const [otherChannelValue, setOtherChannelValue] = useState("");
  const [finalInput, setFinalInput] = useState("");
  const [planInput, setPlanInput] = useState("");
  const [displayedPlan, setDisplayedPlan] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isProcessingOther, setIsProcessingOther] = useState(false);

  // Ref for scrollable content area
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when displayedPlan changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [displayedPlan]);

  // Typing animation effect
  useEffect(() => {
    if (demoStep === "typing_plan") {
      let index = 0;
      const targetText = DEMO_PLAN;
      setDisplayedPlan("");

      const timer = setInterval(() => {
        if (index < targetText.length) {
          setDisplayedPlan(targetText.slice(0, index + 1));
          index++;
        } else {
          clearInterval(timer);
          setDemoStep("awaiting_channel");
        }
      }, TYPING_SPEED);

      return () => clearInterval(timer);
    }
  }, [demoStep]);

  // Completion typing effect
  useEffect(() => {
    if (demoStep === "completing_plan") {
      const completionText = getCompletionText(channelChoice, otherChannelValue);
      let index = 0;

      const timer = setInterval(() => {
        if (index < completionText.length) {
          setDisplayedPlan((prev) => prev + completionText[index]);
          index++;
        } else {
          clearInterval(timer);
          setDemoStep("awaiting_confirmation");
        }
      }, TYPING_SPEED);

      return () => clearInterval(timer);
    }
  }, [demoStep, channelChoice, otherChannelValue]);

  const handleSubmitPrompt = useCallback(() => {
    if (planInput.trim()) {
      setDemoStep("thinking");
      setTimeout(() => {
        setDemoStep("typing_plan");
      }, THINKING_DURATION);
    }
  }, [planInput]);

  const handleSelectChannel = useCallback((channel: ChannelChoice) => {
    if (channel === "other") {
      setChannelChoice("other");
      setIsProcessingOther(false);
      return;
    }
    setChannelChoice(channel);
    setDemoStep("analyzing_channel");
    setTimeout(() => {
      setDemoStep("completing_plan");
    }, ANALYZING_DURATION);
  }, []);

  const handleConfirmOtherChannel = useCallback(() => {
    if (otherChannelValue.trim()) {
      setIsProcessingOther(true);
      setDemoStep("analyzing_channel");
      setTimeout(() => {
        setDemoStep("completing_plan");
      }, ANALYZING_DURATION);
    }
  }, [otherChannelValue]);

  const resetDemo = useCallback(() => {
    setDemoStep("input");
    setChannelChoice(null);
    setOtherChannelValue("");
    setFinalInput("");
    setDisplayedPlan("");
    setPlanInput("");
    setIsProcessingOther(false);
  }, []);

  const showChannelModal = demoStep === "awaiting_channel" && channelChoice !== "other" && !isProcessingOther;
  const showConfirmationModal = demoStep === "awaiting_confirmation";

  const channelOptions = [
    { value: "gmail" as const, label: "Gmail", icon: <GmailIcon />, color: "text-red-400" },
    { value: "telegram" as const, label: "Telegram", icon: <TelegramIcon />, color: "text-blue-400" },
    { value: "whatsapp" as const, label: "WhatsApp", icon: <WhatsAppIcon />, color: "text-green-400" },
    { value: "other" as const, label: "Other", icon: <OtherIcon />, color: "text-slate-400" },
  ];

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-10 flex flex-col overflow-hidden border-t border-slate-700 bg-slate-900/98 backdrop-blur-sm shadow-[0_-4px_24px_rgba(0,0,0,0.4)] transition-[height] duration-300 ease-out ${
        isExpanded ? "h-[60%]" : "h-12"
      }`}
    >
      {/* Collapsed bar: input field + Predict button + expand toggle (when allowed) */}
      <div className="flex flex-none items-center gap-2 px-4 py-2 min-h-12">
        <input
          type="text"
          value={planPrompt}
          onChange={(e) => onPlanPromptChange?.(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onPromptSubmit?.(planPrompt)}
          placeholder="e.g. What if our company stop producing wattle bottle?"
          className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        {onPromptSubmit && (
          <button
            type="button"
            onClick={() => onPromptSubmit(planPrompt)}
            disabled={!planPrompt.trim()}
            className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Predict
          </button>
        )}
        {canExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            className="flex shrink-0 items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 transition-colors duration-200"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
          >
            <span className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>▼</span>
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden relative">
          {/* Upper: path as linkage + nodes (flowing links, circles kept round) */}
          <div className="flex-none border-b border-slate-700/50 px-4 py-4 bg-slate-900/50">
            <style>{`
              @keyframes plan-link-flow-div {
                0% { background-position: 0% 50%; }
                100% { background-position: 200% 50%; }
              }
              .plan-link-flow-div {
                background: linear-gradient(
                  90deg,
                  rgba(251, 191, 36, 0.8) 0%,
                  rgba(251, 191, 36, 0.95) 25%,
                  rgba(251, 191, 36, 0.8) 50%,
                  rgba(251, 191, 36, 0.95) 75%,
                  rgba(251, 191, 36, 0.8) 100%
                ) !important;
                background-size: 200% 100% !important;
                animation: plan-link-flow-div 1.2s linear infinite;
              }
            `}</style>
            <div className="mx-auto max-w-4xl">
              {pathLabels.length > 0 && (() => {
                const n = pathLabels.length;
                return (
                  <div className="grid w-full" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
                    {/* Row 1: one circle per column + link segments so nodes match column spacing */}
                    {pathLabels.map((_, i) => {
                      const visible = i < pillVisibleCount;
                      const linkRightVisible = i < n - 1 && i + 1 <= pillVisibleCount;
                      const linkLeftVisible = i > 0 && i <= pillVisibleCount;
                      return (
                        <div key={i} className="relative flex items-center justify-center min-h-10">
                          {i > 0 && (
                            <div
                              className={`absolute left-0 right-1/2 top-1/2 h-0.5 -translate-y-1/2 rounded-full transition-all duration-300 ${linkLeftVisible ? "plan-link-flow-div" : ""}`}
                              style={{
                                background: linkLeftVisible ? undefined : "rgba(71, 85, 105, 0.4)",
                              }}
                            />
                          )}
                          {i < n - 1 && (
                            <div
                              className={`absolute left-1/2 right-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full transition-all duration-300 ${linkRightVisible ? "plan-link-flow-div" : ""}`}
                              style={{
                                background: linkRightVisible ? undefined : "rgba(71, 85, 105, 0.4)",
                              }}
                            />
                          )}
                          <div
                            className="relative z-10 h-3 w-3 shrink-0 rounded-full border-2 transition-all duration-300"
                            style={{
                              backgroundColor: "rgb(251, 191, 36)",
                              borderColor: "rgba(251, 191, 36, 0.9)",
                              opacity: visible ? 1 : 0.25,
                            }}
                          />
                        </div>
                      );
                    })}
                    {/* Row 2: one label per column, directly under the node */}
                    {pathLabels.map((label, i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center justify-start pt-0.5 transition-all duration-300"
                        style={{
                          opacity: i < pillVisibleCount ? 1 : 0.35,
                          transform: i < pillVisibleCount ? "translateY(0)" : "translateY(4px)",
                        }}
                      >
                        <span className="block text-center text-xs font-medium text-slate-400 truncate w-full px-0.5" title={label}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Main content area with backdrop filter when modal is open */}
          <div
            ref={scrollContainerRef}
            className={`flex min-h-0 flex-1 flex-col overflow-auto p-4 transition-all duration-300 ${
              (showChannelModal || showConfirmationModal) ? "filter brightness-50 blur-[1px]" : ""
            }`}
          >
            {demoStep === "input" && (
              <div className="flex flex-col h-full">
                <div className="flex-1" />
                <div className="flex-none space-y-4 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">Describe what you want to do</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={planInput}
                        onChange={(e) => setPlanInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmitPrompt()}
                        placeholder="e.g. send an important update notification to the project team"
                        className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={handleSubmitPrompt}
                        disabled={!planInput.trim()}
                        className="rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 px-5 py-3 text-sm font-medium text-white hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-amber-600 disabled:hover:to-amber-500 transition-all duration-200 shadow-lg shadow-amber-500/25"
                      >
                        Generate Plan
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {demoStep === "thinking" && (
              <div className="flex-1 flex items-center justify-center animate-in fade-in duration-300">
                <div className="text-center space-y-4">
                  <div className="flex justify-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></span>
                  </div>
                  <p className="text-sm text-slate-400 font-medium">Analyzing your request...</p>
                </div>
              </div>
            )}

            {(demoStep === "typing_plan" || demoStep === "completing_plan") && (
              <div className="flex-1 flex flex-col gap-4 animate-in fade-in duration-300">
                <div className={`flex-none rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-5 font-mono text-sm leading-relaxed shadow-lg ${
                  demoStep === "completing_plan" ? "border-amber-500/30 bg-amber-500/5" : ""
                }`}>
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-700/50">
                    <span className={`w-2 h-2 rounded-full ${demoStep === "completing_plan" ? "bg-amber-500 animate-pulse" : "bg-amber-500"}`}></span>
                    <span className="text-xs text-slate-500 font-medium">
                      {demoStep === "typing_plan" ? "GENERATING PLAN" : "REFINING PLAN - Configuring based on selection..."}
                    </span>
                  </div>
                  <pre className="text-slate-300 whitespace-pre-wrap">
                    {displayedPlan}
                    {cursorVisible && <span className="inline-block w-2 h-4 bg-amber-500 ml-0.5 align-middle animate-pulse"></span>}
                  </pre>
                </div>
              </div>
            )}

            {demoStep === "awaiting_channel" && (
              <div className="flex flex-1 flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex-none rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-5 font-mono text-sm leading-relaxed shadow-lg">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-700/50">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs text-slate-500 font-medium">PLAN READY</span>
                  </div>
                  <pre className="text-slate-300 whitespace-pre-wrap">{displayedPlan}</pre>
                </div>
              </div>
            )}

            {demoStep === "analyzing_channel" && (
              <div className="flex-1 flex flex-col gap-4 animate-in fade-in duration-300">
                <div className="flex-none rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 font-mono text-sm leading-relaxed shadow-lg">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-700/50">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="text-xs text-slate-500 font-medium">REFINING PLAN - Analyzing your selection...</span>
                  </div>
                  <pre className="text-slate-300 whitespace-pre-wrap">
                    {displayedPlan}
                    {cursorVisible && <span className="inline-block w-2 h-4 bg-amber-500 ml-0.5 align-middle animate-pulse"></span>}
                  </pre>
                </div>
              </div>
            )}

            {demoStep === "awaiting_confirmation" && (
              <div className="flex flex-1 flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex-none rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 font-mono text-sm leading-relaxed shadow-lg shadow-emerald-500/10">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-700/50">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs text-slate-500 font-medium">PLAN COMPLETE</span>
                  </div>
                  <pre className="text-slate-300 whitespace-pre-wrap">{displayedPlan}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Channel selection modal popup */}
          {showChannelModal && (
            <div className="absolute bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-300">
              <div className="mx-4 mb-4 rounded-2xl border border-slate-600/50 bg-slate-800/95 backdrop-blur-md shadow-2xl shadow-slate-900/50 p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <span className="text-amber-500">⤷</span> Choose a communication channel:
                  </p>
                  <button
                    type="button"
                    onClick={() => setChannelChoice(null)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 transition-all duration-200"
                  >
                    <CloseIcon />
                  </button>
                </div>
                <div className="space-y-2">
                  {channelOptions.map((option, index) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelectChannel(option.value)}
                      className="group w-full flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-slate-700/50 active:scale-[0.98]"
                    >
                      <span className="text-xs font-mono text-slate-500 w-5">{index + 1}.</span>
                      <span className="flex-1 text-left text-slate-200 group-hover:text-white transition-colors duration-200">
                        {option.label}
                      </span>
                      <span className={`${option.color} opacity-70 group-hover:opacity-100 transition-opacity duration-200`}>
                        {option.icon}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Other channel input modal */}
          {channelChoice === "other" && !isProcessingOther && demoStep === "awaiting_channel" && (
            <div className="absolute bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-300">
              <div className="mx-4 mb-4 rounded-2xl border border-slate-600/50 bg-slate-800/95 backdrop-blur-md shadow-2xl shadow-slate-900/50 p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <span className="text-amber-500">➕</span> Specify other channel:
                  </p>
                  <button
                    type="button"
                    onClick={() => setChannelChoice(null)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 transition-all duration-200"
                  >
                    <CloseIcon />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={otherChannelValue}
                    onChange={(e) => setOtherChannelValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleConfirmOtherChannel()}
                    placeholder="e.g. Slack, Teams, Discord"
                    className="min-w-0 flex-1 rounded-xl border border-slate-600 bg-slate-900/50 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all duration-200"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleConfirmOtherChannel}
                    disabled={!otherChannelValue.trim()}
                    className="rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-5 py-3 text-sm font-medium text-white hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-amber-500/25"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Final confirmation modal */}
          {showConfirmationModal && (
            <div className="absolute bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-300">
              <div className="mx-4 mb-4 rounded-2xl border border-slate-600/50 bg-slate-800/95 backdrop-blur-md shadow-2xl shadow-slate-900/50 p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <span className="text-emerald-500">✓</span> Ready to execute this plan?
                  </p>
                  <button
                    type="button"
                    onClick={resetDemo}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 transition-all duration-200"
                  >
                    <CloseIcon />
                  </button>
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    className="group w-full flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-emerald-600/20 active:scale-[0.98]"
                  >
                    <span className="text-xs font-mono text-slate-500 w-5">1.</span>
                    <span className="flex-1 text-left text-emerald-400 group-hover:text-emerald-300 transition-colors duration-200 font-semibold">
                      Yes, proceed
                    </span>
                    <svg className="w-5 h-5 text-emerald-400 opacity-70 group-hover:opacity-100 transition-opacity duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={resetDemo}
                    className="group w-full flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-slate-700/50 active:scale-[0.98]"
                  >
                    <span className="text-xs font-mono text-slate-500 w-5">2.</span>
                    <span className="flex-1 text-left text-slate-300 group-hover:text-white transition-colors duration-200">
                      No, revise
                    </span>
                    <svg className="w-5 h-5 text-slate-400 opacity-70 group-hover:opacity-100 transition-opacity duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <label className="mb-2 block text-xs font-medium text-slate-400">Additional instructions or feedback</label>
                  <input
                    type="text"
                    value={finalInput}
                    onChange={(e) => setFinalInput(e.target.value)}
                    placeholder="Enter any follow-up notes, modifications, or concerns..."
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
