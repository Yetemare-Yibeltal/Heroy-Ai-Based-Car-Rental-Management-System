import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../utils/AppError';
import * as paymentsService from './payments.service';
import { InitiatePaymentInput } from './payments.types';

export async function initiatePayment(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  const input = req.body as InitiatePaymentInput;
  const result = await paymentsService.initiatePayment(req.user.userId, input);
  sendSuccess(res, 201, 'Payment initiated.', result);
}

export async function getPaymentForBooking(req: Request, res: Response): Promise<void> {
  const payment = await paymentsService.getPaymentByBooking(req.params.bookingId);
  if (!payment) {
    throw AppError.notFound('No payment found for this booking.');
  }
  sendSuccess(res, 200, 'Payment fetched.', payment);
}

export async function refundPayment(req: Request, res: Response): Promise<void> {
  await paymentsService.refundPayment(req.params.bookingId);
  sendSuccess(res, 200, 'Payment refunded.', null);
}
