'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { apiClient } from '@/lib/api-client';

interface RevenueMonth {
  month: string;
  revenue: number;
}

async function fetchRevenueByMonth(): Promise<RevenueMonth[]> {
  return apiClient.get<RevenueMonth[]>('/admin/revenue-by-month?months=6');
}

export function RevenueChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-revenue-by-month'],
    queryFn: fetchRevenueByMonth,
  });

  return (
    <GlassPanel className="p-6">
      <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Revenue by Month
      </h3>

      {isLoading && (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="animate-spin" size={24} />
        </div>
      )}

      {!isLoading && data && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  color: 'hsl(var(--foreground))',
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </GlassPanel>
  );
}