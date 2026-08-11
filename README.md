# automation-ops-dashboard

A live systems console for 4 backend/AI-agent projects — one Next.js app,
one Supabase project, real Gemini calls. Every metric and demo hits a real
database, not fixtures.

| domain | what it does | tech | source |
|---|---|---|---|
| **RAG Docs Agent** | Answers questions from documentation with cited, grounded sources — refuses to guess outside its docs. | Gemini + pgvector | [kapvadym/rag-docs-support-agent](https://github.com/kapvadym/rag-docs-support-agent) |
| **Workflow Automation** | Classifies an incoming support ticket with Gemini and forwards a triage alert, tracking each run's status. | Gemini structured output | [kapvadym/workflow-automation-api](https://github.com/kapvadym/workflow-automation-api) |
| **Tool-Calling Agent** | A conversational agent that calls real tools (calculator, web search, product lookup) and remembers the conversation. | Gemini tool-calling + Tavily | [kapvadym/llm-tool-agent-memory](https://github.com/kapvadym/llm-tool-agent-memory) |
| **API Key Manager** | Issue, list, and revoke API keys — shown once in plaintext, hashed thereafter. | Supabase Auth + SHA-256 | [kapvadym/api-key-manager](https://github.com/kapvadym/api-key-manager) |

## Why this exists

Each of the 4 projects above is a standalone, independently deployable app
with its own repo and its own Supabase project. This dashboard is a
**separate, new application** — new repo, new code, new database — that
reimplements the live-interactive core of all 4 as adapted modules inside
one Next.js app, so a single deploy and a single free-tier Supabase project
can demonstrate all of them at once. The original 4 repos are untouched and
linked above for reference; this app doesn't call them at runtime.

## Architecture

- **One Supabase project, domain-prefixed tables**: `rag_documents` (+
  pgvector), `workflow_pipeline_runs`, `agent_sessions` /
  `agent_messages` / `agent_products`, `keys_api_keys` — same shapes as
  each original project's schema, just namespaced to share one database.
  See `supabase/schema.sql`.
- **Status rail nav**: the left-hand navigation doubles as a live status
  readout — each dot is a real health check (`/api/status`) against that
  domain's table, not decorative.
- **Cross-domain activity feed**: the overview page merges real recent rows
  from all 4 tables into one time-sorted feed (`/api/activity`), so the
  dashboard reads as one control plane rather than 4 stitched-together
  demos.
- **Keys domain via a shared demo account**: this is the only one of the 4
  with real Supabase Auth in its original project. Rather than a
  visitor-facing signup/login flow, the dashboard uses one fixed demo user
  (server-side, service-role client) — every visitor shares it, which is
  flagged directly in the UI. See `lib/supabase/serviceRole.ts`.
- **Workflow forwarding is simulated** unless `SLACK_WEBHOOK_URL` is set,
  so a public demo doesn't spam a real Slack workspace by default — the
  classification step is always real.

## Local development

```bash
npm install
npm run ingest:rag   # embeds docs/*.md into rag_documents (run once)
npm run dev
npm test
```

Copy `.env.example` to `.env` and fill in:

- `GEMINI_API_KEY` — used by all 3 AI-backed domains (rag, workflow, agent)
- `TAVILY_API_KEY` — used by the agent's web-search tool
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` — the consolidated project
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, used by the keys domain
- `DEMO_USER_ID` — the fixed demo account's `auth.users.id`

## A note on Gemini's free-tier quota

All 3 AI-backed domains share the same Gemini API key/project, so they draw
from the same daily free-tier request budget. If a demo returns "the AI
provider's free-tier quota is temporarily exhausted," that's why — it
resets daily, not a bug.
