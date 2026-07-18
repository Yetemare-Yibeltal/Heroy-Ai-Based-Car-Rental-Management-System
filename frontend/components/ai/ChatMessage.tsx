'use client';

import { motion } from 'framer-motion';
import { Bot, User, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatMessageData {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: string;
}

interface ChatMessageProps {
  message: ChatMessageData;
  onSpeak?: (text: string) => void;
}

export function ChatMessage({ message, onSpeak }: ChatMessageProps) {
  const isUser = message.role === 'USER';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn('flex gap-2.5', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-secondary' : 'bg-primary/20'
        )}
      >
        {isUser ? <User size={15} /> : <Bot size={15} className="text-primary" />}
      </div>

      <div
        className={cn(
          'group relative max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'rounded-tr-sm bg-primary text-primary-foreground'
            : 'glass-panel rounded-tl-sm text-foreground'
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {!isUser && onSpeak && (
          <button
            onClick={() => onSpeak(message.content)}
            aria-label="Read this message aloud"
            className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
          >
            <Volume2 size={12} /> Listen
          </button>
        )}
      </div>
    </motion.div>
  );
}