import { Request, Response } from 'express';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { AppError } from '../../utils/AppError';
import * as verificationService from './verification.service';
import { SubmitVerificationInput, ReviewVerificationInput } from './verification.types';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../constants/enums';
import { VerificationStatus } from '@prisma/client';

export async function submitVerification(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  const input = req.body as SubmitVerificationInput;
  const doc = await verificationService.submitVerification(req.user.userId, input);
  sendSuccess(res, 201, 'Verification document submitted. It will be reviewed shortly.', doc);
}

export async function listMyVerifications(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  const docs = await verificationService.listMyVerifications(req.user.userId);
  sendSuccess(res, 200, 'Your verification documents fetched.', docs);
}

export async function listVerifications(req: Request, res: Response): Promise<void> {
  const page = Math.max(parseInt(String(req.query.page ?? DEFAULT_PAGE), 10), 1);
  const limit = Math.min(
    Math.max(parseInt(String(req.query.limit ?? DEFAULT_PAGE_SIZE), 10), 1),
    MAX_PAGE_SIZE
  );
  const status = req.query.status as VerificationStatus | undefined;

  const result = await verificationService.listVerifications({ page, limit, status });
  sendPaginated(res, 'Verification documents fetched.', result.documents, {
    page,
    limit,
    total: result.total,
  });
}

export async function reviewVerification(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized('Authentication required.');
  const input = req.body as ReviewVerificationInput;
  const doc = await verificationService.reviewVerification(req.params.id, req.user.userId, input);
  sendSuccess(res, 200, 'Verification reviewed.', doc);
}
