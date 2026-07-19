'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { cn } from '@/lib/utils';

export interface FleetFilterState {
  search: string;
  category: string;
  transmission: string;
  fuel: string;
  maxPrice: string;
  seats: string;
  sortBy: string;
}

interface FleetFiltersProps {
  filters: FleetFilterState;
  onChange: (filters: FleetFilterState) => void;
}

const CATEGORIES = ['ECONOMY', 'SUV', 'LUXURY', 'VAN', 'SPORTS', 'ELECTRIC'];
const TRANSMISSIONS = ['AUTOMATIC', 'MANUAL'];
const FUELS = ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-transparent text-muted-foreground hover:border-primary/50 hover:text-foreground'
      )}
    >
      {label}
    </button>
  );
}

export function FleetFilters({ filters, onChange }: FleetFiltersProps) {
  function update(patch: Partial<FleetFilterState>) {
    onChange({ ...filters, ...patch });
  }

  return (
    <GlassPanel className="space-y-6 p-5">
      <div>
        <label className="mb-2 block text-xs font-medium text-muted-foreground">Search</label>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search by name or brand"
            className="pl-9"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-muted-foreground">Category</label>
        <div className="flex flex-wrap gap-2">
          <FilterChip label="All" active={filters.category === ''} onClick={() => update({ category: '' })} />
          {CATEGORIES.map((cat) => (
            <FilterChip
              key={cat}
              label={cat.charAt(0) + cat.slice(1).toLowerCase()}
              active={filters.category === cat}
              onClick={() => update({ category: filters.category === cat ? '' : cat })}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-muted-foreground">Transmission</label>
        <div className="flex flex-wrap gap-2">
          {TRANSMISSIONS.map((t) => (
            <FilterChip
              key={t}
              label={t.charAt(0) + t.slice(1).toLowerCase()}
              active={filters.transmission === t}
              onClick={() => update({ transmission: filters.transmission === t ? '' : t })}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-muted-foreground">Fuel Type</label>
        <div className="flex flex-wrap gap-2">
          {FUELS.map((f) => (
            <FilterChip
              key={f}
              label={f.charAt(0) + f.slice(1).toLowerCase()}
              active={filters.fuel === f}
              onClick={() => update({ fuel: filters.fuel === f ? '' : f })}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-muted-foreground">
          Max price per day: {filters.maxPrice ? `$${filters.maxPrice}` : 'Any'}
        </label>
        <input
          type="range"
          min={20}
          max={300}
          step={10}
          value={filters.maxPrice || 300}
          onChange={(e) => update({ maxPrice: e.target.value })}
          className="w-full accent-primary"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-muted-foreground">Minimum seats</label>
        <div className="flex gap-2">
          {['2', '4', '5', '7'].map((s) => (
            <FilterChip
              key={s}
              label={`${s}+`}
              active={filters.seats === s}
              onClick={() => update({ seats: filters.seats === s ? '' : s })}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-muted-foreground">Sort by</label>
        <select
          value={filters.sortBy}
          onChange={(e) => update({ sortBy: e.target.value })}
          className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </GlassPanel>
  );
}