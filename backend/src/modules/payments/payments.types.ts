import { PaymentProvider, PaymentStatus, PaymentMethod } from '@prisma/client';

export interface InitiatePaymentInput {
  bookingId: string;
  provider: PaymentProvider;
}

export interface StripePaymentResult {
  provider: 'STRIPE';
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export interface ChapaPaymentResult {
  provider: 'CHAPA';
  checkoutUrl: string;
  txRef: string;
  amount: number;
  currency: string;
}

export type InitiatePaymentResult = StripePaymentResult | ChapaPaymentResult;

export interface PaymentOutput {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  method: PaymentMethod;
  status: PaymentStatus;
  invoiceUrl: string | null;
  createdAt: Date;
}
