export function StatTile({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit?: string;
}) {
  return (
    <div>
      <p className="font-display text-2xl font-medium text-ink">
        {value}
        {unit && <span className="ml-1 text-sm text-ink-dim">{unit}</span>}
      </p>
      <p className="mt-0.5 text-xs uppercase tracking-wide text-ink-dim">{label}</p>
    </div>
  );
}
