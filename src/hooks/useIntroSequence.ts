import { useState, useCallback, useRef } from "react";

export type IntroPhase = "greeting" | "ask_name" | "idle" | "not_understood" | "understood" | "normal";

type Msg = { role: "user" | "assistant"; content: string };

const SEGMENTS: Record<string, { start: number; end: number; loop: boolean }> = {
  greeting: { start: 10, end: 15, loop: false },
  ask_name: { start: 15, end: 20, loop: false },
  idle: { start: 0, end: 10, loop: true },
  not_understood: { start: 30, end: 36, loop: false },
  understood: { start: 23, end: 29, loop: false },
  normal: { start: 0, end: 10, loop: true },
};

const SCRIPTED_MESSAGES: Partial<Record<IntroPhase, string>> = {
  greeting: "Hi, I am Novate Abby. Nice to meet you. I will be your tutor for today.",
  ask_name: "Can you tell me your name and native language please?",
  not_understood: "Pardon me, can you repeat that again?",
  understood: "Thank you for that. So, what do you want to practice today?",
};

export function useIntroSequence() {
  const [phase, setPhase] = useState<IntroPhase>("greeting");
  const [scriptedMessages, setScriptedMessages] = useState<Msg[]>([]);
  const phaseRef = useRef<IntroPhase>("greeting");

  const updatePhase = useCallback((p: IntroPhase) => {
    phaseRef.current = p;
    setPhase(p);
    const text = SCRIPTED_MESSAGES[p];
    // "understood" message is added to aiMessages in Chat.tsx so it appears after user reply
    if (text && p !== "understood") {
      setScriptedMessages(prev => [...prev, { role: "assistant", content: text }]);
    }
  }, []);

  const handleSegmentEnd = useCallback(() => {
    const current = phaseRef.current;
    if (current === "greeting") {
      updatePhase("ask_name");
    } else if (current === "ask_name") {
      updatePhase("idle");
    } else if (current === "not_understood") {
      updatePhase("idle");
    } else if (current === "understood") {
      updatePhase("normal");
    }
  }, [updatePhase]);

  // Called when AI responds to user during intro
  const handleIntroResponse = useCallback((success: boolean) => {
    if (success) {
      updatePhase("understood");
    } else {
      updatePhase("not_understood");
    }
  }, [updatePhase]);

  const segment = SEGMENTS[phase] || SEGMENTS.idle;
  const isIntroActive = phase !== "normal";

  return {
    phase,
    isIntroActive,
    segment,
    scriptedMessages,
    handleSegmentEnd,
    handleIntroResponse,
  };
}
