import { emitToUser } from './socket';
import { AIMessageOutput } from '../modules/ai/ai.types';

interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: Date;
}

export function emitNewNotification(userId: string, notification: NotificationPayload): void {
  emitToUser(userId, 'notification:new', notification);
}

interface BookingStatusChangedPayload {
  bookingId: string;
  status: string;
  vehicleName: string;
}

export function emitBookingStatusChanged(
  userId: string,
  payload: BookingStatusChangedPayload
): void {
  emitToUser(userId, 'booking:status_changed', payload);
}

export function emitAiMessageChunk(userId: string, sessionId: string, chunk: string): void {
  emitToUser(userId, 'ai:message_chunk', { sessionId, chunk });
}

export function emitAiMessageComplete(
  userId: string,
  sessionId: string,
  message: AIMessageOutput
): void {
  emitToUser(userId, 'ai:message_complete', { sessionId, message });
}
