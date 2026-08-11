import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase/client";
import { processRun } from "@/lib/workflow/pipeline";
import { workflowSimulateRateLimiter } from "@/lib/shared/rateLimit";

export const maxDuration = 30;

const simulateSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(2000),
  customer_name: z.string().trim().min(1).max(100).default("Jordan Rivera"),
  customer_email: z.string().trim().email().default("jordan.rivera@example.com"),
});

export async function POST(request: NextRequest) {
  const identifier = request.headers.get("x-forwarded-for") ?? "anonymous";

  if (workflowSimulateRateLimiter.isLimited(identifier)) {
    return NextResponse.json({ error: "Too many requests, please slow down." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = simulateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request body" },
      { status: 400 }
    );
  }

  const ticketId = `tkt_${crypto.randomUUID().slice(0, 8)}`;
  const payload = {
    ticket_id: ticketId,
    customer_email: parsed.data.customer_email,
    customer_name: parsed.data.customer_name,
    subject: parsed.data.subject,
    body: parsed.data.body,
  };

  const { data, error } = await supabase
    .from("workflow_pipeline_runs")
    .insert({
      event_id: `evt_${crypto.randomUUID()}`,
      event_type: "ticket.created",
      status: "received",
      payload,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create run" },
      { status: 500 }
    );
  }

  const runId = data.id as string;

  // Vercel's Node.js serverless runtime doesn't guarantee work continues
  // after a response is sent, so this awaits the full pipeline (enrich +
  // forward) before responding, then hands back every stage's real result
  // in one shot. The frontend replays it as a staged reveal — real data,
  // deliberately paced — rather than polling for live DB transitions.
  await processRun(runId, payload);

  const { data: finalRun, error: fetchError } = await supabase
    .from("workflow_pipeline_runs")
    .select()
    .eq("id", runId)
    .single();

  if (fetchError || !finalRun) {
    return NextResponse.json({ error: "Run completed but could not be reloaded" }, { status: 500 });
  }

  return NextResponse.json(finalRun);
}
