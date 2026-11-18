import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { withTimeout } from "@/lib/shared/withTimeout";

export const dynamic = "force-dynamic";

// Keep-alive target for the daily Vercel Cron (see vercel.json). Supabase
// free tier pauses a project after ~7 days without activity, which breaks
// the live demo; one real round-trip through PostgREST to Postgres a day
// counts as activity. Deliberately tiny and detail-free so it's safe to
// leave public — returns 503 on failure so a broken DB shows up in the
// cron's log instead of passing silently.
export async function GET() {
  const startedAt = Date.now();
  try {
    const { error } = await withTimeout(
      Promise.resolve(supabase.from("rag_documents").select("id").limit(1)),
      5000,
      "Database health check timed out"
    );
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, latencyMs: Date.now() - startedAt });
  } catch (err) {
    console.error("[health] database check failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
