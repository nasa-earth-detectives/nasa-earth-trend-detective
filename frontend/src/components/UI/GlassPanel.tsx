import { ReactNode, CSSProperties } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  variant?: 'standard' | 'deep' | 'glow';
  interactive?: boolean;
}

export function GlassPanel({
  children,
  className = '',
  style,
  variant = 'standard',
  interactive = false,
}: GlassPanelProps) {
  const variantClass = {
    standard: 'glass-panel',
    deep: 'glass-panel-deep',
    glow: 'glass-panel glass-panel-glow',
  }[variant];

  const interactiveClass = interactive ? 'glass-panel-interactive cursor-pointer' : '';

  return (
    <div
      className={`rounded-2xl ${variantClass} ${interactiveClass} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
