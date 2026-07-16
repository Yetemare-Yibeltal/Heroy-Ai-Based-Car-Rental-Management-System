'use client';

import { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CONSENT_STORAGE_KEY = 'heroy-cookie-consent';

export type ConsentValue = 'accepted' | 'declined';

export function getStoredConsent(): ConsentValue | null {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  return value === 'accepted' || value === 'declined' ? value : null;
}

export function hasAnalyticsConsent(): boolean {
  return getStoredConsent() === 'accepted';
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      // Small delay so the banner doesn't flash in before the page
      // has visually settled on first load.
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleChoice(choice: ConsentValue) {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="glass-panel-strong fixed bottom-4 left-4 right-4 z-40 mx-auto flex max-w-xl flex-col gap-3 rounded-lg p-5 shadow-xl sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="flex items-start gap-3 sm:items-center">
        <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-primary sm:mt-0" />
        <p className="text-sm text-muted-foreground">
          HEROY uses essential cookies to keep you signed in, and optional analytics cookies to help
          us improve the site. You can accept or decline the optional ones.
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="ghost" size="sm" onClick={() => handleChoice('declined')}>
          Decline
        </Button>
        <Button size="sm" onClick={() => handleChoice('accepted')}>
          Accept
        </Button>
      </div>
    </div>
  );
}