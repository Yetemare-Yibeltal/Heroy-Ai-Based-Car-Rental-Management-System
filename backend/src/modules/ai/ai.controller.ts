import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../utils/AppError';
import * as aiService from './ai.service';
import { SendMessageInput } from './ai.types';

export async function sendMessage(req: Request, res: Response): Promise<void> {
  const { sessionId, message } = req.body as SendMessageInput;

  if (!message || message.trim().length === 0) {
    throw AppError.badRequest('Message cannot be empty.');
  }

  const result = await aiService.sendMessage(sessionId, message, req.user?.userId);
  sendSuccess(res, 200, 'Message sent.', result);
}

export async function getHistory(req: Request, res: Response): Promise<void> {
  const sessionId = String(req.params.sessionId);
  const history = await aiService.getConversationHistory(sessionId);
  sendSuccess(res, 200, 'Conversation history fetched.', history);
}
