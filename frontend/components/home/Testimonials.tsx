'use client';

import { useQuery } from '@tanstack/react-query';
import { Star, Loader2, Quote } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { AnimatedText } from '@/components/ui/AnimatedText';
import { apiClient } from '@/lib/api-client';

interface Review {
  id: string;
  userName: string;
  vehicleId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

async function fetchTopReviews(): Promise<Review[]> {
  return apiClient.get<Review[]>('/reviews?minRating=4&limit=3', { skipAuth: true });
}

export function Testimonials() {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['top-reviews'],
    queryFn: fetchTopReviews,
  });

  const reviewsWithComments = reviews?.filter((r) => r.comment && r.comment.trim().length > 0) ?? [];

  if (!isLoading && reviewsWithComments.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <AnimatedText as="h2" className="mb-10 text-center text-2xl font-bold sm:text-3xl">
        What renters are saying
      </AnimatedText>

      {isLoading && (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="animate-spin" size={28} />
        </div>
      )}

      {!isLoading && reviewsWithComments.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reviewsWithComments.map((review) => (
            <GlassPanel key={review.id} className="p-6">
              <Quote className="mb-3 text-primary/40" size={24} />
              <p className="text-sm leading-relaxed text-foreground">{review.comment}</p>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm font-medium">{review.userName}</span>
                <div className="flex gap-0.5 text-primary">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={13}
                      className={i < review.rating ? 'fill-primary' : 'fill-transparent text-muted-foreground'}
                    />
                  ))}
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}
    </section>
  );
}