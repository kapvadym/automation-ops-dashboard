import { supabase } from "@/lib/supabase/client";
import { withRetry } from "@/lib/shared/retry";
import { classifyTicket } from "./gemini";
import { buildSlackMessage, sendSlackMessage } from "./slack";

const RETRY_OPTIONS = { retries: 1, backoffMs: 1500 };

export interface TicketPayload {
  ticket_id: string;
  customer_email: string;
  customer_name: string;
  subject: string;
  body: string;
}

async function patchRun(runId: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await supabase
    .from("workflow_pipeline_runs")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", runId);

  if (error) {
    console.error(`Failed to update workflow_pipeline_runs row ${runId}:`, error.message);
  }
}

// Adapted from workflow-automation-api's processRun. The original is
// triggered by an HMAC-signed external webhook; this "simulate" version is
// invoked directly by the dashboard's own /api/workflow/simulate route, so
// there's no signature hop for an internal demo trigger — same enrichment
// and forwarding logic otherwise. Slack forwarding is deliberately
// simulated (not a real webhook call) unless SLACK_WEBHOOK_URL is set, so a
// public demo doesn't spam a real Slack workspace by default.
export async function processRun(runId: string, payload: TicketPayload): Promise<void> {
  await patchRun(runId, { status: "enriching" });

  let enrichment;
  try {
    enrichment = await withRetry(() => classifyTicket(payload.subject, payload.body), RETRY_OPTIONS);
  } catch (error) {
    await patchRun(runId, {
      status: "failed",
      error: { stage: "enrichment", message: (error as Error).message },
    });
    return;
  }

  await patchRun(runId, { status: "forwarding", enrichment });

  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!slackWebhookUrl) {
    await patchRun(runId, {
      status: "completed",
      forwarding: {
        channel: "slack",
        success: true,
        simulated: true,
        responseSnippet: "Simulated — no SLACK_WEBHOOK_URL configured for this public demo.",
      },
    });
    return;
  }

  try {
    const message = buildSlackMessage(payload, enrichment);
    const responseSnippet = await withRetry(
      () => sendSlackMessage(slackWebhookUrl, message),
      RETRY_OPTIONS
    );
    await patchRun(runId, {
      status: "completed",
      forwarding: { channel: "slack", success: true, responseSnippet: responseSnippet.slice(0, 200) },
    });
  } catch (error) {
    await patchRun(runId, {
      status: "failed",
      error: { stage: "forwarding", message: (error as Error).message },
    });
  }
}
