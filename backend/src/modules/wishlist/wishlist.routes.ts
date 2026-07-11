import { Router } from 'express';
import * as wishlistController from './wishlist.controller';
import { authenticate } from '../../middleware/auth';
import { catchAsync } from '../../utils/catchAsync';

export const wishlistRoutes = Router();

wishlistRoutes.get('/', authenticate, catchAsync(wishlistController.listMyWishlist));

wishlistRoutes.post('/', authenticate, catchAsync(wishlistController.addToWishlist));

wishlistRoutes.get(
  '/:vehicleId/status',
  authenticate,
  catchAsync(wishlistController.checkWishlistStatus)
);

wishlistRoutes.delete(
  '/:vehicleId',
  authenticate,
  catchAsync(wishlistController.removeFromWishlist)
);
