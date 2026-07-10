import { Request, Response } from 'express';
import { sendSuccess, sendPaginated, sendNoContent } from '../../utils/apiResponse';
import { AppError } from '../../utils/AppError';
import * as reviewsService from './reviews.service';
import { CreateReviewSchema } from './reviews.validation';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../constants/enums';

export async function createReview(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  const input = req.body as CreateReviewSchema;
  const review = await reviewsService.createReview(req.user.userId, input);
  sendSuccess(res, 201, 'Review submitted.', review);
}

export async function listReviews(req: Request, res: Response): Promise<void> {
  const page = Math.max(parseInt(String(req.query.page ?? DEFAULT_PAGE), 10), 1);
  const limit = Math.min(
    Math.max(parseInt(String(req.query.limit ?? DEFAULT_PAGE_SIZE), 10), 1),
    MAX_PAGE_SIZE
  );
  const vehicleId = req.query.vehicleId ? String(req.query.vehicleId) : undefined;
  const minRating = req.query.minRating ? Number(req.query.minRating) : undefined;

  const result = await reviewsService.listReviews({ page, limit, vehicleId, minRating });

  sendPaginated(res, 'Reviews fetched.', result.reviews, { page, limit, total: result.total });
}

export async function deleteReview(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  await reviewsService.deleteReview(req.params.id, req.user.userId, req.user.role);
  sendNoContent(res);
}
