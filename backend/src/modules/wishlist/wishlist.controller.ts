import { Request, Response } from 'express';
import { sendSuccess, sendNoContent } from '../../utils/apiResponse';
import { AppError } from '../../utils/AppError';
import * as wishlistService from './wishlist.service';

export async function addToWishlist(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  const { vehicleId } = req.body as { vehicleId: string };
  const item = await wishlistService.addToWishlist(req.user.userId, vehicleId);
  sendSuccess(res, 201, 'Added to wishlist.', item);
}

export async function removeFromWishlist(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  await wishlistService.removeFromWishlist(req.user.userId, req.params.vehicleId);
  sendNoContent(res);
}

export async function listMyWishlist(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  const items = await wishlistService.listMyWishlist(req.user.userId);
  sendSuccess(res, 200, 'Wishlist fetched.', items);
}

export async function checkWishlistStatus(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  const isWishlisted = await wishlistService.isVehicleWishlisted(
    req.user.userId,
    req.params.vehicleId
  );
  sendSuccess(res, 200, 'Wishlist status fetched.', { isWishlisted });
}
