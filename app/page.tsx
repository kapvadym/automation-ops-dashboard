"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { StatTile } from "@/components/ui/StatTile";
import { StatusPill } from "@/components/ui/StatusPill";
import { useStatusContext } from "@/components/ui/StatusProvider";
import { DOMAINS, type DomainId } from "@/lib/shared/domains";

interface ActivityEvent {
  id: string;
  domain: DomainId;
  label: string;
  timestamp: string;
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function OverviewPage() {
  const { status, counts } = useStatusContext();
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    async function loadActivity() {
      const res = await fetch("/api/activity", { cache: "no-store" });
      if (res.ok) setEvents((await res.json()).events);
    }
    loadActivity();
    const interval = setInterval(loadActivity, 15_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-ink">automation-ops-dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-dim">
          A live systems console for 4 backend/AI-agent projects — a RAG docs agent, a workflow
          automation pipeline, a tool-calling agent, and an API key manager. Every metric and demo
          below hits a real Supabase database and real Gemini calls, not fixtures.
        </p>
      </header>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {DOMAINS.map((domain) => (
          <Panel key={domain.id} accent={domain.colorHex} className="p-5">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h2 className="font-display text-base font-semibold text-ink">{domain.label}</h2>
              <StatusPill status={status[domain.id]} />
            </div>
            <p className="mb-4 text-sm text-ink-dim">{domain.tagline}</p>
            <div className="mb-4 flex items-center gap-6">
              <StatTile label={domain.statLabel} value={counts[domain.id] ?? "—"} />
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {domain.techBadges.map((b) => (
                <Badge key={b}>{b}</Badge>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm">
              <Link href={domain.href} className="font-medium hover:underline" style={{ color: domain.colorHex }}>
                Try it →
              </Link>
              <a
                href={`https://github.com/${domain.githubRepo}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs text-ink-dim hover:text-ink"
              >
                {domain.githubRepo}
              </a>
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <h2 className="border-b border-line px-5 py-3 font-display text-sm font-semibold text-ink">
          Activity across all 4 systems
        </h2>
        <div className="max-h-96 overflow-y-auto">
          {events.length === 0 && <p className="px-5 py-6 text-center text-sm text-ink-dim">No activity yet.</p>}
          {events.map((event) => {
            const domainMeta = DOMAINS.find((d) => d.id === event.domain)!;
            return (
              <div key={event.id} className="flex items-center gap-3 border-b border-line px-5 py-2.5 last:border-0">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: domainMeta.colorHex }}
                />
                <p className="min-w-0 flex-1 truncate text-sm text-ink">{event.label}</p>
                <span className="shrink-0 font-mono text-[11px] text-ink-dim">{timeAgo(event.timestamp)}</span>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
