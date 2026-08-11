export function Badge({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-line bg-panel-raised px-2.5 py-1 font-mono text-[11px] text-ink-dim">
      {children}
    </span>
  );
}
