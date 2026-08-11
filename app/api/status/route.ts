import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import type { DomainId } from "@/lib/shared/domains";

export const dynamic = "force-dynamic";

// A lightweight `select count` against each domain's primary table — cheap
// enough to poll from every visitor's browser every 15s, and a real
// connectivity check (not hardcoded) so the status rail's pulse dots mean
// something. RLS scoping (e.g. keys_api_keys) doesn't affect whether the
// query itself succeeds, so this works without the service-role key too.
const TABLES: Record<DomainId, string> = {
  rag: "rag_documents",
  workflow: "workflow_pipeline_runs",
  agent: "agent_sessions",
  keys: "keys_api_keys",
};

export async function GET() {
  const results = await Promise.all(
    (Object.entries(TABLES) as [DomainId, string][]).map(async ([domain, table]) => {
      const query =
        domain === "keys"
          ? supabase.from(table).select("*", { count: "exact", head: true }).is("revoked_at", null)
          : supabase.from(table).select("*", { count: "exact", head: true });
      const { count, error } = await query;
      return [domain, { status: error ? "error" : "healthy", count: count ?? 0 }] as const;
    })
  );

  const status = Object.fromEntries(results.map(([domain, r]) => [domain, r.status]));
  const counts = Object.fromEntries(results.map(([domain, r]) => [domain, r.count]));

  return NextResponse.json({ status, counts, checkedAt: new Date().toISOString() });
}
