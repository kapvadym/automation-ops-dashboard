import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

const DEMO_USER_ID = process.env.DEMO_USER_ID;

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("user_id", DEMO_USER_ID)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ revoked: Boolean(data) });
}
