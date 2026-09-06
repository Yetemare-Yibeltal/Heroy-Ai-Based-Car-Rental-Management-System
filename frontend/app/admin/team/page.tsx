'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface AuditLogEntry {
  id: string;
  userName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
}

export default function AdminTeamPage() {
  const { data: staffCustomer } = useQuery({
    queryKey: ['team-staff', 'STAFF'],
    queryFn: () => apiClient.get<StaffMember[]>('/users?role=STAFF&limit=50'),
  });
  const { data: staffManager } = useQuery({
    queryKey: ['team-staff', 'BRANCH_MANAGER'],
    queryFn: () => apiClient.get<StaffMember[]>('/users?role=BRANCH_MANAGER&limit=50'),
  });
  const { data: staffAdmin } = useQuery({
    queryKey: ['team-staff', 'ADMIN'],
    queryFn: () => apiClient.get<StaffMember[]>('/users?role=ADMIN&limit=50'),
  });

  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => apiClient.get<AuditLogEntry[]>('/compliance/audit-logs?limit=20'),
  });

  const allStaff = [...(staffCustomer ?? []), ...(staffManager ?? []), ...(staffAdmin ?? [])];

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Team & Compliance</h1>

      <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Staff Members
      </h2>
      <div className="mb-8 space-y-2">
        {allStaff.map((member) => (
          <GlassPanel key={member.id} className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">
                {member.firstName} {member.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{member.email}</p>
            </div>
            <Badge>{member.role}</Badge>
          </GlassPanel>
        ))}
        {allStaff.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">No staff members found.</p>
        )}
      </div>

      <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Recent Audit Log
      </h2>

      {auditLoading && (
        <div className="flex justify-center py-8 text-muted-foreground">
          <Loader2 className="animate-spin" size={24} />
        </div>
      )}

      <div className="space-y-2">
        {auditLogs?.map((log) => (
          <GlassPanel key={log.id} className="flex items-center justify-between p-3 text-sm">
            <span>
              <span className="font-medium">{log.userName ?? 'System'}</span> - {log.action.replace(/_/g, ' ')}
              {log.entityType ? ` on ${log.entityType}` : ''}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(log.createdAt).toLocaleString()}
            </span>
          </GlassPanel>
        ))}
        {!auditLoading && (!auditLogs || auditLogs.length === 0) && (
          <p className="py-4 text-center text-sm text-muted-foreground">No audit activity recorded yet.</p>
        )}
      </div>
    </div>
  );
}