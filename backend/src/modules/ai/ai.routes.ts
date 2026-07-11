import { Router } from 'express';
import * as aiController from './ai.controller';
import { optionalAuthenticate } from '../../middleware/auth';
import { aiLimiter } from '../../middleware/rateLimiter';
import { catchAsync } from '../../utils/catchAsync';

export const aiRoutes = Router();

aiRoutes.post('/chat', aiLimiter, optionalAuthenticate, catchAsync(aiController.sendMessage));

aiRoutes.get('/chat/:sessionId', optionalAuthenticate, catchAsync(aiController.getHistory));
