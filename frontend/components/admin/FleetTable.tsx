'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface FleetVehicle {
  id: string;
  name: string;
  brand: string;
  category: string;
  pricePerDay: number;
  plate: string;
  status: string;
}

interface FleetTableProps {
  vehicles: FleetVehicle[];
  onEdit: (vehicle: FleetVehicle) => void;
  onDelete: (vehicle: FleetVehicle) => void;
}

const STATUS_VARIANT: Record<string, 'success' | 'pending' | 'destructive' | 'secondary'> = {
  AVAILABLE: 'success',
  RENTED: 'pending',
  MAINTENANCE: 'destructive',
  RESERVED: 'pending',
  RETIRED: 'secondary',
};

export function FleetTable({ vehicles, onEdit, onDelete }: FleetTableProps) {
  return (
    <div className="glass-panel overflow-hidden rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-secondary/40 text-left">
            {['Vehicle', 'Category', 'Rate/day', 'Plate', 'Status', ''].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => (
            <tr key={vehicle.id} className="border-t border-border">
              <td className="px-4 py-3 font-medium">{vehicle.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{vehicle.category}</td>
              <td className="px-4 py-3 font-mono">${vehicle.pricePerDay}</td>
              <td className="px-4 py-3">
                <span className="rounded bg-secondary px-2 py-0.5 font-mono text-xs">{vehicle.plate}</span>
              </td>
              <td className="px-4 py-3">
                <Badge variant={STATUS_VARIANT[vehicle.status] ?? 'secondary'}>{vehicle.status}</Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onEdit(vehicle)}
                  aria-label="Edit vehicle"
                  className="mr-3 text-muted-foreground transition-colors hover:text-primary"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => onDelete(vehicle)}
                  aria-label="Delete vehicle"
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 size={15} />
                </button>
              </td>
            </tr>
          ))}
          {vehicles.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                No vehicles found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}