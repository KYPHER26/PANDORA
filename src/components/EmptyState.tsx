interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-soft border border-hairline bg-surface px-6 py-14 text-center animate-riseIn">
      <span className="text-4xl">{icon}</span>
      <p className="font-display text-lg">{title}</p>
      {subtitle && <p className="max-w-xs text-sm text-dim">{subtitle}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 rounded-pill btn-rose px-5 py-2.5 text-sm font-medium text-white transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
