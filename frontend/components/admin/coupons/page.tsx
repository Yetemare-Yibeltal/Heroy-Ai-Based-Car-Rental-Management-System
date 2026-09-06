'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Ban, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { apiClient, ApiError } from '@/lib/api-client';

interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
}

export default function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [code, setCode] = useState('');
  const [type, setType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [value, setValue] = useState(10);
  const [maxUses, setMaxUses] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => apiClient.get<Coupon[]>('/coupons?limit=50'),
  });

  async function handleCreate() {
    setIsSaving(true);
    setError(null);
    try {
      await apiClient.post('/coupons', { code, type, value, maxUses });
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setDialogOpen(false);
      setCode('');
      setValue(10);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create coupon.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate(coupon: Coupon) {
    try {
      await apiClient.patch(`/coupons/${coupon.id}/deactivate`, {});
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not deactivate coupon.');
    }
  }

  async function handleDelete(coupon: Coupon) {
    if (!confirm(`Delete coupon ${coupon.code}?`)) return;
    try {
      await apiClient.delete(`/coupons/${coupon.id}`);
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not delete coupon.');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Coupons</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus size={16} /> New Coupon
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin" size={28} />
        </div>
      )}

      <div className="space-y-2">
        {coupons?.map((coupon) => (
          <GlassPanel key={coupon.id} className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-mono text-sm font-semibold">{coupon.code}</p>
              <p className="text-xs text-muted-foreground">
                {coupon.type === 'PERCENTAGE' ? `${coupon.value}% off` : `$${coupon.value} off`} ·{' '}
                {coupon.usedCount}/{coupon.maxUses ?? '∞'} used
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={coupon.active ? 'success' : 'secondary'}>
                {coupon.active ? 'Active' : 'Inactive'}
              </Badge>
              {coupon.active && (
                <button
                  onClick={() => handleDeactivate(coupon)}
                  aria-label="Deactivate coupon"
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Ban size={15} />
                </button>
              )}
              <button
                onClick={() => handleDelete(coupon)}
                aria-label="Delete coupon"
                className="text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </GlassPanel>
        ))}
        {!isLoading && (!coupons || coupons.length === 0) && (
          <p className="py-8 text-center text-muted-foreground">No coupons yet.</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create coupon</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="CODE" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'PERCENTAGE' | 'FIXED')}
                className="rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm"
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed amount</option>
              </select>
              <Input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
            </div>
            <Input
              type="number"
              placeholder="Max uses"
              value={maxUses}
              onChange={(e) => setMaxUses(Number(e.target.value))}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSaving || !code}>
              {isSaving && <Loader2 size={15} className="animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}