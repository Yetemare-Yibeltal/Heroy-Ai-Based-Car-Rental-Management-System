import { Router } from 'express';
import * as reviewsController from './reviews.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { catchAsync } from '../../utils/catchAsync';
import { createReviewSchema, listReviewsQuerySchema } from './reviews.validation';

export const reviewsRoutes = Router();

reviewsRoutes.get(
  '/',
  validate(listReviewsQuerySchema, 'query'),
  catchAsync(reviewsController.listReviews)
);

reviewsRoutes.post(
  '/',
  authenticate,
  validate(createReviewSchema),
  catchAsync(reviewsController.createReview)
);

reviewsRoutes.delete('/:id', authenticate, catchAsync(reviewsController.deleteReview));
