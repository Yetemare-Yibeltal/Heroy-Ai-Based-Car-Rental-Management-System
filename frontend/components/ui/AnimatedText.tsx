'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedTextProps {
  children: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  /** Animate whole block at once ('fade') or word-by-word ('words'). */
  variant?: 'fade' | 'words';
  delay?: number;
}

/**
 * Animates text into view the moment it scrolls into the viewport,
 * using real Framer Motion transforms (translateY + opacity), not a
 * static CSS class. `variant="words"` staggers each word in
 * individually for a more dynamic hero-headline effect.
 */
export function AnimatedText({
  children,
  as = 'p',
  className,
  variant = 'fade',
  delay = 0,
}: AnimatedTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const Component = motion[as as keyof typeof motion] as typeof motion.div;

  if (variant === 'fade') {
    return (
      <Component
        ref={ref}
        initial={{ opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
        className={cn(className)}
      >
        {children}
      </Component>
    );
  }

  const words = children.split(' ');

  return (
    <div ref={ref} className={cn('flex flex-wrap', className)}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
          animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.5, delay: delay + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="mr-[0.25em] inline-block"
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
}