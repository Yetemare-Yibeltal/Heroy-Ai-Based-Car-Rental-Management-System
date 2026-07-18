'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Loader2, Check } from 'lucide-react';
import { GradientText } from '@/components/ui/GradientText';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';

const FOOTER_LINKS = {
  Company: [
    { href: '/about', label: 'About Us' },
    { href: '/business', label: 'HEROY for Business' },
    { href: '/contact', label: 'Contact' },
    { href: '/blog', label: 'Blog' },
  ],
  Explore: [
    { href: '/fleet', label: 'Browse Fleet' },
    { href: '/locations', label: 'Locations' },
    { href: '/faq', label: 'FAQ' },
  ],
  Legal: [
    { href: '/terms', label: 'Terms of Service' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/refund-policy', label: 'Refund Policy' },
  ],
};

export function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      await apiClient.post('/growth/newsletter/subscribe', { email }, { skipAuth: true });
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  }

  return (
    <footer className="border-t border-border bg-secondary/20">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <GradientText as="span" className="text-2xl">
              HEROY
            </GradientText>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              An AI-native car rental platform. Browse a live fleet, get instant quotes, and book
              with help from an assistant that can talk and listen.
            </p>
            <div className="mt-5 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone size={14} /> +251 11 555 0142
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} /> support@heroy.example
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} /> Addis Ababa, Ethiopia
              </div>
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
                {section}
              </h4>
              <ul className="mt-4 space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
              Stay updated
            </h4>
            <p className="mt-4 text-sm text-muted-foreground">
              Get notified about new vehicles and promotions.
            </p>
            <form onSubmit={handleSubscribe} className="mt-3 flex flex-col gap-2">
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" size="sm" disabled={status === 'loading'}>
                {status === 'loading' && <Loader2 size={14} className="animate-spin" />}
                {status === 'success' && <Check size={14} />}
                {status === 'success' ? 'Subscribed' : 'Subscribe'}
              </Button>
              {status === 'error' && (
                <p className="text-xs text-destructive">Something went wrong. Please try again.</p>
              )}
            </form>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} HEROY Car Rental. All rights reserved.
        </div>
      </div>
    </footer>
  );
}