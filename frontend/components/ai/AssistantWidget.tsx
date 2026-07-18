'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { ChatMessage, ChatMessageData } from './ChatMessage';
import { sendChatMessage, fetchChatHistory } from '@/lib/ai-client';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';

export function AssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    isSupported: micSupported,
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
  } = useSpeechRecognition();

  const { isSupported: speechSupported, isSpeaking, speak, stop: stopSpeaking } = useSpeechSynthesis();

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (!isOpen || messages.length > 0) return;

    fetchChatHistory().then((history) => {
      if (history.messages.length > 0) {
        setMessages(history.messages);
      } else {
        setMessages([
          {
            id: 'welcome',
            role: 'ASSISTANT',
            content:
              "Hi! I'm HEROY's assistant. I can help you find a vehicle, get a quote, check a booking, or even book one right here. What can I help with?",
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    });
  }, [isOpen, messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isSending) return;

    const userMessage: ChatMessageData = {
      id: `local-${Date.now()}`,
      role: 'USER',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const result = await sendChatMessage(text);
      setMessages(result.messages);

      if (autoSpeak && speechSupported) {
        speak(result.reply);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'ASSISTANT',
          content: "Sorry, I couldn't process that. Please try again in a moment.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function toggleMic() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="mb-4 w-[360px] max-w-[calc(100vw-3rem)]"
            >
              <GlassPanel intensity="strong" className="flex h-[520px] flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                      <MessageCircle size={15} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-display text-sm font-semibold">HEROY Assistant</p>
                      <p className="text-xs text-muted-foreground">Ask about fleet, bookings, and more</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {speechSupported && (
                      <button
                        onClick={() => setAutoSpeak((v) => !v)}
                        title={autoSpeak ? 'Voice replies on' : 'Voice replies off'}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent"
                      >
                        {autoSpeak ? <Volume2 size={16} /> : <VolumeX size={16} />}
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      aria-label="Close assistant"
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} onSpeak={speechSupported ? speak : undefined} />
                  ))}
                  {isSending && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex gap-1">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
                      </span>
                      Thinking...
                    </div>
                  )}
                </div>

                <div className="border-t border-border p-3">
                  {isListening && (
                    <p className="mb-2 truncate text-xs italic text-muted-foreground">
                      {interimTranscript || 'Listening...'}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    {micSupported && (
                      <button
                        onClick={toggleMic}
                        aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors',
                          isListening ? 'bg-destructive text-destructive-foreground' : 'bg-secondary hover:bg-accent'
                        )}
                      >
                        {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                      </button>
                    )}
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask about a vehicle, a quote, a booking..."
                      className="flex-1 rounded-full border border-input bg-secondary/50 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                    <Button
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-full"
                      onClick={handleSend}
                      disabled={!input.trim() || isSending}
                    >
                      <Send size={15} />
                    </Button>
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (isSpeaking) stopSpeaking();
            setIsOpen((v) => !v);
          }}
          aria-label={isOpen ? 'Close assistant' : 'Open assistant'}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-brand bg-[length:200%_200%] text-primary-foreground shadow-lg animate-gradient-shift"
        >
          {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
        </motion.button>
      </div>
    </>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}