export type SystemStatus = "healthy" | "pending" | "error" | "unknown";

const STATUS_STYLES: Record<SystemStatus, { color: string; label: string; breathe: boolean }> = {
  healthy: { color: "#4FD1AE", label: "Live", breathe: true },
  pending: { color: "#E8A33D", label: "Checking", breathe: false },
  error: { color: "#E2574C", label: "Unreachable", breathe: false },
  unknown: { color: "#4A5560", label: "—", breathe: false },
};

export function StatusPill({ status, label }: { status: SystemStatus; label?: string }) {
  const style = STATUS_STYLES[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-dim">
      <span
        className={`h-1.5 w-1.5 rounded-full ${style.breathe ? "animate-breathe" : ""}`}
        style={{ backgroundColor: style.color }}
      />
      {label ?? style.label}
    </span>
  );
}
