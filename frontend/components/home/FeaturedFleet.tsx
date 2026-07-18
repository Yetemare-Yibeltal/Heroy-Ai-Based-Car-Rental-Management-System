'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Fuel, Gauge, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { AnimatedText } from '@/components/ui/AnimatedText';
import { apiClient } from '@/lib/api-client';

interface Vehicle {
  id: string;
  name: string;
  brand: string;
  category: string;
  transmission: string;
  fuel: string;
  seats: number;
  pricePerDay: number;
  images: { url: string; isPrimary: boolean }[];
  averageRating: number | null;
}

async function fetchFeaturedVehicles(): Promise<Vehicle[]> {
  return apiClient.get<Vehicle[]>('/vehicles?limit=3&sortBy=newest&status=AVAILABLE', {
    skipAuth: true,
  });
}

export function FeaturedFleet() {
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['featured-vehicles'],
    queryFn: fetchFeaturedVehicles,
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-10 flex items-end justify-between">
        <AnimatedText as="h2" className="text-2xl font-bold sm:text-3xl">
          Ready to drive today
        </AnimatedText>
        <Link
          href="/fleet"
          className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex"
        >
          View all <ArrowRight size={14} />
        </Link>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin" size={28} />
        </div>
      )}

      {!isLoading && (!vehicles || vehicles.length === 0) && (
        <p className="py-16 text-center text-muted-foreground">
          No vehicles are currently available. Check back shortly.
        </p>
      )}

      {!isLoading && vehicles && vehicles.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => {
            const primaryImage = vehicle.images.find((img) => img.isPrimary) ?? vehicle.images[0];

            return (
              <Link key={vehicle.id} href={`/fleet/${vehicle.id}`}>
                <GlassPanel hoverLift className="h-full overflow-hidden">
                  <div className="relative h-44 bg-gradient-to-br from-secondary to-secondary/40">
                    {primaryImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={primaryImage.url}
                        alt={vehicle.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        {vehicle.brand}
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-display text-lg font-semibold">{vehicle.name}</h3>
                        <p className="text-xs text-muted-foreground">{vehicle.category}</p>
                      </div>
                      {vehicle.averageRating && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                          ★ {vehicle.averageRating.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Gauge size={12} /> {vehicle.transmission}
                      </span>
                      <span className="flex items-center gap-1">
                        <Fuel size={12} /> {vehicle.fuel}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {vehicle.seats}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                      <span className="font-mono text-lg font-bold">
                        ${vehicle.pricePerDay}
                        <span className="text-xs font-normal text-muted-foreground">/day</span>
                      </span>
                      <Button size="sm" variant="ghost">
                        Book Now
                      </Button>
                    </div>
                  </div>
                </GlassPanel>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}