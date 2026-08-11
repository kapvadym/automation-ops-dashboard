"use client";

import { useEffect, useState, type FormEvent } from "react";
import { DomainIntro } from "@/components/ui/DomainIntro";
import { Panel } from "@/components/ui/Panel";
import { getDomain } from "@/lib/shared/domains";
import { ALLOWED_SCOPES } from "@/lib/keys/scopes";

const domain = getDomain("keys");

const FLOW_STEPS = [
  "A 256-bit random secret is generated and shown to you exactly once.",
  "Only its SHA-256 hash and a short display prefix are stored — the plaintext is never persisted.",
  "Revoking sets a timestamp (soft delete) so past usage stays auditable.",
];

interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export default function KeysPage() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["read"]);
  const [creating, setCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadKeys() {
    setLoading(true);
    try {
      const res = await fetch("/api/keys", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setKeys(data.keys ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadKeys();
  }, []);

  function toggleScope(scope: string) {
    setScopes((prev) => (prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]));
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || creating) return;

    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), scopes }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to create key");
        return;
      }

      setRevealedKey(data.plaintextKey);
      setName("");
      loadKeys();
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    await fetch(`/api/keys/${id}/revoke`, { method: "POST" });
    loadKeys();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <DomainIntro
        domain={domain}
        steps={FLOW_STEPS}
        note="Shared public demo account — everyone visiting this page sees the same key list. In the original project this is real per-user Supabase Auth with row-level security; here it's one fixed demo account so you can try it without signing up."
      />

      {revealedKey && (
        <Panel className="mb-6 border-status-healthy/40 p-4">
          <p className="mb-2 text-xs text-ink-dim">
            Your new key — copy it now, it won&apos;t be shown again:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-md bg-panel-raised px-3 py-2 font-mono text-xs text-status-healthy">
              {revealedKey}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(revealedKey)}
              className="rounded-md border border-line px-3 py-2 text-xs text-ink hover:bg-panel-raised"
            >
              Copy
            </button>
            <button
              onClick={() => setRevealedKey(null)}
              className="rounded-md border border-line px-3 py-2 text-xs text-ink-dim hover:bg-panel-raised"
            >
              Dismiss
            </button>
          </div>
        </Panel>
      )}

      <Panel className="mb-6 p-5">
        <h2 className="mb-3 font-display text-sm font-semibold text-ink">Create a key</h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-ink-dim">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CI pipeline"
              maxLength={100}
              className="w-full rounded-md border border-line bg-panel-raised px-3 py-2 text-sm text-ink placeholder:text-ink-dim focus:outline-none focus:ring-1 focus:ring-domain-keys"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ink-dim">Scopes</label>
            <div className="flex gap-3 py-2">
              {ALLOWED_SCOPES.map((scope) => (
                <label key={scope} className="flex items-center gap-1.5 text-xs text-ink">
                  <input
                    type="checkbox"
                    checked={scopes.includes(scope)}
                    onChange={() => toggleScope(scope)}
                    className="accent-domain-keys"
                  />
                  {scope}
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="rounded-md px-4 py-2 text-sm font-medium text-void transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
            style={{ backgroundColor: domain.colorHex }}
          >
            {creating ? "Creating..." : "Create key"}
          </button>
        </form>
        {error && <p className="mt-2 text-xs text-status-error">{error}</p>}
      </Panel>

      <Panel className="overflow-hidden">
        <h2 className="border-b border-line px-5 py-3 font-display text-sm font-semibold text-ink">
          Keys
        </h2>
        {loading ? (
          <p className="px-5 py-6 text-center text-sm text-ink-dim">Loading...</p>
        ) : keys.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-ink-dim">No keys yet.</p>
        ) : (
          <div className="divide-y divide-line">
            {keys.map((key) => (
              <div key={key.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{key.name}</p>
                  <p className="font-mono text-[11px] text-ink-dim">
                    {key.key_prefix}… · {key.scopes.join(", ") || "no scopes"}
                  </p>
                </div>
                {key.revoked_at ? (
                  <span className="shrink-0 text-xs text-status-error">revoked</span>
                ) : (
                  <button
                    onClick={() => handleRevoke(key.id)}
                    className="shrink-0 rounded-md border border-line px-3 py-1.5 text-xs text-ink-dim hover:border-status-error hover:text-status-error"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
