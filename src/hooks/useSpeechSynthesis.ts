import { useState, useCallback, useRef } from "react";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;

export function useSpeechSynthesis(lang: string) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const queueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);

  const isSupported = true;

  const cleanupAudio = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const playNext = useCallback(async () => {
    if (queueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);
    const text = queueRef.current.shift()!;

    // Strip translations in parentheses
    const cleaned = text
      .replace(/\s*\([^)]*\)/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (!cleaned) {
      playNext();
      return;
    }

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
        playNext();
        return;
      }

      const audioBlob = await response.blob();
      cleanupAudio();
      const audioUrl = URL.createObjectURL(audioBlob);
      objectUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        cleanupAudio();
        playNext();
      };
      audio.onerror = () => {
        cleanupAudio();
        playNext();
      };

      await audio.play();
    } catch (err) {
      console.error("ElevenLabs TTS error, falling back to browser voice:", err);
      fallbackBrowserSpeak(cleaned, lang);
      playNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, cleanupAudio]);

  const speakQueued = useCallback(
    (text: string) => {
      queueRef.current.push(text);
      if (!isPlayingRef.current) {
        playNext();
      }
    },
    [playNext]
  );

  const stop = useCallback(() => {
    queueRef.current = [];
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    cleanupAudio();
    isPlayingRef.current = false;
    setIsSpeaking(false);
  }, [cleanupAudio]);

  // Keep speak for manual single-shot playback (e.g. clicking speaker icon)
  const speak = useCallback(
    async (text: string) => {
      stop();
      speakQueued(text);
    },
    [stop, speakQueued]
  );

  return { isSpeaking, speak, speakQueued, stop, isSupported };
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
