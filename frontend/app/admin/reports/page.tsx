'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, Download, FileText } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';

interface UtilizationRow {
  vehicleId: string;
  vehicleName: string;
  category: string;
  utilizationRate: number;
  revenue: number;
}

interface UtilizationReport {
  fleetSize: number;
  averageUtilizationRate: number;
  rows: UtilizationRow[];
}

export default function AdminReportsPage() {
  const startDate = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString();
  const endDate = new Date().toISOString();

  const { data: utilization, isLoading } = useQuery({
    queryKey: ['admin-utilization'],
    queryFn: () =>
      apiClient.get<UtilizationReport>(`/reports/utilization?startDate=${startDate}&endDate=${endDate}`),
  });

  async function downloadPdf() {
    const token = window.localStorage.getItem('heroy_access_token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
    const response = await fetch(
      `${apiUrl}/reports/revenue/pdf?startDate=${startDate}&endDate=${endDate}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'heroy-revenue-report.pdf';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Reports</h1>
        <Button variant="glass" size="sm" onClick={downloadPdf}>
          <Download size={14} /> Revenue PDF
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin" size={28} />
        </div>
      )}

      {utilization && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-2">
            <GlassPanel className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Fleet Size</p>
              <p className="mt-1 font-mono text-2xl font-bold">{utilization.fleetSize}</p>
            </GlassPanel>
            <GlassPanel className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Avg. Utilization
              </p>
              <p className="mt-1 font-mono text-2xl font-bold">{utilization.averageUtilizationRate}%</p>
            </GlassPanel>
          </div>

          <GlassPanel className="overflow-hidden p-0">
            <div className="flex items-center gap-2 border-b border-border p-4 text-sm font-semibold">
              <FileText size={15} className="text-primary" /> Utilization by Vehicle
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/40 text-left">
                  {['Vehicle', 'Category', 'Utilization', 'Revenue'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-xs font-semibold uppercase text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {utilization.rows.map((row) => (
                  <tr key={row.vehicleId} className="border-t border-border">
                    <td className="px-4 py-2.5">{row.vehicleName}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{row.category}</td>
                    <td className="px-4 py-2.5">{row.utilizationRate}%</td>
                    <td className="px-4 py-2.5 font-mono">${row.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassPanel>
        </>
      )}
    </div>
  );
}