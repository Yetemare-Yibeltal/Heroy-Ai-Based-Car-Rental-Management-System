import { Prisma, BookingStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';

export interface ReviewOutput {
  id: string;
  userId: string;
  userName: string;
  vehicleId: string;
  bookingId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

export interface ListReviewsQuery {
  page: number;
  limit: number;
  vehicleId?: string;
  minRating?: number;
}

function toReviewOutput(review: {
  id: string;
  userId: string;
  user: { firstName: string; lastName: string };
  vehicleId: string;
  bookingId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}): ReviewOutput {
  return {
    id: review.id,
    userId: review.userId,
    userName: `${review.user.firstName} ${review.user.lastName.charAt(0)}.`,
    vehicleId: review.vehicleId,
    bookingId: review.bookingId,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  };
}

export async function createReview(
  userId: string,
  input: { bookingId: string; rating: number; comment?: string }
): Promise<ReviewOutput> {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    include: { review: true },
  });

  if (!booking) {
    throw AppError.notFound('Booking not found.');
  }
  if (booking.userId !== userId) {
    throw AppError.forbidden('You can only review your own bookings.');
  }
  if (booking.status !== BookingStatus.COMPLETED) {
    throw AppError.badRequest('You can only review a booking after the rental is completed.');
  }
  if (booking.review) {
    throw AppError.conflict('You have already reviewed this booking.');
  }

  const review = await prisma.review.create({
    data: {
      userId,
      vehicleId: booking.vehicleId,
      bookingId: booking.id,
      rating: input.rating,
      comment: input.comment,
    },
    include: { user: { select: { firstName: true, lastName: true } } },
  });

  logger.info(`Review created for vehicle ${booking.vehicleId} by user ${userId}`);

  return toReviewOutput(review);
}

export async function listReviews(query: ListReviewsQuery) {
  const where: Prisma.ReviewWhereInput = {};

  if (query.vehicleId) where.vehicleId = query.vehicleId;
  if (query.minRating) where.rating = { gte: query.minRating };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.review.count({ where }),
  ]);

  return { reviews: reviews.map(toReviewOutput), total };
}

export async function deleteReview(
  reviewId: string,
  requesterId: string,
  requesterRole: string
): Promise<void> {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) {
    throw AppError.notFound('Review not found.');
  }

  const staffRoles = ['ADMIN', 'SUPER_ADMIN'];
  if (review.userId !== requesterId && !staffRoles.includes(requesterRole)) {
    throw AppError.forbidden('You cannot delete this review.');
  }

  await prisma.review.delete({ where: { id: reviewId } });
  logger.info(`Review ${reviewId} deleted.`);
}
