import Anthropic from '@anthropic-ai/sdk';
import { AIRole } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { logger } from '../../utils/logger';
import { claude, CLAUDE_MODEL, MAX_RESPONSE_TOKENS } from './claude.client';
import { aiToolDefinitions, executeAiTool } from './ai.tools';
import { SendMessageResult, ConversationHistoryOutput, AIMessageOutput } from './ai.types';

const SYSTEM_PROMPT = `You are HEROY's AI rental assistant. You help customers find vehicles, get price quotes, check their bookings, and answer questions about the rental process.

Guidelines:
- Be warm, concise, and helpful - like a knowledgeable front-desk agent, not a generic chatbot.
- Always use the provided tools to look up real vehicles, prices, and booking statuses. Never invent vehicle names, prices, or availability.
- If a customer asks something outside of HEROY's car rental service, politely redirect them back to how you can help with their rental.
- When you find vehicles for a customer, mention 2-3 of the best matches with their price per day, not an exhaustive list.
- If a customer wants to actually complete a booking, tell them to use the "Book Now" button on the vehicle's page - you can help them find and price a vehicle, but the booking itself is completed through the website.
- Keep replies short - a few sentences, not paragraphs, unless the customer asks for detail.`;

async function getOrCreateConversation(sessionId: string, userId?: string) {
  const existing = await prisma.aIConversation.findUnique({ where: { sessionId } });
  if (existing) return existing;

  return prisma.aIConversation.create({
    data: { sessionId, userId },
  });
}

function toMessageOutput(msg: {
  id: string;
  role: AIRole;
  content: string;
  createdAt: Date;
}): AIMessageOutput {
  return { id: msg.id, role: msg.role, content: msg.content, createdAt: msg.createdAt };
}

export async function sendMessage(
  sessionId: string,
  userMessage: string,
  userId?: string
): Promise<SendMessageResult> {
  const conversation = await getOrCreateConversation(sessionId, userId);

  await prisma.aIMessage.create({
    data: { conversationId: conversation.id, role: AIRole.USER, content: userMessage },
  });

  const history = await prisma.aIMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' },
    take: 20, // keep recent context only, to bound token usage
  });

  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role === AIRole.ASSISTANT ? 'assistant' : 'user',
    content: m.content,
  }));

  let finalText = '';
  let loopCount = 0;
  const MAX_TOOL_LOOPS = 4;

  while (loopCount < MAX_TOOL_LOOPS) {
    loopCount++;

    const response = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_RESPONSE_TOKENS,
      system: SYSTEM_PROMPT,
      tools: aiToolDefinitions,
      messages,
    });

    const toolUseBlocks = response.content.filter((block) => block.type === 'tool_use');
    const textBlocks = response.content.filter((block) => block.type === 'text');

    if (toolUseBlocks.length === 0) {
      finalText = textBlocks.map((b) => (b as { text: string }).text).join('\n');
      break;
    }

    // Claude wants to call one or more tools - execute them and feed
    // the results back so it can produce a grounded final answer.
    messages.push({ role: 'assistant', content: response.content });

    const toolResults = await Promise.all(
      toolUseBlocks.map(async (block) => {
        const toolBlock = block as unknown as {
          id: string;
          name: string;
          input: Record<string, unknown>;
        };
        const result = await executeAiTool(toolBlock.name, toolBlock.input, { userId });
        return {
          type: 'tool_result' as const,
          tool_use_id: toolBlock.id,
          content: result,
        };
      })
    );

    messages.push({ role: 'user', content: toolResults });
  }

  if (!finalText) {
    finalText =
      "I'm having trouble finding an answer right now - could you rephrase your question?";
  }

  await prisma.aIMessage.create({
    data: { conversationId: conversation.id, role: AIRole.ASSISTANT, content: finalText },
  });

  const allMessages = await prisma.aIMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' },
  });

  logger.info(`AI response generated for session ${sessionId} after ${loopCount} tool loop(s)`);

  return {
    sessionId,
    reply: finalText,
    messages: allMessages.map(toMessageOutput),
  };
}

export async function getConversationHistory(
  sessionId: string
): Promise<ConversationHistoryOutput> {
  const conversation = await prisma.aIConversation.findUnique({ where: { sessionId } });

  if (!conversation) {
    return { sessionId, messages: [] };
  }

  const messages = await prisma.aIMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' },
  });

  return { sessionId, messages: messages.map(toMessageOutput) };
}
