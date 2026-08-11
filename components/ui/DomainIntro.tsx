import { Badge } from "./Badge";
import { Panel } from "./Panel";
import type { DomainMeta } from "@/lib/shared/domains";

export function DomainIntro({
  domain,
  steps,
  note,
}: {
  domain: DomainMeta;
  steps: string[];
  note?: string;
}) {
  return (
    <>
      <header className="mb-6">
        <p className="font-mono text-xs" style={{ color: domain.colorHex }}>
          {domain.githubRepo}
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink">{domain.label}</h1>
      </header>

      <Panel accent={domain.colorHex} className="mb-6 p-5">
        <p className="text-sm text-ink-dim">{domain.tagline}</p>
        <ol className="mt-3 space-y-1.5 text-sm text-ink">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-mono text-xs text-ink-dim">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          {domain.techBadges.map((b) => (
            <Badge key={b}>{b}</Badge>
          ))}
        </div>
        {note && (
          <p className="mt-3 rounded-md border border-status-pending/30 bg-status-pending/10 px-3 py-2 text-xs text-status-pending">
            {note}
          </p>
        )}
      </Panel>
    </>
  );
}
