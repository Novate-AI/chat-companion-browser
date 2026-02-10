import { useState, useCallback, useRef } from "react";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;

export function useSpeechSynthesis(lang: string) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const isSupported = true; // ElevenLabs works everywhere

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      stop();

      // Strip translations in parentheses so only the target language is spoken
      const cleaned = text
        .replace(/\s*\([^)]*\)/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();

      if (!cleaned) return;

      setIsSpeaking(true);

      try {
        const response = await fetch(TTS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: cleaned }),
        });

        if (!response.ok) {
          console.error("ElevenLabs TTS failed, falling back to browser voice");
          fallbackBrowserSpeak(cleaned, lang);
          return;
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        objectUrlRef.current = audioUrl;

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          objectUrlRef.current = null;
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          objectUrlRef.current = null;
        };

        await audio.play();
      } catch (err) {
        console.error("ElevenLabs TTS error, falling back to browser voice:", err);
        fallbackBrowserSpeak(cleaned, lang);
      }
    },
    [lang, stop]
  );

  return { isSpeaking, speak, stop, isSupported };
}

/** Fallback to browser Web Speech API if ElevenLabs fails */
function fallbackBrowserSpeak(text: string, lang: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.85;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}
