'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Fuel, Gauge, Users, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';

export interface VehicleCardData {
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
  status: string;
}

interface VehicleCardProps {
  vehicle: VehicleCardData;
  initiallyWishlisted?: boolean;
}

export function VehicleCard({ vehicle, initiallyWishlisted = false }: VehicleCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(initiallyWishlisted);
  const [isToggling, setIsToggling] = useState(false);
  const user = useAuthStore((state) => state.user);

  const primaryImage = vehicle.images.find((img) => img.isPrimary) ?? vehicle.images[0];
  const isAvailable = vehicle.status === 'AVAILABLE';

  async function toggleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    if (!user || isToggling) return;

    setIsToggling(true);
    try {
      if (isWishlisted) {
        await apiClient.delete(`/wishlist/${vehicle.id}`);
        setIsWishlisted(false);
      } else {
        await apiClient.post('/wishlist', { vehicleId: vehicle.id });
        setIsWishlisted(true);
      }
    } catch {
      // Silently ignore - the heart just won't toggle if this fails.
    } finally {
      setIsToggling(false);
    }
  }

  return (
    <Link href={`/fleet/${vehicle.id}`}>
      <GlassPanel hoverLift className="h-full overflow-hidden">
        <div className="relative h-44 bg-gradient-to-br from-secondary to-secondary/40">
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={primaryImage.url} alt={vehicle.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {vehicle.brand}
            </div>
          )}

          {user && (
            <button
              onClick={toggleWishlist}
              disabled={isToggling}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-colors hover:bg-black/60"
            >
              <Heart
                size={15}
                className={cn(isWishlisted ? 'fill-primary text-primary' : 'text-white')}
              />
            </button>
          )}

          {!isAvailable && (
            <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {vehicle.status === 'RENTED' ? 'Currently rented' : 'Unavailable'}
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
            <Button size="sm" variant="ghost" disabled={!isAvailable}>
              {isAvailable ? 'View Details' : 'Unavailable'}
            </Button>
          </div>
        </div>
      </GlassPanel>
    </Link>
  );
}