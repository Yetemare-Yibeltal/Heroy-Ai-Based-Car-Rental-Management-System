'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2 } from 'lucide-react';
import { FleetTable, FleetVehicle } from '@/components/admin/FleetTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { apiClient, ApiError } from '@/lib/api-client';

interface VehicleFormState {
  name: string;
  brand: string;
  category: string;
  transmission: string;
  fuel: string;
  seats: number;
  pricePerDay: number;
  plate: string;
  year: number;
  description: string;
  status: string;
}

const EMPTY_FORM: VehicleFormState = {
  name: '',
  brand: '',
  category: 'ECONOMY',
  transmission: 'AUTOMATIC',
  fuel: 'PETROL',
  seats: 4,
  pricePerDay: 40,
  plate: '',
  year: new Date().getFullYear(),
  description: '',
  status: 'AVAILABLE',
};

export default function AdminFleetPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VehicleFormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['admin-fleet'],
    queryFn: () => apiClient.get<FleetVehicle[]>('/vehicles?limit=100'),
  });

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(vehicle: FleetVehicle) {
    setEditingId(vehicle.id);
    setForm({
      name: vehicle.name,
      brand: vehicle.brand,
      category: vehicle.category,
      transmission: 'AUTOMATIC',
      fuel: 'PETROL',
      seats: 4,
      pricePerDay: vehicle.pricePerDay,
      plate: vehicle.plate,
      year: new Date().getFullYear(),
      description: '',
      status: vehicle.status,
    });
    setError(null);
    setDialogOpen(true);
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);

    try {
      if (editingId) {
        await apiClient.patch(`/vehicles/${editingId}`, {
          name: form.name,
          brand: form.brand,
          category: form.category,
          transmission: form.transmission,
          fuel: form.fuel,
          seats: Number(form.seats),
          pricePerDay: Number(form.pricePerDay),
          status: form.status,
        });
      } else {
        await apiClient.post('/vehicles', {
          name: form.name,
          brand: form.brand,
          category: form.category,
          transmission: form.transmission,
          fuel: form.fuel,
          seats: Number(form.seats),
          pricePerDay: Number(form.pricePerDay),
          plate: form.plate,
          year: Number(form.year),
          description: form.description || undefined,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-fleet'] });
      setDialogOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save vehicle.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(vehicle: FleetVehicle) {
    if (!confirm(`Remove ${vehicle.name} from the fleet?`)) return;
    try {
      await apiClient.delete(`/vehicles/${vehicle.id}`);
      queryClient.invalidateQueries({ queryKey: ['admin-fleet'] });
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not delete vehicle.');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Fleet</h1>
          <p className="text-sm text-muted-foreground">{vehicles?.length ?? 0} vehicles on record</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add Vehicle
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : (
        <FleetTable vehicles={vehicles ?? []} onEdit={openEdit} onDelete={handleDelete} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit vehicle' : 'Add vehicle'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input
              placeholder="Brand"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm"
              >
                {['ECONOMY', 'SUV', 'LUXURY', 'VAN', 'SPORTS', 'ELECTRIC'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm"
              >
                {['AVAILABLE', 'RENTED', 'MAINTENANCE', 'RESERVED', 'RETIRED'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Price per day"
                value={form.pricePerDay}
                onChange={(e) => setForm({ ...form, pricePerDay: Number(e.target.value) })}
              />
              <Input
                type="number"
                placeholder="Seats"
                value={form.seats}
                onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })}
              />
            </div>
            {!editingId && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Plate / Identifier"
                  value={form.plate}
                  onChange={(e) => setForm({ ...form, plate: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Year"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                />
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 size={15} className="animate-spin" />}
              {editingId ? 'Save changes' : 'Add vehicle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}