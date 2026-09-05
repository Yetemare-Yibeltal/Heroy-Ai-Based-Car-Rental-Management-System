'use client';

import { useQuery } from '@tanstack/react-query';
import { DollarSign, Car, Percent, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { apiClient } from '@/lib/api-client';

interface OverviewStats {
  totalRevenue: number;
  totalBookings: number;
  activeRentals: number;
  totalVehicles: number;
  availableVehicles: number;
  utilizationRate: number;
  totalCustomers: number;
  pendingBookings: number;
  averageBookingValue: number;
}

interface TopVehicle {
  vehicleId: string;
  name: string;
  brand: string;
  totalRevenue: number;
  bookingCount: number;
}

interface RecentActivity {
  bookingId: string;
  customerName: string;
  vehicleName: string;
  status: string;
  amount: number;
  createdAt: string;
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
}) {
  return (
    <GlassPanel className="p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon size={15} className="text-primary" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 font-mono text-2xl font-bold">{value}</p>
    </GlassPanel>
  );
}

export default function AdminOverviewPage() {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => apiClient.get<OverviewStats>('/admin/overview'),
  });

  const { data: topVehicles } = useQuery({
    queryKey: ['admin-top-vehicles'],
    queryFn: () => apiClient.get<TopVehicle[]>('/admin/top-vehicles?limit=5'),
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: () => apiClient.get<RecentActivity[]>('/admin/recent-activity?limit=8'),
  });

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-bold sm:text-3xl">Dispatch Board</h1>
      <p className="mb-8 text-sm text-muted-foreground">Fleet and booking status, live.</p>

      {overviewLoading && (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin" size={28} />
        </div>
      )}

      {overview && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard icon={DollarSign} label="Revenue" value={`$${overview.totalRevenue.toFixed(0)}`} />
          <StatCard icon={Car} label="Fleet Size" value={String(overview.totalVehicles)} />
          <StatCard icon={Percent} label="Utilization" value={`${overview.utilizationRate}%`} />
          <StatCard icon={Clock} label="Pending" value={String(overview.pendingBookings)} />
          <StatCard icon={TrendingUp} label="Active Rentals" value={String(overview.activeRentals)} />
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <RevenueChart />

        <GlassPanel className="p-6">
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Top Vehicles
          </h3>
          <div className="space-y-3">
            {topVehicles?.map((vehicle, index) => (
              <div key={vehicle.vehicleId} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{vehicle.name}</p>
                    <p className="text-xs text-muted-foreground">{vehicle.bookingCount} bookings</p>
                  </div>
                </div>
                <span className="font-mono font-semibold">${vehicle.totalRevenue.toFixed(0)}</span>
              </div>
            ))}
            {(!topVehicles || topVehicles.length === 0) && (
              <p className="text-sm text-muted-foreground">No booking data yet.</p>
            )}
          </div>
        </GlassPanel>
      </div>

      <GlassPanel className="mt-6 p-6">
        <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {recentActivity?.map((activity) => (
            <div
              key={activity.bookingId}
              className="flex items-center justify-between border-b border-border pb-3 text-sm last:border-0 last:pb-0"
            >
              <div>
                <p className="font-medium">{activity.customerName}</p>
                <p className="text-xs text-muted-foreground">
                  {activity.vehicleName} - {activity.status}
                </p>
              </div>
              <span className="font-mono text-sm">${activity.amount.toFixed(2)}</span>
            </div>
          ))}
          {(!recentActivity || recentActivity.length === 0) && (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}