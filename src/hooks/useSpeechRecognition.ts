import { useState, useCallback, useRef } from "react";

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface UseSpeechRecognitionOptions {
  lang: string;
  onResult: (transcript: string) => void;
  /** If true, mic stays open and accumulates speech until manually stopped */
  continuous?: boolean;
}

export function useSpeechRecognition({ lang, onResult, continuous = false }: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const accumulatedRef = useRef("");
  const isListeningRef = useRef(false);

  const isSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const start = useCallback(() => {
    if (!isSupported) return;
    if (isListeningRef.current) return; // already listening
    accumulatedRef.current = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.continuous = continuous;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (continuous) {
        // Accumulate all final results
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript + " ";
          }
        }
        accumulatedRef.current = transcript.trim();
      } else {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      }
    };

    recognition.onend = () => {
      if (continuous && isListeningRef.current) {
        // Auto-restart to keep mic open for the full window
        try {
          recognition.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };
    recognition.onerror = (e: { error: string }) => {
      if (e.error === "no-speech" && continuous && isListeningRef.current) {
        // Restart on no-speech in continuous mode
        try {
          recognition.start();
        } catch {
          setIsListening(false);
        }
      } else if (e.error !== "aborted") {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    isListeningRef.current = true;
    recognition.start();
    setIsListening(true);
  }, [lang, onResult, isSupported, continuous]);

  const stop = useCallback(() => {
    isListeningRef.current = false; // prevent auto-restart BEFORE stopping
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    rec?.stop();
    setIsListening(false);

    // In continuous mode, return accumulated text
    if (continuous && accumulatedRef.current) {
      const text = accumulatedRef.current;
      accumulatedRef.current = "";
      onResult(text);
    }
  }, [continuous, onResult]);

  return { isListening, start, stop, isSupported };
}
