'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { apiClient, ApiError } from '@/lib/api-client';

interface MaintenanceRecord {
  id: string;
  vehicleName: string;
  vehiclePlate: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  description: string;
  scheduledDate: string;
}

interface DueVehicle {
  id: string;
  name: string;
  plate: string;
  mileage: number;
}

const STATUS_VARIANT: Record<string, 'pending' | 'success' | 'secondary'> = {
  SCHEDULED: 'pending',
  IN_PROGRESS: 'destructive' as never,
  COMPLETED: 'secondary',
};

const NEXT_STATUS: Record<string, string | null> = {
  SCHEDULED: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
  COMPLETED: null,
};

export default function AdminMaintenancePage() {
  const queryClient = useQueryClient();

  const { data: records, isLoading } = useQuery({
    queryKey: ['admin-maintenance'],
    queryFn: () => apiClient.get<MaintenanceRecord[]>('/maintenance?limit=50'),
  });

  const { data: dueVehicles } = useQuery({
    queryKey: ['maintenance-due'],
    queryFn: () => apiClient.get<DueVehicle[]>('/maintenance/due-for-service'),
  });

  async function advanceStatus(record: MaintenanceRecord) {
    const next = NEXT_STATUS[record.status];
    if (!next) return;
    try {
      await apiClient.patch(`/maintenance/${record.id}`, { status: next });
      queryClient.invalidateQueries({ queryKey: ['admin-maintenance'] });
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not update maintenance status.');
    }
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Fleet Maintenance</h1>

      {dueVehicles && dueVehicles.length > 0 && (
        <GlassPanel className="mb-6 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
            <AlertTriangle size={15} /> Vehicles due for service
          </div>
          <div className="flex flex-wrap gap-2">
            {dueVehicles.map((v) => (
              <span key={v.id} className="rounded-full bg-primary/15 px-3 py-1 text-xs text-primary">
                {v.name} ({v.plate}) - {v.mileage.toLocaleString()} mi
              </span>
            ))}
          </div>
        </GlassPanel>
      )}

      {isLoading && (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin" size={28} />
        </div>
      )}

      <div className="space-y-3">
        {records?.map((record) => (
          <GlassPanel key={record.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-medium">
                {record.vehicleName} ({record.vehiclePlate})
              </p>
              <p className="text-xs text-muted-foreground">{record.description}</p>
              <p className="text-xs text-muted-foreground/70">
                Scheduled: {new Date(record.scheduledDate).toDateString()}
              </p>
            </div>
            <Badge variant={STATUS_VARIANT[record.status]}>{record.status}</Badge>
            {NEXT_STATUS[record.status] && (
              <Button size="sm" variant="ghost" onClick={() => advanceStatus(record)}>
                Mark {NEXT_STATUS[record.status]}
              </Button>
            )}
          </GlassPanel>
        ))}
        {!isLoading && (!records || records.length === 0) && (
          <p className="py-8 text-center text-muted-foreground">No maintenance records yet.</p>
        )}
      </div>
    </div>
  );
}