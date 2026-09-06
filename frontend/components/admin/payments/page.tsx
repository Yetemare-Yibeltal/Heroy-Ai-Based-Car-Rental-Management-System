'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';

interface BookingExportRow {
  bookingId: string;
  customerName: string;
  vehicleName: string;
  totalPrice: number;
  paymentStatus: string;
  paymentProvider: string;
  startDate: string;
}

const PAYMENT_VARIANT: Record<string, 'success' | 'pending' | 'destructive' | 'secondary'> = {
  PAID: 'success',
  PENDING: 'pending',
  FAILED: 'destructive',
  REFUNDED: 'secondary',
  PARTIALLY_REFUNDED: 'secondary',
  NONE: 'secondary',
};

export default function AdminPaymentsPage() {
  const [startDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString());
  const [endDate] = useState(new Date().toISOString());

  const { data: rows, isLoading } = useQuery({
    queryKey: ['admin-payments', startDate, endDate],
    queryFn: () =>
      apiClient.get<BookingExportRow[]>(
        `/reports/bookings?startDate=${startDate}&endDate=${endDate}`
      ),
  });

  async function downloadCsv() {
    const token = window.localStorage.getItem('heroy_access_token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
    const response = await fetch(
      `${apiUrl}/reports/bookings/csv?startDate=${startDate}&endDate=${endDate}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'payments-export.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  const totalPaid = rows?.filter((r) => r.paymentStatus === 'PAID').reduce((s, r) => s + r.totalPrice, 0) ?? 0;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Payments</h1>
          <p className="text-sm text-muted-foreground">
            Last 30 days · ${totalPaid.toFixed(2)} collected
          </p>
        </div>
        <Button variant="glass" size="sm" onClick={downloadCsv}>
          <Download size={14} /> Export CSV
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin" size={28} />
        </div>
      )}

      <div className="glass-panel overflow-hidden rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/40 text-left">
              {['Customer', 'Vehicle', 'Date', 'Amount', 'Provider', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows?.map((row) => (
              <tr key={row.bookingId} className="border-t border-border">
                <td className="px-4 py-3">{row.customerName}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.vehicleName}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(row.startDate).toDateString()}</td>
                <td className="px-4 py-3 font-mono">${row.totalPrice.toFixed(2)}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.paymentProvider}</td>
                <td className="px-4 py-3">
                  <Badge variant={PAYMENT_VARIANT[row.paymentStatus] ?? 'secondary'}>
                    {row.paymentStatus}
                  </Badge>
                </td>
              </tr>
            ))}
            {!isLoading && (!rows || rows.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No payment activity in this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}