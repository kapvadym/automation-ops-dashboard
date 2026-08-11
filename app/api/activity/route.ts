import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import type { DomainId } from "@/lib/shared/domains";

export const dynamic = "force-dynamic";

interface ActivityEvent {
  id: string;
  domain: DomainId;
  label: string;
  timestamp: string;
}

const PER_DOMAIN_LIMIT = 6;
const TOTAL_LIMIT = 15;

// Merges real recent rows from all 4 domains into one time-sorted feed —
// the main device (per the approved plan's "Visual design" section) that
// makes the overview page read as a single control plane rather than 4
// stitched-together demos.
export async function GET() {
  const [rag, workflow, agent, keys] = await Promise.all([
    supabase
      .from("rag_documents")
      .select("id, source, created_at")
      .order("created_at", { ascending: false })
      .limit(PER_DOMAIN_LIMIT),
    supabase
      .from("workflow_pipeline_runs")
      .select("id, payload, status, received_at")
      .order("received_at", { ascending: false })
      .limit(PER_DOMAIN_LIMIT),
    supabase
      .from("agent_sessions")
      .select("id, created_at")
      .order("created_at", { ascending: false })
      .limit(PER_DOMAIN_LIMIT),
    supabase
      .from("keys_api_keys")
      .select("id, name, created_at")
      .order("created_at", { ascending: false })
      .limit(PER_DOMAIN_LIMIT),
  ]);

  const events: ActivityEvent[] = [
    ...(rag.data ?? []).map((row) => ({
      id: `rag-${row.id}`,
      domain: "rag" as const,
      label: `Doc chunk ingested — ${row.source}`,
      timestamp: row.created_at,
    })),
    ...(workflow.data ?? []).map((row) => ({
      id: `workflow-${row.id}`,
      domain: "workflow" as const,
      label: `Ticket run "${row.payload?.subject ?? "untitled"}" — ${row.status}`,
      timestamp: row.received_at,
    })),
    ...(agent.data ?? []).map((row) => ({
      id: `agent-${row.id}`,
      domain: "agent" as const,
      label: "New agent session started",
      timestamp: row.created_at,
    })),
    ...(keys.data ?? []).map((row) => ({
      id: `keys-${row.id}`,
      domain: "keys" as const,
      label: `API key created — ${row.name}`,
      timestamp: row.created_at,
    })),
  ];

  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return NextResponse.json({ events: events.slice(0, TOTAL_LIMIT) });
}
