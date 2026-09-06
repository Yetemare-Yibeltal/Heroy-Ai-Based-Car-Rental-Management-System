'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Star, Trash2 } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { apiClient, ApiError } from '@/lib/api-client';

interface AdminReview {
  id: string;
  userName: string;
  vehicleId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => apiClient.get<AdminReview[]>('/reviews?limit=50'),
  });

  async function handleDelete(review: AdminReview) {
    if (!confirm('Remove this review?')) return;
    try {
      await apiClient.delete(`/reviews/${review.id}`);
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not delete review.');
    }
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Reviews</h1>

      {isLoading && (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin" size={28} />
        </div>
      )}

      <div className="space-y-3">
        {reviews?.map((review) => (
          <GlassPanel key={review.id} className="flex items-start justify-between gap-4 p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{review.userName}</p>
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
                <p className="mt-1.5 text-sm text-muted-foreground">{review.comment}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground/70">
                {new Date(review.createdAt).toDateString()}
              </p>
            </div>
            <button
              onClick={() => handleDelete(review)}
              aria-label="Delete review"
              className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
            >
              <Trash2 size={16} />
            </button>
          </GlassPanel>
        ))}
        {!isLoading && (!reviews || reviews.length === 0) && (
          <p className="py-8 text-center text-muted-foreground">No reviews yet.</p>
        )}
      </div>
    </div>
  );
}