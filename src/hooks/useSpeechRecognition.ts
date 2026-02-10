import { useState, useCallback, useRef } from "react";

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface UseSpeechRecognitionOptions {
  lang: string;
  onResult: (transcript: string) => void;
}

export function useSpeechRecognition({ lang, onResult }: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const accumulatedRef = useRef("");
  const stoppedRef = useRef(false);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const isSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const start = useCallback(() => {
    if (!isSupported) return;
    // Reset state
    accumulatedRef.current = "";
    stoppedRef.current = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.continuous = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Append new results to accumulated transcript
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          accumulatedRef.current += event.results[i][0].transcript + " ";
        }
      }
    };

    recognition.onend = () => {
      // Browser may stop continuous recognition after silence — auto-restart unless explicitly stopped
      if (!stoppedRef.current) {
        try {
          recognition.start();
        } catch {
          // Already started or other error — ignore
        }
      }
    };

    recognition.onerror = (e: { error: string }) => {
      // "no-speech" and "aborted" are expected — just let onend restart
      if (e.error === "no-speech" || e.error === "aborted") return;
      // For other errors, stop
      stoppedRef.current = true;
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [lang, isSupported]);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    setIsListening(false);

    // Flush accumulated transcript
    const text = accumulatedRef.current.trim();
    if (text) {
      onResultRef.current(text);
    }
    accumulatedRef.current = "";
  }, []);

  return { isListening, start, stop, isSupported };
}
