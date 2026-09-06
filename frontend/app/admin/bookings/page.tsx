'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { apiClient, ApiError } from '@/lib/api-client';

interface AdminBooking {
  id: string;
  user: { firstName: string; lastName: string; email: string };
  vehicle: { name: string };
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

const STATUS_VARIANT: Record<string, 'pending' | 'success' | 'secondary' | 'destructive'> = {
  PENDING: 'pending',
  CONFIRMED: 'success',
  ACTIVE: 'success',
  COMPLETED: 'secondary',
  CANCELLED: 'destructive',
};

const NEXT_STATUS: Record<string, string | null> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'ACTIVE',
  ACTIVE: 'COMPLETED',
  COMPLETED: null,
  CANCELLED: null,
};

export default function AdminBookingsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['admin-bookings', statusFilter],
    queryFn: () =>
      apiClient.get<AdminBooking[]>(`/bookings?limit=50${statusFilter ? `&status=${statusFilter}` : ''}`),
  });

  async function advanceStatus(booking: AdminBooking) {
    const next = NEXT_STATUS[booking.status];
    if (!next) return;

    try {
      await apiClient.patch(`/bookings/${booking.id}/status`, { status: next });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not update booking status.');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Bookings</h1>
          <p className="text-sm text-muted-foreground">{bookings?.length ?? 0} reservations</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin" size={28} />
        </div>
      )}

      <div className="space-y-3">
        {bookings?.map((booking) => (
          <GlassPanel key={booking.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-[180px]">
              <p className="text-sm font-medium">
                {booking.user.firstName} {booking.user.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{booking.user.email}</p>
            </div>
            <div className="min-w-[160px]">
              <p className="text-sm">{booking.vehicle.name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(booking.startDate).toDateString()} - {new Date(booking.endDate).toDateString()}
              </p>
            </div>
            <span className="font-mono text-sm font-semibold">${booking.totalPrice.toFixed(2)}</span>
            <Badge variant={STATUS_VARIANT[booking.status]}>{booking.status}</Badge>
            {NEXT_STATUS[booking.status] && (
              <Button size="sm" variant="ghost" onClick={() => advanceStatus(booking)}>
                Mark {NEXT_STATUS[booking.status]}
              </Button>
            )}
          </GlassPanel>
        ))}
        {!isLoading && (!bookings || bookings.length === 0) && (
          <p className="py-8 text-center text-muted-foreground">No bookings match this filter.</p>
        )}
      </div>
    </div>
  );
}