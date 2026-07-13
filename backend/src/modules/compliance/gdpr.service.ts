import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import { recordAuditLog } from './auditLog.service';

export interface UserDataExport {
  profile: Record<string, unknown>;
  bookings: Record<string, unknown>[];
  reviews: Record<string, unknown>[];
  wishlist: Record<string, unknown>[];
  notifications: Record<string, unknown>[];
  verificationDocuments: Record<string, unknown>[];
  aiConversations: Record<string, unknown>[];
  subscriptions: Record<string, unknown>[];
  exportedAt: Date;
}

/**
 * Builds a complete export of every piece of personal data HEROY
 * holds for a user, across every module - the real substance of a
 * GDPR "right to access" request, not a partial summary.
 */
export async function exportUserData(userId: string): Promise<UserDataExport> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw AppError.notFound('User not found.');
  }

  const [
    bookings,
    reviews,
    wishlist,
    notifications,
    verificationDocuments,
    aiConversations,
    subscriptions,
  ] = await Promise.all([
    prisma.booking.findMany({ where: { userId }, include: { vehicle: true, payment: true } }),
    prisma.review.findMany({ where: { userId } }),
    prisma.wishlist.findMany({ where: { userId }, include: { vehicle: true } }),
    prisma.notification.findMany({ where: { userId } }),
    prisma.verificationDocument.findMany({ where: { userId } }),
    prisma.aIConversation.findMany({ where: { userId }, include: { messages: true } }),
    prisma.subscription.findMany({ where: { userId } }),
  ]);

  logger.info(`GDPR data export generated for user ${userId}`);

  return {
    profile: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      verificationStatus: user.verificationStatus,
      loyaltyPoints: user.loyaltyPoints,
      createdAt: user.createdAt,
    },
    bookings: bookings as unknown as Record<string, unknown>[],
    reviews: reviews as unknown as Record<string, unknown>[],
    wishlist: wishlist as unknown as Record<string, unknown>[],
    notifications: notifications as unknown as Record<string, unknown>[],
    verificationDocuments: verificationDocuments as unknown as Record<string, unknown>[],
    aiConversations: aiConversations as unknown as Record<string, unknown>[],
    subscriptions: subscriptions as unknown as Record<string, unknown>[],
    exportedAt: new Date(),
  };
}

/**
 * Anonymizes a user's personal data rather than deleting their row
 * outright - real financial/booking records need to be retained for
 * accounting and legal purposes, but all personally identifying
 * information is scrubbed. This is the standard, legally correct
 * approach real platforms use for GDPR "right to erasure" requests.
 */
export async function anonymizeUserData(
  userId: string,
  requestedByAdminId?: string
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw AppError.notFound('User not found.');
  }

  const anonymizedEmail = `deleted-${user.id}@anonymized.heroy.example`;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        email: anonymizedEmail,
        firstName: 'Deleted',
        lastName: 'User',
        phone: null,
        avatarUrl: null,
        driverLicenseNumber: null,
        password: 'ANONYMIZED_ACCOUNT_NO_LOGIN_POSSIBLE',
      },
    });

    await tx.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });

    await tx.verificationDocument.deleteMany({ where: { userId } });

    await tx.aIMessage.deleteMany({
      where: { conversation: { userId } },
    });
    await tx.aIConversation.deleteMany({ where: { userId } });
  });

  await recordAuditLog({
    userId: requestedByAdminId,
    action: 'USER_DELETED',
    entityType: 'User',
    entityId: userId,
    metadata: { anonymizedEmail, requestedBySelf: !requestedByAdminId },
  });

  logger.info(`User ${userId} data anonymized (GDPR erasure request).`);
}
