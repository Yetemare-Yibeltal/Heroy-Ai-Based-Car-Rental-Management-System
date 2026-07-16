import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import { createNotification } from '../notifications/notifications.service';
import { emitToUser } from '../../realtime/socket';

export type AssistanceType =
  'BREAKDOWN' | 'FLAT_TIRE' | 'LOCKOUT' | 'ACCIDENT' | 'OUT_OF_FUEL' | 'OTHER';
export type AssistanceStatus = 'REQUESTED' | 'DISPATCHED' | 'RESOLVED' | 'CANCELLED';

export interface RoadsideAssistanceRequest {
  id: string;
  bookingId: string;
  userId: string;
  type: AssistanceType;
  description: string;
  latitude: number | null;
  longitude: number | null;
  status: AssistanceStatus;
  createdAt: Date;
  resolvedAt: Date | null;
}

/**
 * In-memory store for assistance requests, keyed by a generated ID.
 * As with delivery tracking, this is fully functional for HEROY's
 * current operational scale without requiring a schema migration
 * for what is, at this stage, a lower-volume support feature.
 */
const assistanceRequests = new Map<string, RoadsideAssistanceRequest>();

function generateRequestId(): string {
  return `RA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function requestAssistance(
  userId: string,
  bookingId: string,
  type: AssistanceType,
  description: string,
  latitude?: number,
  longitude?: number
): Promise<RoadsideAssistanceRequest> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { vehicle: true },
  });
  if (!booking) {
    throw AppError.notFound('Booking not found.');
  }
  if (booking.userId !== userId) {
    throw AppError.forbidden('You can only request assistance for your own booking.');
  }
  if (booking.status !== 'ACTIVE') {
    throw AppError.badRequest('Roadside assistance can only be requested for an active rental.');
  }

  const request: RoadsideAssistanceRequest = {
    id: generateRequestId(),
    bookingId,
    userId,
    type,
    description,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    status: 'REQUESTED',
    createdAt: new Date(),
    resolvedAt: null,
  };

  assistanceRequests.set(request.id, request);

  // Real-time push to staff dashboards - urgent enough that staff
  // should see it immediately, not just as an in-app notification
  // they might check later.
  emitToUser('staff-dispatch', 'roadside:new_request', {
    requestId: request.id,
    vehicleName: booking.vehicle.name,
    vehiclePlate: booking.vehicle.plate,
    type,
    description,
  });

  logger.warn(`Roadside assistance requested: ${request.id}, booking ${bookingId}, type ${type}`);

  return request;
}

export function dispatchAssistance(requestId: string): RoadsideAssistanceRequest {
  const request = assistanceRequests.get(requestId);
  if (!request) {
    throw AppError.notFound('Assistance request not found.');
  }

  request.status = 'DISPATCHED';
  assistanceRequests.set(requestId, request);

  logger.info(`Roadside assistance dispatched: ${requestId}`);

  return request;
}

export async function resolveAssistance(requestId: string): Promise<RoadsideAssistanceRequest> {
  const request = assistanceRequests.get(requestId);
  if (!request) {
    throw AppError.notFound('Assistance request not found.');
  }

  request.status = 'RESOLVED';
  request.resolvedAt = new Date();
  assistanceRequests.set(requestId, request);

  await createNotification({
    userId: request.userId,
    type: 'BOOKING',
    title: 'Roadside assistance resolved',
    message: 'Your roadside assistance request has been resolved. Thank you for your patience.',
  });

  logger.info(`Roadside assistance resolved: ${requestId}`);

  return request;
}

export function getAssistanceRequest(requestId: string): RoadsideAssistanceRequest {
  const request = assistanceRequests.get(requestId);
  if (!request) {
    throw AppError.notFound('Assistance request not found.');
  }
  return request;
}

export function listActiveAssistanceRequests(): RoadsideAssistanceRequest[] {
  return Array.from(assistanceRequests.values()).filter(
    (r) => r.status === 'REQUESTED' || r.status === 'DISPATCHED'
  );
}
