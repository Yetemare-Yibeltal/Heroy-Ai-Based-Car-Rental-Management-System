'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { apiClient, ApiError } from '@/lib/api-client';

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  verificationStatus: string;
  createdAt: string;
}

const ROLES = ['CUSTOMER', 'STAFF', 'BRANCH_MANAGER', 'ADMIN', 'SUPER_ADMIN'];

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => apiClient.get<AdminUser[]>(`/users?limit=50${search ? `&search=${search}` : ''}`),
  });

  async function updateRole(user: AdminUser, role: string) {
    try {
      await apiClient.patch(`/users/${user.id}`, { role });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not update role - check permission level.');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Users</h1>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="w-64 pl-9"
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin" size={28} />
        </div>
      )}

      <div className="space-y-2">
        {users?.map((u) => (
          <GlassPanel key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-medium">
                {u.firstName} {u.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
            </div>
            <Badge variant={u.verificationStatus === 'APPROVED' ? 'success' : 'pending'}>
              {u.verificationStatus}
            </Badge>
            <select
              value={u.role}
              onChange={(e) => updateRole(u, e.target.value)}
              className="rounded-md border border-input bg-secondary/50 px-3 py-1.5 text-xs"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </GlassPanel>
        ))}
        {!isLoading && (!users || users.length === 0) && (
          <p className="py-8 text-center text-muted-foreground">No users match this search.</p>
        )}
      </div>
    </div>
  );
}