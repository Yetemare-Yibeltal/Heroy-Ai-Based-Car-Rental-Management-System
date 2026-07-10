import { Request, Response } from 'express';
import { sendSuccess, sendPaginated, sendNoContent } from '../../utils/apiResponse';
import * as couponsService from './coupons.service';
import { CreateCouponSchema, UpdateCouponSchema } from './coupons.validation';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../constants/enums';

export async function checkCoupon(req: Request, res: Response): Promise<void> {
  const code = String(req.params.code);
  const coupon = await couponsService.checkCouponValidity(code);
  sendSuccess(res, 200, 'Coupon is valid.', coupon);
}

export async function createCoupon(req: Request, res: Response): Promise<void> {
  const input = req.body as CreateCouponSchema;
  const coupon = await couponsService.createCoupon(input);
  sendSuccess(res, 201, 'Coupon created.', coupon);
}

export async function listCoupons(req: Request, res: Response): Promise<void> {
  const page = Math.max(parseInt(String(req.query.page ?? DEFAULT_PAGE), 10), 1);
  const limit = Math.min(
    Math.max(parseInt(String(req.query.limit ?? DEFAULT_PAGE_SIZE), 10), 1),
    MAX_PAGE_SIZE
  );

  const result = await couponsService.listCoupons(page, limit);
  sendPaginated(res, 'Coupons fetched.', result.coupons, { page, limit, total: result.total });
}

export async function updateCoupon(req: Request, res: Response): Promise<void> {
  const input = req.body as UpdateCouponSchema;
  const coupon = await couponsService.updateCoupon(req.params.id, input);
  sendSuccess(res, 200, 'Coupon updated.', coupon);
}

export async function deactivateCoupon(req: Request, res: Response): Promise<void> {
  const coupon = await couponsService.deactivateCoupon(req.params.id);
  sendSuccess(res, 200, 'Coupon deactivated.', coupon);
}

export async function deleteCoupon(req: Request, res: Response): Promise<void> {
  await couponsService.deleteCoupon(req.params.id);
  sendNoContent(res);
}
