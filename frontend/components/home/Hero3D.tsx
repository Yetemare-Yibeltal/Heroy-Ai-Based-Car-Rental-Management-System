'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GradientText } from '@/components/ui/GradientText';
import { AnimatedText } from '@/components/ui/AnimatedText';
import { motion } from 'framer-motion';

export function Hero3D() {
  return (
    <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-4 text-center sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground"
      >
        <Sparkles size={13} className="text-primary" />
        Booking assistant powered by AI, available anytime
      </motion.div>

      <AnimatedText
        as="h1"
        variant="words"
        className="max-w-4xl justify-center text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl"
      >
        Rent smarter with HEROY
      </AnimatedText>

      <div className="mt-3">
        <GradientText as="h2" shimmer className="text-3xl font-bold sm:text-4xl lg:text-5xl">
          your next drive, one chat away
        </GradientText>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg"
      >
        Browse a live fleet, get an instant quote, and book a vehicle in minutes - with help from
        an AI assistant that can search, quote, and even complete your booking by voice.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55 }}
        className="mt-9 flex flex-col gap-3 sm:flex-row"
      >
        <Button size="lg" variant="gradient" asChild>
          <Link href="/fleet">
            Browse the Fleet <ArrowRight size={16} />
          </Link>
        </Button>
        <Button size="lg" variant="glass" asChild>
          <Link href="/about">How It Works</Link>
        </Button>
      </motion.div>
    </section>
  );
}