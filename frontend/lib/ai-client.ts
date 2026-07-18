import { apiClient } from './api-client';

export interface AIMessage {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: string;
}

interface SendMessageResult {
  sessionId: string;
  reply: string;
  messages: AIMessage[];
}

interface ConversationHistoryResult {
  sessionId: string;
  messages: AIMessage[];
}

const SESSION_STORAGE_KEY = 'heroy_ai_session_id';

/**
 * Gets the current tab's AI session ID, generating and storing a
 * new one if none exists yet. Using sessionStorage (not
 * localStorage) means each browser tab gets its own independent
 * conversation, which matches how a support chat widget typically
 * behaves.
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
  return sessionId;
}

export async function sendChatMessage(message: string): Promise<SendMessageResult> {
  const sessionId = getOrCreateSessionId();
  return apiClient.post<SendMessageResult>('/ai/chat', { sessionId, message }, { skipAuth: false });
}

export async function fetchChatHistory(): Promise<ConversationHistoryResult> {
  const sessionId = getOrCreateSessionId();
  if (!sessionId) return { sessionId: '', messages: [] };

  try {
    return await apiClient.get<ConversationHistoryResult>(`/ai/chat/${sessionId}`);
  } catch {
    return { sessionId, messages: [] };
  }
}

export function resetChatSession(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
}
