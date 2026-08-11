import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateApiKey } from "@/lib/keys/apiKey";
import { validateScopes } from "@/lib/keys/scopes";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { keysRateLimiter } from "@/lib/shared/rateLimit";

// This domain is the only one of the 4 with real Supabase Auth in its
// original project — shown here via one fixed demo account (server-side,
// service-role client) instead of a visitor-facing login flow, per the
// approved plan. Every visitor shares this account, so created/revoked
// keys are visible to everyone — flagged in the UI, not a bug.
const DEMO_USER_ID = process.env.DEMO_USER_ID;
const MAX_DEMO_KEYS = 30;

const createKeySchema = z.object({
  name: z.string().trim().min(1).max(100),
  scopes: z.array(z.unknown()).default([]),
});

export async function GET() {
  if (!DEMO_USER_ID) {
    return NextResponse.json({ error: "DEMO_USER_ID is not configured" }, { status: 500 });
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("keys_api_keys")
    .select("id, name, key_prefix, scopes, created_at, last_used_at, revoked_at")
    .eq("user_id", DEMO_USER_ID)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ keys: data });
}

export async function POST(request: NextRequest) {
  if (!DEMO_USER_ID) {
    return NextResponse.json({ error: "DEMO_USER_ID is not configured" }, { status: 500 });
  }

  const identifier = request.headers.get("x-forwarded-for") ?? "anonymous";
  if (keysRateLimiter.isLimited(identifier)) {
    return NextResponse.json({ error: "Too many requests, please slow down." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request body" },
      { status: 400 }
    );
  }

  const scopeResult = validateScopes(parsed.data.scopes);
  if (!scopeResult.valid) {
    return NextResponse.json({ error: scopeResult.error }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }

  const { count } = await supabase
    .from("keys_api_keys")
    .select("id", { count: "exact", head: true })
    .eq("user_id", DEMO_USER_ID);

  if ((count ?? 0) >= MAX_DEMO_KEYS) {
    return NextResponse.json(
      { error: `This public demo account is capped at ${MAX_DEMO_KEYS} keys — revoke one first.` },
      { status: 429 }
    );
  }

  const { plaintextKey, keyPrefix, keyHash } = generateApiKey();

  const { data, error } = await supabase
    .from("keys_api_keys")
    .insert({
      user_id: DEMO_USER_ID,
      name: parsed.data.name,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      scopes: scopeResult.scopes,
    })
    .select("id, name, scopes, key_prefix, created_at, last_used_at, revoked_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ...data, plaintextKey }, { status: 201 });
}
