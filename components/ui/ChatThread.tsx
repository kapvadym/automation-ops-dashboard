"use client";

import { useEffect, useRef, type ReactNode } from "react";

export interface ChatBubbleMessage {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  meta?: ReactNode;
}

export function ChatThread({
  messages,
  loading,
  emptyState,
  accentColor,
}: {
  messages: ChatBubbleMessage[];
  loading: boolean;
  emptyState: ReactNode;
  accentColor: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
      {messages.length === 0 && emptyState}

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
              style={m.role === "user" ? { backgroundColor: accentColor } : undefined}
            >
              {m.content}
            </div>
            {m.meta}
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
  );
}
