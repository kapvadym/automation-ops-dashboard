export type DomainId = "rag" | "workflow" | "agent" | "keys";

export interface DomainMeta {
  id: DomainId;
  label: string;
  shortLabel: string;
  href: string;
  colorHex: string;
  githubRepo: string;
  tagline: string;
  techBadges: string[];
  /** Primary table this domain's /api/status health check + counts query. */
  table: string;
  /** Unit label for that count on the overview page's stat tile. */
  statLabel: string;
}

// Single source of truth for the 4 domains — drives the status rail nav,
// the overview cards, and each route's explainer panel, so recoloring or
// relabeling a domain only ever happens in one place.
export const DOMAINS: DomainMeta[] = [
  {
    id: "rag",
    label: "RAG Docs Agent",
    shortLabel: "RAG",
    href: "/rag",
    colorHex: "#8B7FD6",
    githubRepo: "kapvadym/rag-docs-support-agent",
    tagline:
      "Answers questions from documentation with cited, grounded sources — refuses to guess outside its docs.",
    techBadges: ["Next.js", "Gemini", "pgvector"],
    table: "rag_documents",
    statLabel: "doc chunks indexed",
  },
  {
    id: "workflow",
    label: "Workflow Automation",
    shortLabel: "Workflow",
    href: "/workflow",
    colorHex: "#D9A441",
    githubRepo: "kapvadym/workflow-automation-api",
    tagline:
      "Classifies an incoming support ticket with Gemini and forwards a triage alert, tracking each run's status.",
    techBadges: ["Express", "Gemini", "Slack"],
    table: "workflow_pipeline_runs",
    statLabel: "triage runs",
  },
  {
    id: "agent",
    label: "Tool-Calling Agent",
    shortLabel: "Agent",
    href: "/agent",
    colorHex: "#5EC8D8",
    githubRepo: "kapvadym/llm-tool-agent-memory",
    tagline:
      "A conversational agent that calls real tools — calculator, web search, product lookup — and remembers the conversation.",
    techBadges: ["Next.js", "Gemini tool-calling", "Tavily"],
    table: "agent_sessions",
    statLabel: "agent sessions",
  },
  {
    id: "keys",
    label: "API Key Manager",
    shortLabel: "Keys",
    href: "/keys",
    colorHex: "#D6706F",
    githubRepo: "kapvadym/api-key-manager",
    tagline:
      "Issue, list, and revoke API keys — shown once in plaintext, hashed thereafter.",
    techBadges: ["Next.js", "Supabase Auth", "SHA-256"],
    table: "keys_api_keys",
    statLabel: "active keys",
  },
];

export function getDomain(id: DomainId): DomainMeta {
  const domain = DOMAINS.find((d) => d.id === id);
  if (!domain) throw new Error(`Unknown domain: ${id}`);
  return domain;
}
