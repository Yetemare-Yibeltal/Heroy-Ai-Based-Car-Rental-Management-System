'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, SlidersHorizontal } from 'lucide-react';
import { FleetFilters, FleetFilterState } from '@/components/fleet/FleetFilters';
import { VehicleCard, VehicleCardData } from '@/components/fleet/VehicleCard';
import { AnimatedText } from '@/components/ui/AnimatedText';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { apiClient } from '@/lib/api-client';

const DEFAULT_FILTERS: FleetFilterState = {
  search: '',
  category: '',
  transmission: '',
  fuel: '',
  maxPrice: '',
  seats: '',
  sortBy: 'newest',
};

interface VehiclesResponse {
  vehicles: VehicleCardData[];
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export default function FleetPage() {
  const [filters, setFilters] = useState<FleetFilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const debouncedFilters = useDebouncedValue(filters, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedFilters]);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: '9', sortBy: debouncedFilters.sortBy });
    if (debouncedFilters.search) params.set('search', debouncedFilters.search);
    if (debouncedFilters.category) params.set('category', debouncedFilters.category);
    if (debouncedFilters.transmission) params.set('transmission', debouncedFilters.transmission);
    if (debouncedFilters.fuel) params.set('fuel', debouncedFilters.fuel);
    if (debouncedFilters.maxPrice) params.set('maxPrice', debouncedFilters.maxPrice);
    if (debouncedFilters.seats) params.set('seats', debouncedFilters.seats);
    return params.toString();
  }, [debouncedFilters, page]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['fleet', queryParams],
    queryFn: () => apiClient.get<VehicleCardData[]>(`/vehicles?${queryParams}`, { skipAuth: true }),
  });

  const vehicles = data ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <AnimatedText as="h1" className="text-3xl font-bold sm:text-4xl">
          The Fleet
        </AnimatedText>

        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="glass" size="sm" className="lg:hidden">
              <SlidersHorizontal size={15} /> Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filter vehicles</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FleetFilters filters={filters} onChange={setFilters} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <FleetFilters filters={filters} onChange={setFilters} />
          </div>
        </aside>

        <div>
          {(isLoading || isFetching) && (
            <div className="flex justify-center py-20 text-muted-foreground">
              <Loader2 className="animate-spin" size={28} />
            </div>
          )}

          {!isLoading && !isFetching && vehicles.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              No vehicles match your current filters. Try adjusting them.
            </div>
          )}

          {!isLoading && !isFetching && vehicles.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {vehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>

              <div className="mt-10 flex justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm text-muted-foreground">Page {page}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={vehicles.length < 9}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}