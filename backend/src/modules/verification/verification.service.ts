import { Prisma, VerificationStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import { createNotification } from '../notifications/notifications.service';
import {
  SubmitVerificationInput,
  ReviewVerificationInput,
  VerificationDocumentOutput,
  ListVerificationsQuery,
} from './verification.types';

function toOutput(doc: {
  id: string;
  userId: string;
  user: { firstName: string; lastName: string; email: string };
  documentType: string;
  documentUrl: string;
  status: VerificationStatus;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}): VerificationDocumentOutput {
  return {
    id: doc.id,
    userId: doc.userId,
    userName: `${doc.user.firstName} ${doc.user.lastName}`,
    userEmail: doc.user.email,
    documentType: doc.documentType,
    documentUrl: doc.documentUrl,
    status: doc.status,
    reviewedBy: doc.reviewedBy,
    reviewedAt: doc.reviewedAt,
    createdAt: doc.createdAt,
  };
}

export async function submitVerification(
  userId: string,
  input: SubmitVerificationInput
): Promise<VerificationDocumentOutput> {
  const pendingExisting = await prisma.verificationDocument.findFirst({
    where: { userId, status: VerificationStatus.PENDING },
  });

  if (pendingExisting) {
    throw AppError.conflict(
      'You already have a verification document pending review. Please wait for it to be processed.'
    );
  }

  const doc = await prisma.verificationDocument.create({
    data: {
      userId,
      documentType: input.documentType,
      documentUrl: input.documentUrl,
      status: VerificationStatus.PENDING,
    },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });

  // Reset the user's overall status to PENDING while this is reviewed,
  // in case a previous document was rejected and they're resubmitting.
  await prisma.user.update({
    where: { id: userId },
    data: { verificationStatus: VerificationStatus.PENDING },
  });

  logger.info(`Verification document submitted by user ${userId}: ${input.documentType}`);

  return toOutput(doc);
}

export async function listMyVerifications(userId: string): Promise<VerificationDocumentOutput[]> {
  const docs = await prisma.verificationDocument.findMany({
    where: { userId },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return docs.map(toOutput);
}

export async function listVerifications(query: ListVerificationsQuery) {
  const where: Prisma.VerificationDocumentWhereInput = {};
  if (query.status) where.status = query.status;

  const [docs, total] = await Promise.all([
    prisma.verificationDocument.findMany({
      where,
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.verificationDocument.count({ where }),
  ]);

  return { documents: docs.map(toOutput), total };
}

export async function reviewVerification(
  documentId: string,
  reviewerId: string,
  input: ReviewVerificationInput
): Promise<VerificationDocumentOutput> {
  const doc = await prisma.verificationDocument.findUnique({ where: { id: documentId } });
  if (!doc) {
    throw AppError.notFound('Verification document not found.');
  }
  if (doc.status !== VerificationStatus.PENDING) {
    throw AppError.badRequest('This document has already been reviewed.');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedDoc = await tx.verificationDocument.update({
      where: { id: documentId },
      data: {
        status: input.status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });

    await tx.user.update({
      where: { id: doc.userId },
      data: { verificationStatus: input.status },
    });

    return updatedDoc;
  });

  await createNotification({
    userId: doc.userId,
    type: 'SYSTEM',
    title: input.status === 'APPROVED' ? 'Verification approved' : 'Verification rejected',
    message:
      input.status === 'APPROVED'
        ? 'Your driver verification has been approved. You can now complete bookings.'
        : `Your driver verification was rejected.${input.reviewNotes ? ` Reason: ${input.reviewNotes}` : ' Please resubmit a clear document.'}`,
  });

  logger.info(`Verification ${documentId} reviewed: ${input.status} by ${reviewerId}`);

  return toOutput(updated);
}

/**
 * Checks whether a user is allowed to book a vehicle - i.e. their
 * verification status is APPROVED. Called from bookings.service.ts
 * before a booking is created.
 */
export async function assertUserIsVerified(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw AppError.notFound('User not found.');
  }

  if (user.verificationStatus !== VerificationStatus.APPROVED) {
    throw AppError.forbidden(
      'Your driver verification must be approved before you can book a vehicle. Please submit a verification document from your dashboard.'
    );
  }
}
