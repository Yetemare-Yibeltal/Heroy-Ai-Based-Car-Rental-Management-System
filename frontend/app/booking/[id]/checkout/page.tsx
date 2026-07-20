'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Loader2, CreditCard, Smartphone } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/button';
import { apiClient, ApiError } from '@/lib/api-client';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');

interface BookingSummary {
  id: string;
  vehicle: { name: string; primaryImageUrl: string | null };
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
}

type InitiateResult =
  | { provider: 'STRIPE'; clientSecret: string; amount: number; currency: string }
  | { provider: 'CHAPA'; checkoutUrl: string; amount: number; currency: string };

function StripeCardForm({ bookingId }: { bookingId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking/confirmation?bookingId=${bookingId}`,
      },
    });

    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" variant="gradient" className="w-full" disabled={!stripe || isProcessing}>
        {isProcessing && <Loader2 size={16} className="animate-spin" />}
        Pay Now
      </Button>
    </form>
  );
}

export default function CheckoutPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [selectedProvider, setSelectedProvider] = useState<'STRIPE' | 'CHAPA' | null>(null);
  const [initiateResult, setInitiateResult] = useState<InitiateResult | null>(null);
  const [isInitiating, setIsInitiating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', params.id],
    queryFn: () => apiClient.get<BookingSummary>(`/bookings/${params.id}`),
  });

  async function handleSelectProvider(provider: 'STRIPE' | 'CHAPA') {
    setSelectedProvider(provider);
    setIsInitiating(true);
    setError(null);

    try {
      const result = await apiClient.post<InitiateResult>('/payments/initiate', {
        bookingId: params.id,
        provider,
      });

      if (result.provider === 'CHAPA') {
        window.location.href = result.checkoutUrl;
        return;
      }

      setInitiateResult(result);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not start payment. Please try again.';
      setError(message);
      setSelectedProvider(null);
    } finally {
      setIsInitiating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-32 text-muted-foreground">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  if (!booking) {
    return <div className="py-32 text-center text-muted-foreground">Booking not found.</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 font-display text-2xl font-bold sm:text-3xl">Complete your payment</h1>

      <GlassPanel className="mb-6 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">{booking.vehicle.name}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(booking.startDate).toDateString()} - {new Date(booking.endDate).toDateString()}
            </p>
          </div>
          <span className="font-mono text-xl font-bold">${booking.totalPrice.toFixed(2)}</span>
        </div>
      </GlassPanel>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {!selectedProvider && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button onClick={() => handleSelectProvider('STRIPE')} disabled={isInitiating}>
            <GlassPanel hoverLift className="flex flex-col items-center gap-3 p-6 text-center">
              <CreditCard size={28} className="text-primary" />
              <div>
                <p className="font-semibold">International Card</p>
                <p className="text-xs text-muted-foreground">Visa, Mastercard - via Stripe</p>
              </div>
            </GlassPanel>
          </button>

          <button onClick={() => handleSelectProvider('CHAPA')} disabled={isInitiating}>
            <GlassPanel hoverLift className="flex flex-col items-center gap-3 p-6 text-center">
              <Smartphone size={28} className="text-primary" />
              <div>
                <p className="font-semibold">Local Payment</p>
                <p className="text-xs text-muted-foreground">Telebirr, CBE Birr, HelloCash - via Chapa</p>
              </div>
            </GlassPanel>
          </button>
        </div>
      )}

      {isInitiating && (
        <div className="flex justify-center py-8 text-muted-foreground">
          <Loader2 className="animate-spin" size={24} />
        </div>
      )}

      {selectedProvider === 'STRIPE' && initiateResult?.provider === 'STRIPE' && (
        <GlassPanel className="p-6">
          <Elements stripe={stripePromise} options={{ clientSecret: initiateResult.clientSecret }}>
            <StripeCardForm bookingId={booking.id} />
          </Elements>
        </GlassPanel>
      )}
    </div>
  );
}