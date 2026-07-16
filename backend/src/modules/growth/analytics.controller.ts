import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { trackEvent, AnalyticsEventName } from '../../integrations/analytics';

export async function trackFrontendEvent(req: Request, res: Response): Promise<void> {
  const { eventName, metadata } = req.body as {
    eventName: AnalyticsEventName;
    metadata?: Record<string, unknown>;
  };

  await trackEvent(eventName, req.user?.userId, metadata);

  sendSuccess(res, 200, 'Event tracked.', null);
}
