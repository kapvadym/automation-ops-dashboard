"use client";

import { useRef, useState, type FormEvent } from "react";
import { ChatThread, type ChatBubbleMessage } from "@/components/ui/ChatThread";
import { DomainIntro } from "@/components/ui/DomainIntro";
import { Panel } from "@/components/ui/Panel";
import { getDomain } from "@/lib/shared/domains";

const domain = getDomain("rag");

interface Source {
  source: string;
  similarity: number;
}

const CLIENT_TIMEOUT_MS = 25_000;

const FLOW_STEPS = [
  "Your question is embedded into a 768-dim vector with Gemini.",
  "Postgres/pgvector finds the closest documentation chunks by cosine similarity.",
  "Gemini writes a grounded answer, citing the chunks it actually used.",
];

function SourceChips({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {sources.map((s, i) => (
        <li key={i} className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-ink-dim">
          [{i + 1}] {s.source} · {(s.similarity * 100).toFixed(0)}%
        </li>
      ))}
    </ul>
  );
}

export default function RagPage() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatBubbleMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const abortReasonRef = useRef<"manual" | "timeout" | null>(null);

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

      const sources: Source[] = data.sources ?? [];
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: data.answer, meta: <SourceChips sources={sources} /> },
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
      <DomainIntro
        domain={domain}
        steps={FLOW_STEPS}
        note={
          'Docs corpus: a small fictional REST API ("Acme Tasks API") — ask about authentication, endpoints, rate limits, or errors. Off-topic questions get an honest "I don\'t know" instead of a guess.'
        }
      />

      <Panel className="flex h-[60vh] flex-col overflow-hidden">
        <ChatThread
          messages={messages}
          loading={loading}
          accentColor={domain.colorHex}
          emptyState={
            <p className="mt-6 text-center text-sm text-ink-dim">Ask anything about the Acme Tasks API docs.</p>
          }
        />

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
