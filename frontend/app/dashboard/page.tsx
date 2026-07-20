'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Gift, Users, Calendar, ArrowRight, Copy } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';

interface LoyaltyBalance {
  points: number;
  pointsPerRedemption: number;
  redemptionValue: number;
  redemptionsAvailable: number;
}

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();

  useEffect(() => {
    if (isInitialized && !user) {
      router.push('/login?redirect=/dashboard');
    }
  }, [isInitialized, user, router]);

  const { data: loyalty } = useQuery({
    queryKey: ['loyalty-balance'],
    queryFn: () => apiClient.get<LoyaltyBalance>('/coupons/loyalty/balance'),
    enabled: Boolean(user),
  });

  const { data: referrals } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: () => apiClient.get<ReferralStats>('/growth/referrals/me'),
    enabled: Boolean(user),
  });

  function copyReferralCode() {
    if (referrals?.referralCode) {
      navigator.clipboard.writeText(referrals.referralCode);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-1 font-display text-2xl font-bold sm:text-3xl">
        Welcome back, {user.firstName}
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">Here's what's happening with your account.</p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <GlassPanel className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Gift size={16} className="text-primary" />
            <span className="text-xs font-medium uppercase tracking-wide">Loyalty Points</span>
          </div>
          <p className="mt-2 font-mono text-2xl font-bold">{loyalty?.points ?? user.loyaltyPoints}</p>
          {loyalty && loyalty.redemptionsAvailable > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {loyalty.redemptionsAvailable} discount{loyalty.redemptionsAvailable > 1 ? 's' : ''} available
            </p>
          )}
        </GlassPanel>

        <GlassPanel className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users size={16} className="text-primary" />
            <span className="text-xs font-medium uppercase tracking-wide">Referrals</span>
          </div>
          <p className="mt-2 font-mono text-2xl font-bold">{referrals?.completedReferrals ?? 0}</p>
          {referrals?.referralCode && (
            <button
              onClick={copyReferralCode}
              className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Copy size={11} /> {referrals.referralCode}
            </button>
          )}
        </GlassPanel>

        <Link href="/dashboard/bookings">
          <GlassPanel hoverLift className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar size={16} className="text-primary" />
              <span className="text-xs font-medium uppercase tracking-wide">Bookings</span>
            </div>
            <p className="mt-2 flex items-center gap-1 text-sm font-semibold">
              View all <ArrowRight size={14} />
            </p>
          </GlassPanel>
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Button asChild variant="glass" className="justify-start">
          <Link href="/dashboard/profile">Manage profile</Link>
        </Button>
        <Button asChild variant="glass" className="justify-start">
          <Link href="/dashboard/wishlist">View wishlist</Link>
        </Button>
        <Button asChild variant="glass" className="justify-start">
          <Link href="/dashboard/verification">Driver verification</Link>
        </Button>
        <Button asChild variant="glass" className="justify-start">
          <Link href="/fleet">Browse the fleet</Link>
        </Button>
      </div>
    </div>
  );
}