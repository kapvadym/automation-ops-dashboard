"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { getDomain } from "@/lib/shared/domains";

const domain = getDomain("rag");

interface Source {
  source: string;
  similarity: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  sources?: Source[];
}

const CLIENT_TIMEOUT_MS = 25_000;

const FLOW_STEPS = [
  "Your question is embedded into a 768-dim vector with Gemini.",
  "Postgres/pgvector finds the closest documentation chunks by cosine similarity.",
  "Gemini writes a grounded answer, citing the chunks it actually used.",
];

export default function RagPage() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const abortReasonRef = useRef<"manual" | "timeout" | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleStop() {
    abortReasonRef.current = "manual";
    controllerRef.current?.abort();
  }

  async function handleAsk(event: FormEvent) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: trimmed }]);
    setQuestion("");
    setLoading(true);

    const controller = new AbortController();
    controllerRef.current = controller;
    abortReasonRef.current = null;

    const timeoutId = setTimeout(() => {
      abortReasonRef.current = "timeout";
      controller.abort();
    }, CLIENT_TIMEOUT_MS);

    try {
      const res = await fetch("/api/rag/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
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
        { id: crypto.randomUUID(), role: "assistant", content: data.answer, sources: data.sources ?? [] },
      ]);
    } catch (err) {
      const wasAborted = err instanceof DOMException && err.name === "AbortError";
      const message = wasAborted
        ? abortReasonRef.current === "manual"
          ? "Stopped — response cancelled."
          : "This is taking longer than expected — the agent didn't respond in time. Please try again."
        : "Network error — please try again";

      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "error", content: message }]);
    } finally {
      clearTimeout(timeoutId);
      controllerRef.current = null;
      setLoading(false);
    }
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
        <p className="mt-3 text-xs text-ink-dim">
          Docs corpus: a small fictional REST API ("Acme Tasks API") — ask about
          authentication, endpoints, rate limits, or errors. Off-topic questions get an
          honest "I don't know" instead of a guess.
        </p>
      </Panel>

      <Panel className="flex h-[60vh] flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <p className="mt-6 text-center text-sm text-ink-dim">
              Ask anything about the Acme Tasks API docs.
            </p>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex animate-fade-in-up ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[85%] space-y-2">
                <div
                  className={`whitespace-pre-wrap rounded-xl px-4 py-2.5 text-sm ${
                    message.role === "user"
                      ? "text-void"
                      : message.role === "error"
                        ? "border border-status-error/30 bg-status-error/10 text-status-error"
                        : "bg-panel-raised text-ink"
                  }`}
                  style={message.role === "user" ? { backgroundColor: domain.colorHex } : undefined}
                >
                  {message.content}
                </div>
                {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5">
                    {message.sources.map((s, i) => (
                      <li key={i} className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-ink-dim">
                        [{i + 1}] {s.source} · {(s.similarity * 100).toFixed(0)}%
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex animate-fade-in-up items-center gap-1.5 rounded-xl bg-panel-raised px-4 py-3 w-fit">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-dim [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-dim [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-dim" />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleAsk} className="flex gap-2 border-t border-line p-3">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about authentication, endpoints, rate limits..."
            disabled={loading}
            className="flex-1 rounded-md border border-line bg-panel-raised px-3 py-2 text-sm text-ink placeholder:text-ink-dim focus:outline-none focus:ring-1 focus:ring-domain-rag disabled:opacity-60"
            maxLength={500}
          />
          <button
            type={loading ? "button" : "submit"}
            onClick={loading ? handleStop : undefined}
            disabled={!loading && !question.trim()}
            className="rounded-md px-4 py-2 text-sm font-medium text-void transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
            style={{ backgroundColor: loading ? "#E2574C" : domain.colorHex }}
          >
            {loading ? "Stop" : "Ask"}
          </button>
        </form>
      </Panel>
    </div>
  );
}
