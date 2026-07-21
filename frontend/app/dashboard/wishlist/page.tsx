'use client';

import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Heart, X } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';

interface WishlistItem {
  id: string;
  vehicleId: string;
  vehicleName: string;
  vehicleBrand: string;
  pricePerDay: number;
  status: string;
  primaryImageUrl: string | null;
}

export default function WishlistPage() {
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ['my-wishlist'],
    queryFn: () => apiClient.get<WishlistItem[]>('/wishlist'),
  });

  async function handleRemove(vehicleId: string) {
    await apiClient.delete(`/wishlist/${vehicleId}`);
    queryClient.invalidateQueries({ queryKey: ['my-wishlist'] });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-display text-2xl font-bold sm:text-3xl">My Wishlist</h1>

      {isLoading && (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin" size={28} />
        </div>
      )}

      {!isLoading && (!items || items.length === 0) && (
        <GlassPanel className="p-8 text-center text-muted-foreground">
          <Heart size={28} className="mx-auto mb-3 text-muted-foreground/50" />
          You haven't saved any vehicles yet.
          <div className="mt-4">
            <Button asChild size="sm">
              <Link href="/fleet">Browse the fleet</Link>
            </Button>
          </div>
        </GlassPanel>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items?.map((item) => (
          <GlassPanel key={item.id} className="flex items-center gap-4 p-4">
            <div className="h-16 w-20 shrink-0 overflow-hidden rounded-md bg-secondary">
              {item.primaryImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.primaryImageUrl} alt={item.vehicleName} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="flex-1">
              <Link href={`/fleet/${item.vehicleId}`} className="font-semibold hover:text-primary">
                {item.vehicleName}
              </Link>
              <p className="text-xs text-muted-foreground">{item.vehicleBrand}</p>
              <p className="mt-1 font-mono text-sm font-semibold">${item.pricePerDay}/day</p>
            </div>
            <button
              onClick={() => handleRemove(item.vehicleId)}
              aria-label="Remove from wishlist"
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
            >
              <X size={16} />
            </button>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}