'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';

interface BookingStatus {
  id: string;
  vehicle: { name: string };
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  paymentStatus: string | null;
}

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 8;

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const [booking, setBooking] = useState<BookingStatus | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function poll() {
      try {
        const result = await apiClient.get<BookingStatus>(`/bookings/${bookingId}`);
        if (cancelled) return;

        setBooking(result);
        setIsLoading(false);

        if (result.paymentStatus === 'PAID' || attempts >= MAX_POLL_ATTEMPTS) {
          return;
        }

        setTimeout(() => setAttempts((a) => a + 1), POLL_INTERVAL_MS);
      } catch {
        if (!cancelled) setIsLoading(false);
      }
    }

    poll();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, attempts]);

  if (!bookingId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-muted-foreground">No booking reference provided.</p>
        <Button asChild className="mt-4">
          <Link href="/fleet">Browse the fleet</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-32 text-muted-foreground">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center text-muted-foreground">
        Could not find this booking.
      </div>
    );
  }

  const isPaid = booking.paymentStatus === 'PAID';
  const isPending = !isPaid && attempts < MAX_POLL_ATTEMPTS;
  const isFailed = booking.paymentStatus === 'FAILED';

  return (
    <div className="mx-auto max-w-lg px-4 py-20">
      <GlassPanel intensity="strong" className="p-8 text-center">
        {isPaid && (
          <>
            <CheckCircle2 size={48} className="mx-auto mb-4 text-success" />
            <h1 className="font-display text-2xl font-bold">Booking confirmed!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your payment was received and your reservation is confirmed.
            </p>
          </>
        )}

        {isPending && !isFailed && (
          <>
            <Loader2 size={48} className="mx-auto mb-4 animate-spin text-primary" />
            <h1 className="font-display text-2xl font-bold">Confirming your payment...</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This usually only takes a few seconds. Please don't close this page.
            </p>
          </>
        )}

        {isFailed && (
          <>
            <XCircle size={48} className="mx-auto mb-4 text-destructive" />
            <h1 className="font-display text-2xl font-bold">Payment failed</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Something went wrong processing your payment. No charge was completed.
            </p>
          </>
        )}

        {!isPaid && !isPending && !isFailed && (
          <>
            <Clock size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h1 className="font-display text-2xl font-bold">Still processing</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your payment is taking longer than expected to confirm. Check your dashboard shortly,
              or contact support if this persists.
            </p>
          </>
        )}

        <div className="mt-6 space-y-1.5 rounded-md bg-secondary/40 p-4 text-left text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Vehicle</span>
            <span className="font-medium">{booking.vehicle.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dates</span>
            <span className="font-medium">
              {new Date(booking.startDate).toDateString()} - {new Date(booking.endDate).toDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="font-mono font-semibold">${booking.totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="glass" className="flex-1">
            <Link href="/dashboard/bookings">View my bookings</Link>
          </Button>
          <Button asChild variant="gradient" className="flex-1">
            <Link href="/fleet">Browse more vehicles</Link>
          </Button>
        </div>
      </GlassPanel>
    </div>
  );
}