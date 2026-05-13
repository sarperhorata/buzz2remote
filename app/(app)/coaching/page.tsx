"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Bot, Network, Send, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ───────────────────────────────────────────────────────────────────

type Mode = "coach" | "networking";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MODES: Record<
  Mode,
  {
    label: string;
    persona: string;
    description: string;
    icon: React.ReactNode;
    avatar: string;
    suggestions: string[];
  }
> = {
  coach: {
    label: "AI Career Coach",
    persona: "Buzz",
    description: "Ask anything about your career, interviews, or job search",
    icon: <Bot className="w-5 h-5" />,
    avatar: "🐝",
    suggestions: [
      "How should I prepare for my next interview?",
      "Help me negotiate my salary",
      "I'm switching careers — where do I start?",
    ],
  },
  networking: {
    label: "Networking Agent",
    persona: "Nate",
    description: "Design your outreach strategy and craft compelling messages",
    icon: <Network className="w-5 h-5" />,
    avatar: "🤝",
    suggestions: [
      "Write me a LinkedIn outreach message",
      "How do I network without it feeling fake?",
      "Help me build a networking strategy",
    ],
  },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function CoachingPage() {
  useSession({ required: true });

  const [mode, setMode] = useState<Mode>("coach");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentMode = MODES[mode];

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`; // max ~3 rows (96px)
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setMessages([]);
    setInput("");
  };

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMessage: Message = { role: "user", content: trimmed };
      const updatedHistory = [...messages, userMessage];

      setMessages(updatedHistory);
      setInput("");
      setIsLoading(true);

      // Placeholder for streaming assistant response
      const assistantMessage: Message = { role: "assistant", content: "" };
      setMessages([...updatedHistory, assistantMessage]);

      try {
        const res = await fetch("/api/coaching/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            mode,
            history: messages, // history before this message
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error("Failed to get response");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: "assistant", content: accumulated };
            return next;
          });
        }
      } catch (err) {
        console.error("Chat error:", err);
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
          };
          return next;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, mode]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Coaching</h1>
        <p className="text-muted-foreground mt-1">
          Your personal AI career advisor and networking expert.
        </p>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-2 gap-4">
        {(Object.keys(MODES) as Mode[]).map((m) => {
          const def = MODES[m];
          const isActive = mode === m;
          return (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex items-start gap-3 p-4 rounded-xl text-left transition-colors ${
                isActive
                  ? "border-2 border-amber-500 bg-amber-50"
                  : "border border-border bg-white hover:border-amber-200 cursor-pointer"
              }`}
            >
              <span
                className={`mt-0.5 flex-shrink-0 ${
                  isActive ? "text-amber-600" : "text-muted-foreground"
                }`}
              >
                {def.icon}
              </span>
              <div>
                <p
                  className={`font-semibold text-sm ${
                    isActive ? "text-amber-700" : "text-foreground"
                  }`}
                >
                  {def.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {def.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Chat container */}
      <div className="bg-white border border-border rounded-xl h-[500px] flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            /* Welcome state */
            <div className="flex flex-col items-center justify-center h-full gap-5 text-center">
              <div className="text-5xl">{currentMode.avatar}</div>
              <div>
                <p className="font-semibold text-foreground">
                  Hi! I&apos;m {currentMode.persona}, your {currentMode.label}.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ask me anything, or pick a suggestion below.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-sm">
                {currentMode.suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-sm text-left px-4 py-2.5 rounded-lg border border-border bg-white hover:border-amber-300 hover:bg-amber-50 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <span className="flex-shrink-0 text-xl leading-none mt-1">
                      {currentMode.avatar}
                    </span>
                  )}
                  <div
                    className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-amber-500 text-white rounded-tr-sm"
                        : "bg-gray-100 text-foreground rounded-tl-sm"
                    }`}
                  >
                    {msg.content === "" && isLoading ? (
                      <span className="text-muted-foreground animate-pulse">
                        ...
                      </span>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-border p-4 flex gap-2 items-end">
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              title="Clear chat"
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors mb-1"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${currentMode.persona} anything…`}
            rows={1}
            className="resize-none border border-border rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
            style={{ minHeight: "38px", maxHeight: "96px" }}
            disabled={isLoading}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 bg-amber-500 hover:bg-amber-600 text-white"
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
