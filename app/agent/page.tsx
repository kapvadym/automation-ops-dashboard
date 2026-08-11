"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { getDomain } from "@/lib/shared/domains";

const domain = getDomain("agent");

const FLOW_STEPS = [
  "Your message + the session's stored history is sent to Gemini with 4 tool declarations.",
  "Gemini decides whether to call a tool (calculator, date/time, product search, web search) or just reply.",
  "Tool results are fed back to Gemini, which writes the final reply — this can loop a few times per turn.",
];

interface ToolCallTrace {
  name: string;
  args: unknown;
  result?: unknown;
  error?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  toolCalls?: ToolCallTrace[];
}

const SESSION_STORAGE_KEY = "automation-ops-dashboard.agent.sessionId";
const CLIENT_TIMEOUT_MS = 30_000;

const EXAMPLE_PROMPTS = [
  "What's 18% of 240, plus 15?",
  "Find me in-stock Kitchen products under $30 rated above 4.5",
  "What time is it in Tokyo right now?",
];

export default function AgentPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let id = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    setSessionId(id);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading || !sessionId) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: text }]);
    setMessage("");
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
        signal: controller.signal,
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "error", content: data.error ?? "Something went wrong" },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: data.reply, toolCalls: data.toolCalls },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "error", content: "Network error or timeout — please try again" },
      ]);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    send(message);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <header className="mb-6">
        <p className="font-mono text-xs" style={{ color: domain.colorHex }}>
          {domain.githubRepo}
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink">{domain.label}</h1>
      </header>

      <Panel accent={domain.colorHex} className="mb-6 p-5">
        <p className="text-sm text-ink-dim">{domain.tagline}</p>
        <ol className="mt-3 space-y-1.5 text-sm text-ink">
          {FLOW_STEPS.map((step, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-mono text-xs text-ink-dim">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          {domain.techBadges.map((b) => (
            <Badge key={b}>{b}</Badge>
          ))}
        </div>
      </Panel>

      <Panel className="flex h-[60vh] flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <div className="mt-4 space-y-3 text-center">
              <p className="text-sm text-ink-dim">
                Memory persists across turns in this session — try a follow-up question.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {EXAMPLE_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-dim hover:border-domain-agent hover:text-ink"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex animate-fade-in-up ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[85%] space-y-1.5">
                <div
                  className={`whitespace-pre-wrap rounded-xl px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "text-void"
                      : m.role === "error"
                        ? "border border-status-error/30 bg-status-error/10 text-status-error"
                        : "bg-panel-raised text-ink"
                  }`}
                  style={m.role === "user" ? { backgroundColor: domain.colorHex } : undefined}
                >
                  {m.content}
                </div>
                {m.toolCalls && m.toolCalls.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.toolCalls.map((tc, i) => (
                      <span
                        key={i}
                        className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-ink-dim"
                        title={JSON.stringify(tc.result ?? tc.error)}
                      >
                        🔧 {tc.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex w-fit animate-fade-in-up items-center gap-1.5 rounded-xl bg-panel-raised px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-dim [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-dim [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-dim" />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 border-t border-line p-3">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask the agent anything..."
            disabled={loading}
            className="flex-1 rounded-md border border-line bg-panel-raised px-3 py-2 text-sm text-ink placeholder:text-ink-dim focus:outline-none focus:ring-1 focus:ring-domain-agent disabled:opacity-60"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="rounded-md px-4 py-2 text-sm font-medium text-void transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
            style={{ backgroundColor: domain.colorHex }}
          >
            Send
          </button>
        </form>
      </Panel>
    </div>
  );
}
