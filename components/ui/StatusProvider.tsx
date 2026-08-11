"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DOMAINS, type DomainId } from "@/lib/shared/domains";
import type { SystemStatus } from "./StatusPill";

interface StatusContextValue {
  status: Record<DomainId, SystemStatus>;
  counts: Record<DomainId, number>;
}

const INITIAL: StatusContextValue = {
  status: Object.fromEntries(DOMAINS.map((d) => [d.id, "pending"])) as Record<DomainId, SystemStatus>,
  counts: Object.fromEntries(DOMAINS.map((d) => [d.id, 0])) as Record<DomainId, number>,
};

const StatusContext = createContext<StatusContextValue>(INITIAL);

const POLL_INTERVAL_MS = 15_000;

// Polls /api/status exactly once per app instance and shares the result via
// context — the status rail and the overview page both need it, and
// polling it twice on the same page load doubled the network traffic and
// the polling/error-handling logic.
export function StatusProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<StatusContextValue>(INITIAL);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/status", { cache: "no-store" });
        if (!res.ok) throw new Error("status check failed");
        const data = await res.json();
        if (!cancelled) setValue({ status: data.status, counts: data.counts });
      } catch {
        if (!cancelled) {
          setValue((prev) => ({
            ...prev,
            status: Object.fromEntries(DOMAINS.map((d) => [d.id, "error"])) as Record<
              DomainId,
              SystemStatus
            >,
          }));
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

  return <StatusContext.Provider value={value}>{children}</StatusContext.Provider>;
}

export function useStatusContext() {
  return useContext(StatusContext);
}
