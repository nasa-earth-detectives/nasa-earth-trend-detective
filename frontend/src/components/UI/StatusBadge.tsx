import { LucideIcon } from 'lucide-react';

export type StatusVariant = 'online' | 'offline' | 'warning' | 'neutral' | 'science';

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  icon?: LucideIcon;
  pulse?: boolean;
  size?: 'sm' | 'md';
}

const VARIANT_STYLES: Record<StatusVariant, { dot: string; ping: string; border: string; text: string }> = {
  online: {
    dot: 'bg-emerald-400',
    ping: 'bg-emerald-400',
    border: 'border-emerald-500/30',
    text: 'text-emerald-300',
  },
  offline: {
    dot: 'bg-amber-400',
    ping: 'bg-amber-400',
    border: 'border-amber-500/30',
    text: 'text-amber-300',
  },
  warning: {
    dot: 'bg-rose-400',
    ping: 'bg-rose-400',
    border: 'border-rose-500/30',
    text: 'text-rose-300',
  },
  neutral: {
    dot: 'bg-slate-400',
    ping: 'bg-slate-400',
    border: 'border-slate-700/50',
    text: 'text-slate-300',
  },
  science: {
    dot: 'bg-[var(--active-accent)]',
    ping: 'bg-[var(--active-accent)]',
    border: 'border-[var(--edge-highlight)]',
    text: 'text-[var(--text-primary)]',
  },
};

export function StatusBadge({
  label,
  variant = 'neutral',
  icon: Icon,
  pulse = true,
  size = 'md',
}: StatusBadgeProps) {
  const styles = VARIANT_STYLES[variant];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <div
      className={`glass-badge ${sizeClasses} ${styles.border} ${styles.text} font-mono`}
      role="status"
    >
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${styles.ping}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${styles.dot}`} />
      </span>
      {Icon && <Icon className="w-3 h-3 opacity-80" aria-hidden="true" />}
      <span>{label}</span>
    </div>
  );
}
