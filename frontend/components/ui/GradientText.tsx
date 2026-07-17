import { cn } from '@/lib/utils';

interface GradientTextProps {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'span' | 'p';
  className?: string;
  shimmer?: boolean;
}

/**
 * Renders text filled with HEROY's brand gradient (amber -> rust ->
 * purple), continuously animated via the gradient-shift keyframe
 * defined in globals.css. The `shimmer` option layers a subtle
 * moving highlight sweep on top for extra emphasis on primary CTAs.
 */
export function GradientText({
  children,
  as: Component = 'span',
  className,
  shimmer = false,
}: GradientTextProps) {
  return (
    <Component
      className={cn(
        'gradient-text inline-block animate-gradient-shift bg-gradient-brand bg-[length:200%_200%] font-display font-semibold',
        shimmer && 'relative',
        className
      )}
    >
      {children}
      {shimmer && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent bg-[length:200%_100%] bg-clip-text text-transparent"
        />
      )}
    </Component>
  );
}