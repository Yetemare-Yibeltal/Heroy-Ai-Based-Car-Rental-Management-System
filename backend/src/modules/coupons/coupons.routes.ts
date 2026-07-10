import { Router } from 'express';
import * as couponsController from './coupons.controller';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { catchAsync } from '../../utils/catchAsync';
import { ADMIN_ROLES } from '../../constants/enums';
import { createCouponSchema, updateCouponSchema } from './coupons.validation';

export const couponsRoutes = Router();
couponsRoutes.get(
  '/loyalty/balance',
  authenticate,
  catchAsync(couponsController.getMyLoyaltyBalance)
);
couponsRoutes.post(
  '/loyalty/redeem',
  authenticate,
  catchAsync(couponsController.redeemLoyaltyPoints)
);
couponsRoutes.get('/check/:code', catchAsync(couponsController.checkCoupon));

couponsRoutes.get(
  '/',
  authenticate,
  authorize(...ADMIN_ROLES),
  catchAsync(couponsController.listCoupons)
);

couponsRoutes.post(
  '/',
  authenticate,
  authorize(...ADMIN_ROLES),
  validate(createCouponSchema),
  catchAsync(couponsController.createCoupon)
);

couponsRoutes.patch(
  '/:id',
  authenticate,
  authorize(...ADMIN_ROLES),
  validate(updateCouponSchema),
  catchAsync(couponsController.updateCoupon)
);

couponsRoutes.patch(
  '/:id/deactivate',
  authenticate,
  authorize(...ADMIN_ROLES),
  catchAsync(couponsController.deactivateCoupon)
);

couponsRoutes.delete(
  '/:id',
  authenticate,
  authorize(...ADMIN_ROLES),
  catchAsync(couponsController.deleteCoupon)
);
