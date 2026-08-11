"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DOMAINS, type DomainId } from "@/lib/shared/domains";
import { StatusPill, type SystemStatus } from "./StatusPill";

type StatusMap = Record<DomainId, SystemStatus>;

const INITIAL_STATUS: StatusMap = {
  rag: "pending",
  workflow: "pending",
  agent: "pending",
  keys: "pending",
};

const POLL_INTERVAL_MS = 15_000;

// The signature element from the Visual design plan: this nav doubles as a
// live status readout (each dot is a real /api/status health check, not
// decorative), so browsing the portfolio and watching the systems run are
// the same object.
export function StatusRail() {
  const pathname = usePathname();
  const [status, setStatus] = useState<StatusMap>(INITIAL_STATUS);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/status", { cache: "no-store" });
        if (!res.ok) throw new Error("status check failed");
        const data = await res.json();
        if (!cancelled) setStatus(data.status);
      } catch {
        if (!cancelled) {
          setStatus((prev) => {
            const next = { ...prev };
            for (const domain of DOMAINS) next[domain.id] = "error";
            return next;
          });
        }
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const isOverview = pathname === "/";

  const entries = (
    <>
      <Link
        href="/"
        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
          isOverview ? "bg-panel-raised text-ink" : "text-ink-dim hover:bg-panel-raised hover:text-ink"
        }`}
      >
        <span className="font-display text-ink">Overview</span>
      </Link>
      {DOMAINS.map((domain) => {
        const active = pathname === domain.href;
        return (
          <Link
            key={domain.id}
            href={domain.href}
            className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
              active ? "bg-panel-raised text-ink" : "text-ink-dim hover:bg-panel-raised hover:text-ink"
            }`}
          >
            <span className="flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: domain.colorHex }}
              />
              {domain.shortLabel}
            </span>
            <StatusPill status={status[domain.id]} label="" />
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* Desktop: pinned left rail */}
      <nav className="hidden w-56 shrink-0 flex-col gap-1 border-r border-line bg-void px-3 py-6 md:flex">
        <div className="mb-4 px-3">
          <p className="font-display text-sm font-semibold text-ink">automation-ops</p>
          <p className="text-[11px] text-ink-dim">live systems console</p>
        </div>
        {entries}
      </nav>

      {/* Mobile: horizontal top bar */}
      <nav className="flex items-center gap-1 overflow-x-auto border-b border-line bg-void px-3 py-2 md:hidden">
        {entries}
      </nav>
    </>
  );
}
