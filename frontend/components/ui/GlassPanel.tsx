import { cn } from '@/lib/utils';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 'light' uses a subtler blur; 'strong' is more opaque, used for modals/overlays. */
  intensity?: 'light' | 'strong';
  /** Adds a hover lift + shadow transition, useful for clickable cards. */
  hoverLift?: boolean;
  /** Adds a soft amber glow around the border, for highlighted/featured panels. */
  glow?: boolean;
}

export function GlassPanel({
  intensity = 'light',
  hoverLift = false,
  glow = false,
  className,
  children,
  ...props
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        'rounded-lg',
        intensity === 'light' ? 'glass-panel' : 'glass-panel-strong',
        hoverLift &&
          'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20',
        glow && 'shadow-[0_0_24px_-4px_hsl(var(--primary)/0.35)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}