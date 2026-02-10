import { useState, useCallback, useRef } from "react";

interface UseSpeechRecognitionOptions {
  lang: string;
  onResult: (transcript: string) => void;
}

export function useSpeechRecognition({ lang, onResult }: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const shouldBeListeningRef = useRef(false);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const isSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const start = useCallback(() => {
    if (!isSupported) return;
    shouldBeListeningRef.current = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.continuous = true;

    recognition.onresult = (event: { results: SpeechRecognitionResultList }) => {
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript.trim();
          if (text) {
            // Fire callback on every final result
            onResultRef.current(text);
          }
        }
      }
    };

    recognition.onend = () => {
      if (shouldBeListeningRef.current) {
        try {
          const fresh = new SpeechRecognitionCtor();
          fresh.lang = lang;
          fresh.interimResults = false;
          fresh.continuous = true;
          fresh.onresult = recognition.onresult;
          fresh.onend = recognition.onend;
          fresh.onerror = recognition.onerror;
          recognitionRef.current = fresh;
          fresh.start();
        } catch (e) {
          console.warn("Speech recognition auto-restart failed:", e);
          shouldBeListeningRef.current = false;
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = (event: { error: string }) => {
      if (event.error === "no-speech") return;
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        console.warn("Microphone permission denied");
        shouldBeListeningRef.current = false;
        setIsListening(false);
        return;
      }
      console.warn("Speech recognition error:", event.error);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch (e) {
      console.warn("Failed to start speech recognition:", e);
      shouldBeListeningRef.current = false;
    }
  }, [lang, isSupported]);

  const stop = useCallback(() => {
    shouldBeListeningRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    setIsListening(false);
  }, []);

  return { isListening, start, stop, isSupported };
}
