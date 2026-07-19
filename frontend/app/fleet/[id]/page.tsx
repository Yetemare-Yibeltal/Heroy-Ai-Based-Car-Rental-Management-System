'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Fuel, Gauge, Users, Calendar, Star } from 'lucide-react';
import { VehicleGallery } from '@/components/fleet/VehicleGallery';
import { BookingWidget } from '@/components/booking/BookingWidget';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';

interface VehicleDetail {
  id: string;
  name: string;
  brand: string;
  category: string;
  transmission: string;
  fuel: string;
  seats: number;
  pricePerDay: number;
  status: string;
  description: string | null;
  year: number;
  mileage: number;
  images: { id: string; url: string; isPrimary: boolean }[];
  averageRating: number | null;
  reviewCount: number;
  locationName: string | null;
}

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export default function VehicleDetailPage() {
  const params = useParams<{ id: string }>();

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ['vehicle', params.id],
    queryFn: () => apiClient.get<VehicleDetail>(`/vehicles/${params.id}`, { skipAuth: true }),
  });

  const { data: reviews } = useQuery({
    queryKey: ['vehicle-reviews', params.id],
    queryFn: () => apiClient.get<Review[]>(`/reviews?vehicleId=${params.id}&limit=10`, { skipAuth: true }),
    enabled: Boolean(vehicle),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-32 text-muted-foreground">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="py-32 text-center text-muted-foreground">
        Vehicle not found. It may have been removed from the fleet.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <VehicleGallery images={vehicle.images} vehicleName={vehicle.name} />

          <div className="mt-6 flex items-start justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold">{vehicle.name}</h1>
              <p className="text-muted-foreground">
                {vehicle.brand} · {vehicle.category} · {vehicle.year}
              </p>
            </div>
            <Badge variant={vehicle.status === 'AVAILABLE' ? 'success' : 'secondary'}>
              {vehicle.status === 'AVAILABLE' ? 'Available' : vehicle.status}
            </Badge>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <GlassPanel className="flex flex-col items-center gap-1.5 p-4 text-center">
              <Gauge size={18} className="text-primary" />
              <span className="text-xs text-muted-foreground">{vehicle.transmission}</span>
            </GlassPanel>
            <GlassPanel className="flex flex-col items-center gap-1.5 p-4 text-center">
              <Fuel size={18} className="text-primary" />
              <span className="text-xs text-muted-foreground">{vehicle.fuel}</span>
            </GlassPanel>
            <GlassPanel className="flex flex-col items-center gap-1.5 p-4 text-center">
              <Users size={18} className="text-primary" />
              <span className="text-xs text-muted-foreground">{vehicle.seats} seats</span>
            </GlassPanel>
            <GlassPanel className="flex flex-col items-center gap-1.5 p-4 text-center">
              <Calendar size={18} className="text-primary" />
              <span className="text-xs text-muted-foreground">{vehicle.mileage.toLocaleString()} mi</span>
            </GlassPanel>
          </div>

          {vehicle.description && (
            <div className="mt-8">
              <h2 className="mb-2 font-display text-lg font-semibold">About this vehicle</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{vehicle.description}</p>
            </div>
          )}

          <div className="mt-10">
            <div className="mb-4 flex items-center gap-2">
              <h2 className="font-display text-lg font-semibold">Reviews</h2>
              {vehicle.averageRating && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star size={13} className="fill-primary text-primary" /> {vehicle.averageRating.toFixed(1)} (
                  {vehicle.reviewCount})
                </span>
              )}
            </div>

            {(!reviews || reviews.length === 0) && (
              <p className="text-sm text-muted-foreground">No reviews yet for this vehicle.</p>
            )}

            <div className="space-y-4">
              {reviews?.map((review) => (
                <GlassPanel key={review.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{review.userName}</span>
                    <div className="flex gap-0.5 text-primary">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={i < review.rating ? 'fill-primary' : 'fill-transparent text-muted-foreground'}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                  )}
                </GlassPanel>
              ))}
            </div>
          </div>
        </div>

        <div>
          <BookingWidget
            vehicleId={vehicle.id}
            vehicleName={vehicle.name}
            pricePerDay={vehicle.pricePerDay}
            isAvailable={vehicle.status === 'AVAILABLE'}
          />
        </div>
      </div>
    </div>
  );
}