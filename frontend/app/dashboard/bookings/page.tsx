'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Download, XCircle, Star } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiClient, ApiError } from '@/lib/api-client';

interface BookingListItem {
  id: string;
  vehicle: { name: string; brand: string; plate: string; primaryImageUrl: string | null };
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: string | null;
}

const STATUS_VARIANT: Record<string, 'pending' | 'success' | 'secondary' | 'destructive'> = {
  PENDING: 'pending',
  CONFIRMED: 'success',
  ACTIVE: 'success',
  COMPLETED: 'secondary',
  CANCELLED: 'destructive',
};

export default function MyBookingsPage() {
  const queryClient = useQueryClient();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => apiClient.get<BookingListItem[]>('/bookings?limit=50'),
  });

  async function handleCancel(bookingId: string) {
    setCancellingId(bookingId);
    setActionError(null);
    try {
      await apiClient.post(`/bookings/${bookingId}/cancel`);
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not cancel this booking.');
    } finally {
      setCancellingId(null);
    }
  }

  async function handleDownloadInvoice(bookingId: string) {
    const token = window.localStorage.getItem('heroy_access_token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

    const response = await fetch(`${apiUrl}/payments/booking/${bookingId}/invoice`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return;

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${bookingId}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-display text-2xl font-bold sm:text-3xl">My Bookings</h1>

      {isLoading && (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin" size={28} />
        </div>
      )}

      {!isLoading && (!bookings || bookings.length === 0) && (
        <GlassPanel className="p-8 text-center text-muted-foreground">
          You don't have any bookings yet.
        </GlassPanel>
      )}

      {actionError && <p className="mb-4 text-sm text-destructive">{actionError}</p>}

      <div className="space-y-4">
        {bookings?.map((booking) => {
          const canCancel = booking.status === 'PENDING' || booking.status === 'CONFIRMED';
          const canReview = booking.status === 'COMPLETED';
          const canDownloadInvoice = booking.paymentStatus === 'PAID';

          return (
            <GlassPanel key={booking.id} className="p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{booking.vehicle.name}</p>
                    <Badge variant={STATUS_VARIANT[booking.status] ?? 'secondary'}>{booking.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {new Date(booking.startDate).toDateString()} - {new Date(booking.endDate).toDateString()}
                  </p>
                  <p className="mt-0.5 font-mono text-sm font-semibold">${booking.totalPrice.toFixed(2)}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {canDownloadInvoice && (
                    <Button size="sm" variant="ghost" onClick={() => handleDownloadInvoice(booking.id)}>
                      <Download size={14} /> Invoice
                    </Button>
                  )}
                  {canReview && (
                    <Button size="sm" variant="ghost">
                      <Star size={14} /> Leave a review
                    </Button>
                  )}
                  {canCancel && (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={cancellingId === booking.id}
                      onClick={() => handleCancel(booking.id)}
                    >
                      {cancellingId === booking.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <XCircle size={14} />
                      )}
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </GlassPanel>
          );
        })}
      </div>
    </div>
  );
}