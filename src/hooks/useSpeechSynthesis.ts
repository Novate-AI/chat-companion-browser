import { useState, useCallback, useRef, useEffect } from "react";

// Known male voice name patterns across browsers
const MALE_VOICE_PATTERNS = [
  "male", "david", "james", "mark", "daniel", "george", "thomas", "guy",
  "richard", "alex", "fred", "tom", "bruce", "charles", "reed", "rishi",
  "aaron", "gordon", "liam", "oliver",
];

const FEMALE_VOICE_PATTERNS = [
  "female", "zira", "hazel", "susan", "samantha", "karen", "moira",
  "tessa", "fiona", "victoria", "alice", "sara", "laura", "kate",
  "catherine", "ellen", "martha",
];

function looksLikeMaleVoice(name: string): boolean {
  const lower = name.toLowerCase();
  return MALE_VOICE_PATTERNS.some((p) => lower.includes(p));
}

function looksLikeFemaleVoice(name: string): boolean {
  const lower = name.toLowerCase();
  return FEMALE_VOICE_PATTERNS.some((p) => lower.includes(p));
}

function scoreVoice(voice: SpeechSynthesisVoice, targetLang: string): number {
  let score = 0;
  const baseLang = targetLang.split("-")[0].toLowerCase();
  const voiceLang = voice.lang.toLowerCase();

  if (voiceLang === targetLang.toLowerCase()) score += 10;
  else if (voiceLang.startsWith(baseLang)) score += 5;

  const name = voice.name.toLowerCase();
  if (name.includes("google")) score += 3;
  if (name.includes("microsoft")) score += 3;
  if (name.includes("natural")) score += 2;
  if (!voice.localService) score += 1;

  // Strongly prefer male voices for Tom Holland persona
  if (looksLikeMaleVoice(name)) score += 15;
  if (looksLikeFemaleVoice(name)) score -= 10;

  return score;
}

function pickBestVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const baseLang = lang.split("-")[0].toLowerCase();
  const matching = voices.filter((v) =>
    v.lang.toLowerCase().startsWith(baseLang)
  );
  if (!matching.length) return null;

  matching.sort((a, b) => scoreVoice(b, lang) - scoreVoice(a, lang));
  return matching[0];
}

export function useSpeechSynthesis(lang: string) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const isSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  // Pick best voice on mount and when voices become available (Chrome quirk)
  useEffect(() => {
    if (!isSupported) return;

    const selectVoice = () => {
      selectedVoiceRef.current = pickBestVoice(lang);
    };

    selectVoice();

    window.speechSynthesis.addEventListener("voiceschanged", selectVoice);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", selectVoice);
    };
  }, [lang, isSupported]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported) return;
      window.speechSynthesis.cancel();
      // Strip English translations in parentheses so only the target language is spoken
      const cleaned = text
        .replace(/\s*\([^)]*\)/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = lang;
      utterance.rate = 0.85;
      utterance.pitch = 1.0;

      if (selectedVoiceRef.current) {
        utterance.voice = selectedVoiceRef.current;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [lang, isSupported]
  );

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, speak, stop, isSupported };
}
