import { Request, Response } from 'express';
import { sendSuccess, sendNoContent } from '../../utils/apiResponse';
import { AppError } from '../../utils/AppError';
import * as referralService from './referral.service';
import * as pushService from './pushNotifications.service';
import * as newsletterService from './newsletter.service';

export async function getMyReferralStats(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  const stats = referralService.getReferralStats(req.user.userId);
  sendSuccess(res, 200, 'Referral stats fetched.', stats);
}

export async function getVapidPublicKey(req: Request, res: Response): Promise<void> {
  const publicKey = pushService.getVapidPublicKey();
  sendSuccess(res, 200, 'VAPID public key fetched.', { publicKey });
}

export async function subscribeToPush(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  pushService.subscribeToPush(req.user.userId, req.body);
  sendSuccess(res, 201, 'Subscribed to push notifications.', null);
}

export async function unsubscribeFromPush(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  const { endpoint } = req.body as { endpoint: string };
  pushService.unsubscribeFromPush(req.user.userId, endpoint);
  sendNoContent(res);
}

export async function subscribeToNewsletter(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email: string };
  const { confirmationToken } = await newsletterService.subscribeToNewsletter(email);
  const confirmationLink = newsletterService.buildConfirmationLink(email, confirmationToken);
  sendSuccess(res, 201, 'Please check your email to confirm your subscription.', {
    confirmationLink,
  });
}

export async function confirmNewsletter(req: Request, res: Response): Promise<void> {
  const { email, token } = req.query as { email: string; token: string };
  newsletterService.confirmNewsletterSubscription(email, token);
  sendSuccess(res, 200, 'Newsletter subscription confirmed.', null);
}

export async function unsubscribeFromNewsletter(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email: string };
  newsletterService.unsubscribeFromNewsletter(email);
  sendNoContent(res);
}
