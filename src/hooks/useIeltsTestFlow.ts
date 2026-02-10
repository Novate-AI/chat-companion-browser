import { useState, useRef, useCallback, useEffect } from "react";

export type IeltsPhase =
  | "INTRO"
  | "ASK_NAME"
  | "ASK_NICKNAME_ORIGIN"
  | "ASK_ID"
  | "ID_PAUSE"
  | "PART1_INTRO"
  | "PART1_QUESTION"
  | "PART2_INTRO"
  | "PART2_PREP"
  | "PART2_SPEAK"
  | "PART3_INTRO"
  | "PART3_QUESTION"
  | "CONCLUSION";

const PART1_THEMES = [
  "Home & Accommodation",
  "Work & Studies",
  "Hobbies & Free Time",
  "Daily Routine",
  "Food & Cooking",
  "Weather & Seasons",
  "Transport & Travel",
  "Technology & Internet",
];

export interface IeltsTestState {
  phase: IeltsPhase;
  questionIndex: number;
  timerSeconds: number;
  timerMax: number;
  isTimerRunning: boolean;
  isPrepTime: boolean;
  selectedTheme: string;
  selectedPart2Index: number;
  isTestComplete: boolean;
  phaseLabel: string;
}

export function useIeltsTestFlow() {
  const [phase, setPhase] = useState<IeltsPhase>("INTRO");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerMax, setTimerMax] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isPrepTime, setIsPrepTime] = useState(false);
  const [isTestComplete, setIsTestComplete] = useState(false);

  // Pick random theme and part2 topic at mount
  const [selectedTheme] = useState(() => PART1_THEMES[Math.floor(Math.random() * PART1_THEMES.length)]);
  const [selectedPart2Index] = useState(() => Math.floor(Math.random() * 6));

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimerExpireRef = useRef<(() => void) | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setTimerMax(0);
    setIsPrepTime(false);
  }, []);

  const startTimer = useCallback((duration: number, prep: boolean, onExpire: () => void) => {
    stopTimer();
    setTimerSeconds(duration);
    setTimerMax(duration);
    setIsTimerRunning(true);
    setIsPrepTime(prep);
    onTimerExpireRef.current = onExpire;

    timerRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setIsTimerRunning(false);
          setIsPrepTime(false);
          // Call onExpire async to avoid state update during render
          setTimeout(() => onTimerExpireRef.current?.(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  const advancePhase = useCallback((): IeltsPhase => {
    let next: IeltsPhase;
    switch (phase) {
      case "INTRO":
        next = "ASK_NAME";
        break;
      case "ASK_NAME":
        next = "ASK_NICKNAME_ORIGIN";
        break;
      case "ASK_NICKNAME_ORIGIN":
        next = "ASK_ID";
        break;
      case "ASK_ID":
        next = "ID_PAUSE";
        break;
      case "ID_PAUSE":
        next = "PART1_INTRO";
        break;
      case "PART1_INTRO":
        next = "PART1_QUESTION";
        setQuestionIndex(0);
        break;
      case "PART1_QUESTION":
        if (questionIndex < 11) {
          setQuestionIndex((i) => i + 1);
          next = "PART1_QUESTION";
        } else {
          next = "PART2_INTRO";
          setQuestionIndex(0);
        }
        break;
      case "PART2_INTRO":
        next = "PART2_PREP";
        break;
      case "PART2_PREP":
        next = "PART2_SPEAK";
        break;
      case "PART2_SPEAK":
        next = "PART3_INTRO";
        setQuestionIndex(0);
        break;
      case "PART3_INTRO":
        next = "PART3_QUESTION";
        setQuestionIndex(0);
        break;
      case "PART3_QUESTION":
        if (questionIndex < 5) {
          setQuestionIndex((i) => i + 1);
          next = "PART3_QUESTION";
        } else {
          next = "CONCLUSION";
        }
        break;
      case "CONCLUSION":
        setIsTestComplete(true);
        next = "CONCLUSION";
        break;
      default:
        next = "CONCLUSION";
    }
    setPhase(next);
    return next;
  }, [phase, questionIndex]);

  const getPhaseLabel = (): string => {
    switch (phase) {
      case "INTRO":
      case "ASK_NAME":
      case "ASK_NICKNAME_ORIGIN":
      case "ASK_ID":
      case "ID_PAUSE":
        return "Introduction";
      case "PART1_INTRO":
      case "PART1_QUESTION":
        return `Part 1 — Question ${questionIndex + 1}/12`;
      case "PART2_INTRO":
        return "Part 2 — Introduction";
      case "PART2_PREP":
        return "Part 2 — Preparation";
      case "PART2_SPEAK":
        return "Part 2 — Speaking";
      case "PART3_INTRO":
        return "Part 3 — Introduction";
      case "PART3_QUESTION":
        return `Part 3 — Question ${questionIndex + 1}/6`;
      case "CONCLUSION":
        return "Test Complete";
      default:
        return "";
    }
  };

  // Whether the user should speak (mic auto-activates)
  const isUserTurn = (): boolean => {
    return (
      phase === "INTRO" ||
      phase === "ASK_NAME" ||
      phase === "ASK_NICKNAME_ORIGIN" ||
      phase === "ASK_ID" ||
      phase === "PART1_QUESTION" ||
      phase === "PART2_SPEAK" ||
      phase === "PART3_QUESTION"
    );
  };

  // Get timer duration for current phase (0 = no timer for user)
  const getTimerDuration = (): number => {
    switch (phase) {
      case "PART1_QUESTION":
        return 17; // 15-20 seconds, pick middle
      case "PART2_PREP":
        return 60;
      case "PART2_SPEAK":
        return 120;
      case "PART3_QUESTION":
        return 22; // 20-25 seconds, pick middle
      case "ASK_ID":
        return 5; // Wait 5 seconds for ID phase
      default:
        return 0;
    }
  };

  return {
    phase,
    questionIndex,
    timerSeconds,
    timerMax,
    isTimerRunning,
    isPrepTime,
    selectedTheme,
    selectedPart2Index,
    isTestComplete,
    phaseLabel: getPhaseLabel(),
    isUserTurn: isUserTurn(),
    timerDuration: getTimerDuration(),
    advancePhase,
    startTimer,
    stopTimer,
    setPhase,
  };
}
