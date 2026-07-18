'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface SpeechSynthesisResult {
  isSupported: boolean;
  isSpeaking: boolean;
  speak: (text: string) => void;
  stop: () => void;
}

/**
 * Wraps the browser's native SpeechSynthesis API to speak AI
 * assistant replies aloud. Prefers a natural-sounding English voice
 * if the browser exposes one, falling back to the system default.
 */
export function useSpeechSynthesis(): SpeechSynthesisResult {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const preferredVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);

    function pickVoice() {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;

      const preferred =
        voices.find((v) => /Google US English|Samantha|Microsoft Aria/i.test(v.name)) ??
        voices.find((v) => v.lang.startsWith('en')) ??
        voices[0];

      preferredVoiceRef.current = preferred ?? null;
    }

    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (preferredVoiceRef.current) {
      utterance.voice = preferredVoiceRef.current;
    }
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { isSupported, isSpeaking, speak, stop };
}
