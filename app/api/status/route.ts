import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { DOMAINS } from "@/lib/shared/domains";

export const dynamic = "force-dynamic";

// A lightweight `select count` against each domain's primary table (from
// the single DOMAINS source of truth) — cheap enough to poll from every
// visitor's browser every 15s, and a real connectivity check (not
// hardcoded) so the status rail's pulse dots mean something. RLS scoping
// (e.g. keys_api_keys) doesn't affect whether the query itself succeeds,
// so this works without the service-role key too.
export async function GET() {
  const results = await Promise.all(
    DOMAINS.map(async ({ id: domain, table }) => {
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
