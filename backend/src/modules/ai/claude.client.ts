import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

if (!env.anthropic.apiKey) {
  logger.warn(
    'ANTHROPIC_API_KEY is not set. The AI assistant will fail until it is configured in .env.'
  );
}

export const claude = new Anthropic({
  apiKey: env.anthropic.apiKey ?? 'placeholder',
});

export const CLAUDE_MODEL = env.anthropic.model;

/** Maximum tokens Claude is allowed to generate in a single reply. */
export const MAX_RESPONSE_TOKENS = 1024;
