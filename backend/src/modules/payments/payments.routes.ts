import { Router, Request, Response } from 'express';
import * as paymentsController from './payments.controller';
import { handleStripeWebhook, handleChapaWebhook } from './payments.webhook';
import { generateInvoicePdf } from './invoice.service';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { paymentLimiter } from '../../middleware/rateLimiter';
import { catchAsync } from '../../utils/catchAsync';
import { ADMIN_ROLES } from '../../constants/enums';
import { initiatePaymentSchema } from './payments.validation';

export const paymentsRoutes = Router();

// ---------------------------------------------
// Webhooks - no auth middleware; signature verification inside
// the handler itself is what authenticates these requests.
// The raw-body parsing for these two paths is registered in app.ts.
// ---------------------------------------------

paymentsRoutes.post('/stripe/webhook', catchAsync(handleStripeWebhook));
paymentsRoutes.post('/chapa/webhook', catchAsync(handleChapaWebhook));

// ---------------------------------------------
// Customer-facing checkout
// ---------------------------------------------

paymentsRoutes.post(
  '/initiate',
  authenticate,
  paymentLimiter,
  validate(initiatePaymentSchema),
  catchAsync(paymentsController.initiatePayment)
);

paymentsRoutes.get(
  '/booking/:bookingId',
  authenticate,
  catchAsync(paymentsController.getPaymentForBooking)
);

paymentsRoutes.get(
  '/booking/:bookingId/invoice',
  authenticate,
  catchAsync(async (req: Request, res: Response) => {
    const pdfBuffer = await generateInvoicePdf(req.params.bookingId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="invoice-${req.params.bookingId}.pdf"`
    );
    res.status(200).send(pdfBuffer);
  })
);

// ---------------------------------------------
// Admin-only
// ---------------------------------------------

paymentsRoutes.post(
  '/booking/:bookingId/refund',
  authenticate,
  authorize(...ADMIN_ROLES),
  catchAsync(paymentsController.refundPayment)
);
