'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, MapPin, Phone } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { AnimatedText } from '@/components/ui/AnimatedText';
import { apiClient } from '@/lib/api-client';

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  _count: { vehicles: number };
}

export default function LocationsPage() {
  const { data: locations, isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiClient.get<Location[]>('/locations', { skipAuth: true }),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <AnimatedText as="h1" className="mb-2 text-3xl font-bold sm:text-4xl">
        Our Locations
      </AnimatedText>
      <p className="mb-10 text-muted-foreground">
        Pick up and return your vehicle at any of our branches.
      </p>

      {isLoading && (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin" size={28} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {locations?.map((location) => (
          <GlassPanel key={location.id} className="p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
                <MapPin size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">{location.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {location.address}, {location.city}, {location.country}
                </p>
                {location.phone && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Phone size={13} /> {location.phone}
                  </p>
                )}
                <p className="mt-2 text-xs font-medium text-primary">
                  {location._count.vehicles} vehicle{location._count.vehicles !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}