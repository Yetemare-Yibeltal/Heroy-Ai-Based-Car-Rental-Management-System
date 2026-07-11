export interface SendMessageInput {
  sessionId: string;
  message: string;
}

export interface AIMessageOutput {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: Date;
}

export interface SendMessageResult {
  sessionId: string;
  reply: string;
  messages: AIMessageOutput[];
}

export interface ConversationHistoryOutput {
  sessionId: string;
  messages: AIMessageOutput[];
}

/**
 * Shape of a single tool the AI assistant can call to look up
 * real data (available vehicles, a booking's status, pricing, etc.)
 * instead of guessing or hallucinating an answer.
 */
export interface AIToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface AIToolResult {
  tool_use_id: string;
  content: string;
}
