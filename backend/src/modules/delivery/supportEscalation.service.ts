import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import { emitToUser } from '../../realtime/socket';

export type EscalationStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type EscalationReason =
  'COMPLAINT' | 'BILLING_DISPUTE' | 'TECHNICAL_ISSUE' | 'UNRESOLVED_BY_AI' | 'OTHER';

export interface SupportEscalation {
  id: string;
  userId: string | null;
  sessionId: string;
  reason: EscalationReason;
  summary: string;
  conversationHistory: { role: string; content: string }[];
  status: EscalationStatus;
  assignedTo: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
}

const escalations = new Map<string, SupportEscalation>();

function generateEscalationId(): string {
  return `ESC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/**
 * Escalates an AI conversation to human staff, pulling the full
 * real conversation history from the database (Phase 11's
 * AIConversation/AIMessage tables) so staff have complete context
 * and the customer never has to repeat themselves.
 */
export async function escalateToHuman(
  sessionId: string,
  reason: EscalationReason,
  summary: string,
  userId?: string
): Promise<SupportEscalation> {
  const conversation = await prisma.aIConversation.findUnique({
    where: { sessionId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });

  const escalation: SupportEscalation = {
    id: generateEscalationId(),
    userId: userId ?? null,
    sessionId,
    reason,
    summary,
    conversationHistory: conversation
      ? conversation.messages.map((m) => ({ role: m.role, content: m.content }))
      : [],
    status: 'OPEN',
    assignedTo: null,
    createdAt: new Date(),
    resolvedAt: null,
  };

  escalations.set(escalation.id, escalation);

  emitToUser('staff-dispatch', 'support:new_escalation', {
    escalationId: escalation.id,
    reason,
    summary,
    messageCount: escalation.conversationHistory.length,
  });

  logger.info(`Support escalation created: ${escalation.id}, reason: ${reason}`);

  return escalation;
}

export function assignEscalation(escalationId: string, staffMemberId: string): SupportEscalation {
  const escalation = escalations.get(escalationId);
  if (!escalation) {
    throw AppError.notFound('Escalation not found.');
  }

  escalation.status = 'IN_PROGRESS';
  escalation.assignedTo = staffMemberId;
  escalations.set(escalationId, escalation);

  logger.info(`Escalation ${escalationId} assigned to staff member ${staffMemberId}`);

  return escalation;
}

export function resolveEscalation(escalationId: string): SupportEscalation {
  const escalation = escalations.get(escalationId);
  if (!escalation) {
    throw AppError.notFound('Escalation not found.');
  }

  escalation.status = 'RESOLVED';
  escalation.resolvedAt = new Date();
  escalations.set(escalationId, escalation);

  logger.info(`Escalation ${escalationId} resolved`);

  return escalation;
}

export function listOpenEscalations(): SupportEscalation[] {
  return Array.from(escalations.values()).filter(
    (e) => e.status === 'OPEN' || e.status === 'IN_PROGRESS'
  );
}

export function getEscalation(escalationId: string): SupportEscalation {
  const escalation = escalations.get(escalationId);
  if (!escalation) {
    throw AppError.notFound('Escalation not found.');
  }
  return escalation;
}
