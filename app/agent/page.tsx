"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ChatThread, type ChatBubbleMessage } from "@/components/ui/ChatThread";
import { DomainIntro } from "@/components/ui/DomainIntro";
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

const SESSION_STORAGE_KEY = "automation-ops-dashboard.agent.sessionId";
const CLIENT_TIMEOUT_MS = 30_000;

const EXAMPLE_PROMPTS = [
  "What's 18% of 240, plus 15?",
  "Find me in-stock Kitchen products under $30 rated above 4.5",
  "What time is it in Tokyo right now?",
];

function ToolCallChips({ toolCalls }: { toolCalls: ToolCallTrace[] }) {
  if (toolCalls.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {toolCalls.map((tc, i) => (
        <span
          key={i}
          className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-ink-dim"
          title={JSON.stringify(tc.result ?? tc.error)}
        >
          🔧 {tc.name}
        </span>
      ))}
    </div>
  );
}

export default function AgentPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatBubbleMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let id = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    setSessionId(id);
  }, []);

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

      const toolCalls: ToolCallTrace[] = data.toolCalls ?? [];
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: data.reply, meta: <ToolCallChips toolCalls={toolCalls} /> },
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
      <DomainIntro domain={domain} steps={FLOW_STEPS} />

      <Panel className="flex h-[60vh] flex-col overflow-hidden">
        <ChatThread
          messages={messages}
          loading={loading}
          accentColor={domain.colorHex}
          emptyState={
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
          }
        />

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
