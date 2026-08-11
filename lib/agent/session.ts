import type { Content } from "@google/genai";
import { supabase } from "@/lib/supabase/client";
import type { ToolCallTrace } from "./gemini";

export interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  tool_calls: ToolCallTrace[] | null;
}

export async function touchSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from("agent_sessions")
    .upsert({ id: sessionId, last_active_at: new Date().toISOString() });

  if (error) {
    throw new Error(`Failed to touch session: ${error.message}`);
  }
}

export async function loadHistory(sessionId: string): Promise<Content[]> {
  const { data, error } = await supabase
    .from("agent_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load session history: ${error.message}`);
  }

  return (data ?? []).map((message) => ({
    role: message.role === "user" ? "user" : "model",
    parts: [{ text: message.content }],
  }));
}

export async function saveMessage(sessionId: string, message: StoredMessage): Promise<void> {
  const { error } = await supabase.from("agent_messages").insert({
    session_id: sessionId,
    role: message.role,
    content: message.content,
    tool_calls: message.tool_calls,
  });

  if (error) {
    throw new Error(`Failed to save message: ${error.message}`);
  }
}
