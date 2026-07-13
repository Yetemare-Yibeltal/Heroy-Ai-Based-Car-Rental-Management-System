import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../utils/AppError';
import * as subscriptionService from './subscription.service';
import { CreateSubscriptionInput } from './subscription.types';
import { SubscriptionStatus } from '@prisma/client';

export async function createSubscription(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  const input = req.body as CreateSubscriptionInput;
  const subscription = await subscriptionService.createSubscription(req.user.userId, input);
  sendSuccess(res, 201, 'Subscription created.', subscription);
}

export async function listMySubscriptions(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  const subscriptions = await subscriptionService.listMySubscriptions(req.user.userId);
  sendSuccess(res, 200, 'Your subscriptions fetched.', subscriptions);
}

export async function listSubscriptions(req: Request, res: Response): Promise<void> {
  const status = req.query.status as SubscriptionStatus | undefined;
  const subscriptions = await subscriptionService.listSubscriptions(status);
  sendSuccess(res, 200, 'Subscriptions fetched.', subscriptions);
}

export async function pauseSubscription(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  const subscription = await subscriptionService.pauseSubscription(req.params.id, req.user.userId);
  sendSuccess(res, 200, 'Subscription paused.', subscription);
}

export async function resumeSubscription(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  const subscription = await subscriptionService.resumeSubscription(req.params.id, req.user.userId);
  sendSuccess(res, 200, 'Subscription resumed.', subscription);
}

export async function cancelSubscription(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  const subscription = await subscriptionService.cancelSubscription(req.params.id, req.user.userId);
  sendSuccess(res, 200, 'Subscription cancelled.', subscription);
}