'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, Truck, Tag } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBookingStore } from '@/store/booking-store';
import { useAuthStore } from '@/store/auth-store';
import { apiClient, ApiError } from '@/lib/api-client';

interface BookingWidgetProps {
  vehicleId: string;
  vehicleName: string;
  pricePerDay: number;
  isAvailable: boolean;
}

export function BookingWidget({ vehicleId, vehicleName, pricePerDay, isAvailable }: BookingWidgetProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const {
    draft,
    quote,
    isQuoteLoading,
    quoteError,
    setVehicle,
    setDates,
    setInsuranceAddOn,
    setDeliveryRequested,
    setCouponCode,
    fetchQuote,
  } = useBookingStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    setVehicle(vehicleId, vehicleName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId, vehicleName]);

  useEffect(() => {
    fetchQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.startDate, draft.endDate, draft.insuranceAddOn, draft.deliveryRequested, draft.couponCode]);

  async function handleBook() {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!draft.startDate || !draft.endDate) {
      setSubmitError('Please select both a pickup and return date.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const booking = await apiClient.post<{ id: string }>('/bookings', {
        vehicleId,
        startDate: new Date(draft.startDate).toISOString(),
        endDate: new Date(draft.endDate).toISOString(),
        insuranceAddOn: draft.insuranceAddOn,
        deliveryRequested: draft.deliveryRequested,
        deliveryAddress: draft.deliveryAddress || undefined,
        couponCode: draft.couponCode || undefined,
      });

      router.push(`/booking/${booking.id}/checkout`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not create booking. Please try again.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isAvailable) {
    return (
      <GlassPanel className="p-6 text-center">
        <p className="text-sm text-muted-foreground">This vehicle isn't currently available to book.</p>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel intensity="strong" className="sticky top-24 space-y-5 p-6">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-2xl font-bold">
          ${pricePerDay}
          <span className="text-sm font-normal text-muted-foreground">/day</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs text-muted-foreground">Pickup</span>
          <input
            type="date"
            min={today}
            value={draft.startDate ?? ''}
            onChange={(e) => setDates(e.target.value, draft.endDate ?? e.target.value)}
            className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-muted-foreground">Return</span>
          <input
            type="date"
            min={draft.startDate ?? today}
            value={draft.endDate ?? ''}
            onChange={(e) => setDates(draft.startDate ?? e.target.value, e.target.value)}
            className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
      </div>

      <label className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
        <span className="flex items-center gap-2 text-sm">
          <ShieldCheck size={15} className="text-primary" /> Insurance add-on
        </span>
        <input
          type="checkbox"
          checked={draft.insuranceAddOn}
          onChange={(e) => setInsuranceAddOn(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
      </label>

      <label className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
        <span className="flex items-center gap-2 text-sm">
          <Truck size={15} className="text-primary" /> Vehicle delivery
        </span>
        <input
          type="checkbox"
          checked={draft.deliveryRequested}
          onChange={(e) => setDeliveryRequested(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
      </label>

      {draft.deliveryRequested && (
        <Input
          placeholder="Delivery address"
          value={draft.deliveryAddress}
          onChange={(e) => setDeliveryRequested(true, e.target.value)}
        />
      )}

      <div className="relative">
        <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Coupon code"
          value={draft.couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          className="pl-9"
        />
      </div>

      <div className="border-t border-border pt-4">
        {isQuoteLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={14} className="animate-spin" /> Calculating quote...
          </div>
        )}

        {quoteError && <p className="text-sm text-destructive">{quoteError}</p>}

        {quote && !isQuoteLoading && (
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>{quote.days} day(s) × ${quote.pricePerDay}</span>
              <span>${quote.subtotal.toFixed(2)}</span>
            </div>
            {quote.insuranceCost > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Insurance</span>
                <span>${quote.insuranceCost.toFixed(2)}</span>
              </div>
            )}
            {quote.deliveryCost > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery</span>
                <span>${quote.deliveryCost.toFixed(2)}</span>
              </div>
            )}
            {quote.discount > 0 && (
              <div className="flex justify-between text-primary">
                <span>Discount</span>
                <span>-${quote.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
              <span>Total</span>
              <span className="font-mono">${quote.total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <Button
        variant="gradient"
        size="lg"
        className="w-full"
        disabled={!quote || isSubmitting}
        onClick={handleBook}
      >
        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
        {user ? 'Reserve this vehicle' : 'Log in to book'}
      </Button>
    </GlassPanel>
  );
}