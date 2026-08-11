"use client";

import { useEffect, useState, type FormEvent } from "react";
import { DomainIntro } from "@/components/ui/DomainIntro";
import { Panel } from "@/components/ui/Panel";
import { getDomain } from "@/lib/shared/domains";

const domain = getDomain("workflow");

const FLOW_STEPS = [
  "A support ticket comes in (you write it below).",
  "Gemini classifies category, urgency, and sentiment with structured JSON output.",
  "A triage alert is forwarded to Slack (simulated in this public demo).",
];

const STEPS = ["received", "enriching", "forwarding", "completed"] as const;

type PipelineRun = {
  id: string;
  event_id: string;
  status: "received" | "enriching" | "forwarding" | "completed" | "failed";
  received_at: string;
  payload: { ticket_id: string; subject: string; customer_name: string };
  enrichment: { category: string; urgency: string; sentiment: string; summary: string } | null;
  forwarding: { success: boolean; simulated?: boolean } | null;
  error: { stage: string; message: string } | null;
};

const EXAMPLE = {
  subject: "Invoice charged twice this month",
  body: "Hi, I was charged twice for my Pro subscription on the 3rd. Can you refund the duplicate charge? This is fairly urgent, I need it sorted before month-end reporting.",
};

function StepIndicator({ status }: { status: PipelineRun["status"] }) {
  const failedAt = status === "failed";
  const currentIndex = STEPS.indexOf(status as (typeof STEPS)[number]);

  return (
    <div className="flex items-center gap-1.5">
      {STEPS.map((step, i) => {
        const reached = failedAt ? i <= currentIndex + 1 : i <= currentIndex;
        const isCurrent = !failedAt && i === currentIndex && status !== "completed";
        return (
          <div key={step} className="flex items-center gap-1.5">
            <div
              className={`h-1.5 w-6 rounded-full ${isCurrent ? "animate-breathe" : ""}`}
              style={{
                backgroundColor: failedAt && i === currentIndex + 1 ? "#E2574C" : reached ? domain.colorHex : "#232A31",
              }}
            />
          </div>
        );
      })}
      <span className="ml-1 font-mono text-[11px] text-ink-dim">
        {failedAt ? "failed" : status}
      </span>
    </div>
  );
}

const REVEAL_STAGE_DELAY_MS = 550;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function WorkflowPage() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeRun, setActiveRun] = useState<PipelineRun | null>(null);
  const [runs, setRuns] = useState<PipelineRun[]>([]);

  async function loadRuns() {
    try {
      const res = await fetch("/api/workflow/runs?limit=15", { cache: "no-store" });
      if (res.ok) setRuns(await res.json());
    } catch {
      // best-effort background refresh
    }
  }

  useEffect(() => {
    loadRuns();
    const interval = setInterval(loadRuns, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handleSimulate(event: FormEvent) {
    event.preventDefault();
    if (!subject.trim() || !body.trim() || submitting) return;

    setSubmitting(true);
    setActiveRun({
      id: "pending",
      event_id: "",
      status: "received",
      received_at: new Date().toISOString(),
      payload: { ticket_id: "", subject: subject.trim(), customer_name: "Jordan Rivera" },
      enrichment: null,
      forwarding: null,
      error: null,
    });

    try {
      const res = await fetch("/api/workflow/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), body: body.trim() }),
      });
      const finalRun: PipelineRun & { error?: string } = await res.json();

      if (!res.ok) {
        setSubmitting(false);
        return;
      }

      // The server already ran the full pipeline synchronously (Vercel's
      // Node runtime can't guarantee background work after a response), so
      // this replays the real stages the run actually went through with a
      // deliberate pace instead of a client-side fabrication. Each snapshot
      // is a partial patch merged onto the run in progress; the final one
      // is the real row returned by the server.
      const stageSnapshots: Array<Partial<PipelineRun>> = [
        { status: "enriching" },
        { status: "forwarding", enrichment: finalRun.enrichment },
        finalRun,
      ];

      for (const snapshot of stageSnapshots) {
        await sleep(REVEAL_STAGE_DELAY_MS);
        setActiveRun((prev) => (prev ? { ...prev, ...snapshot } : prev));
      }
      loadRuns();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <DomainIntro domain={domain} steps={FLOW_STEPS} />

      <div className="grid gap-6 md:grid-cols-2">
        <Panel className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-ink">Simulate a ticket</h2>
            <button
              type="button"
              onClick={() => {
                setSubject(EXAMPLE.subject);
                setBody(EXAMPLE.body);
              }}
              className="text-xs text-ink-dim underline decoration-dotted underline-offset-2 hover:text-ink"
            >
              fill example
            </button>
          </div>
          <form onSubmit={handleSimulate} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-ink-dim">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Invoice charged twice this month"
                maxLength={200}
                className="w-full rounded-md border border-line bg-panel-raised px-3 py-2 text-sm text-ink placeholder:text-ink-dim focus:outline-none focus:ring-1 focus:ring-domain-workflow"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink-dim">Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Describe the issue..."
                rows={4}
                maxLength={2000}
                className="w-full resize-none rounded-md border border-line bg-panel-raised px-3 py-2 text-sm text-ink placeholder:text-ink-dim focus:outline-none focus:ring-1 focus:ring-domain-workflow"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !subject.trim() || !body.trim()}
              className="w-full rounded-md px-4 py-2 text-sm font-medium text-void transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
              style={{ backgroundColor: domain.colorHex }}
            >
              {submitting ? "Sending..." : "Simulate ticket"}
            </button>
          </form>

          {activeRun && (
            <div className="mt-5 rounded-md border border-line bg-panel-raised p-3">
              <StepIndicator status={activeRun.status} />
              {activeRun.enrichment && (
                <dl className="mt-3 space-y-1 text-xs text-ink-dim">
                  <div className="flex justify-between">
                    <dt>Category</dt>
                    <dd className="font-mono text-ink">{activeRun.enrichment.category}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Urgency</dt>
                    <dd className="font-mono text-ink">{activeRun.enrichment.urgency}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Sentiment</dt>
                    <dd className="font-mono text-ink">{activeRun.enrichment.sentiment}</dd>
                  </div>
                </dl>
              )}
              {activeRun.forwarding?.simulated && (
                <p className="mt-2 text-[11px] text-ink-dim">
                  Forwarding simulated — no real Slack workspace configured for this public demo.
                </p>
              )}
              {activeRun.error && (
                <p className="mt-2 text-[11px] text-status-error">{activeRun.error.message}</p>
              )}
            </div>
          )}
        </Panel>

        <Panel className="overflow-hidden">
          <h2 className="border-b border-line px-5 py-3 font-display text-sm font-semibold text-ink">
            Recent runs
          </h2>
          <div className="max-h-[420px] overflow-y-auto">
            {runs.length === 0 && (
              <p className="px-5 py-6 text-center text-sm text-ink-dim">No runs yet.</p>
            )}
            {runs.map((run) => (
              <div key={run.id} className="border-b border-line px-5 py-3 last:border-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm text-ink">{run.payload?.subject}</p>
                  <StepIndicator status={run.status} />
                </div>
                {run.enrichment && (
                  <p className="mt-1 font-mono text-[11px] text-ink-dim">
                    {run.enrichment.category} · {run.enrichment.urgency}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
