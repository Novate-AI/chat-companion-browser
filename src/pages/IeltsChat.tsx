import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LingbotAvatar } from "@/components/LingbotAvatar";
import { ChatBubble } from "@/components/ChatBubble";
import { ChatInput } from "@/components/ChatInput";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { TranscriptDialog } from "@/components/TranscriptDialog";
import { IeltsFeedbackDialog } from "@/components/IeltsFeedbackDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, FileText, ClipboardCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSpeakableText } from "@/lib/chatHelpers";
import { useIeltsTestFlow, IeltsPhase } from "@/hooks/useIeltsTestFlow";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ielts-chat`;

const IeltsChat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const testFlow = useIeltsTestFlow();
  const {
    phase, questionIndex, timerSeconds, timerMax, isTimerRunning,
    isPrepTime, selectedTheme, selectedPart2Index, isTestComplete,
    phaseLabel, isUserTurn, timerDuration, advancePhase, startTimer, stopTimer,
  } = testFlow;

  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [autoIntroSent, setAutoIntroSent] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { isSpeaking, speak, speakQueued, stop: stopSpeaking } = useSpeechSynthesis("en-GB");
  const spokenUpToRef = useRef(0);

  // Track post-AI action type
  const pendingActionRef = useRef<"mic_only" | "mic_and_timer" | "auto_advance" | null>(null);
  const pendingTimerPhaseRef = useRef<IeltsPhase | null>(null);

  // Use ref to avoid stale closure in onVoiceResult
  const sendMessageRef = useRef<(input: string) => void>(() => {});

  // Use ref to always call the latest triggerAIMessage from sendMessage
  const triggerAIMessageRef = useRef<(targetPhase: IeltsPhase) => void>(() => {});

  const onVoiceResult = useCallback((transcript: string) => {
    sendMessageRef.current(transcript);
  }, []);

  const { isListening, start: startListening, stop: stopListening, isSupported: micSupported } =
    useSpeechRecognition({ lang: "en-GB", onResult: onVoiceResult });

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sentence chunking for TTS
  const checkAndQueueSentences = useCallback((fullText: string) => {
    const speakable = getSpeakableText(fullText);
    const remaining = speakable.slice(spokenUpToRef.current);
    const parts = remaining.split(/(?<=[.!?])\s+/);
    for (let i = 0; i < parts.length - 1; i++) {
      const sentence = parts[i].trim();
      if (sentence) {
        speakQueued(sentence);
        spokenUpToRef.current += parts[i].length + 1;
      }
    }
  }, [speakQueued]);

  const flushRemainingSpeech = useCallback((fullText: string) => {
    const speakable = getSpeakableText(fullText);
    const remaining = speakable.slice(spokenUpToRef.current).trim();
    if (remaining) {
      speakQueued(remaining);
      spokenUpToRef.current = speakable.length;
    }
  }, [speakQueued]);

  // Watch for AI to stop speaking, then execute pending action
  useEffect(() => {
    if (!isSpeaking && pendingActionRef.current && pendingTimerPhaseRef.current) {
      const action = pendingActionRef.current;
      const currentPhase = pendingTimerPhaseRef.current;
      pendingActionRef.current = null;
      pendingTimerPhaseRef.current = null;

      if (action === "mic_only") {
        // Just start mic, no timer (intro phases)
        startListening();
      } else if (action === "mic_and_timer") {
        let duration = 0;
        if (currentPhase === "PART1_QUESTION") duration = 17;
        else if (currentPhase === "PART2_SPEAK") duration = 120;
        else if (currentPhase === "PART3_QUESTION") duration = 22;
        else if (currentPhase === "ASK_ID") duration = 5;

        if (currentPhase === "PART1_QUESTION" || currentPhase === "PART2_SPEAK" || currentPhase === "PART3_QUESTION") {
          startListening();
          startTimer(duration, false, () => {
            stopListening();
            handleTimerExpire();
          });
        } else if (currentPhase === "ASK_ID") {
          startTimer(5, false, () => {
            triggerAIMessage("ID_PAUSE");
          });
        } else if (currentPhase === "PART2_PREP") {
          startTimer(60, true, () => {
            triggerAIPhase("PART2_SPEAK");
          });
        }
      } else if (action === "auto_advance") {
        // Auto-advance to next phase after AI finishes speaking
        const nextPhase = advancePhase();
        if (nextPhase !== "CONCLUSION") {
          triggerAIMessage(nextPhase);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpeaking]);

  // Auto intro on mount
  useEffect(() => {
    if (!autoIntroSent) {
      setAutoIntroSent(true);
      triggerAIMessage("INTRO");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTimerExpire = () => {
    // When timer expires during a timed question, advance to next
    const nextPhase = advancePhase();
    if (nextPhase !== "CONCLUSION") {
      triggerAIMessage(nextPhase);
    }
  };

  const triggerAIPhase = (targetPhase: IeltsPhase) => {
    testFlow.setPhase(targetPhase);
    triggerAIMessage(targetPhase);
  };

  const triggerAIMessage = async (targetPhase: IeltsPhase) => {
    setIsLoading(true);
    stopSpeaking();
    spokenUpToRef.current = 0;
    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: messages.slice(-10), // Send recent context
          phase: targetPhase,
          questionIndex,
          selectedTheme,
          selectedPart2Index,
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("Failed to connect");
      assistantSoFar = await processStream(resp.body, assistantSoFar);
      flushRemainingSpeech(assistantSoFar);

      // After AI finishes speaking, decide what to do next
      schedulePostAIAction(targetPhase);
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Could not reach the examiner. Try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const schedulePostAIAction = (currentPhase: IeltsPhase) => {
    // For phases where AI speaks then waits for user (no timer)
    const waitForUserPhases: IeltsPhase[] = ["INTRO", "ASK_NAME", "ASK_NICKNAME_ORIGIN"];

    if (waitForUserPhases.includes(currentPhase)) {
      // Wait for AI audio to finish, then start mic
      pendingActionRef.current = "mic_only";
      pendingTimerPhaseRef.current = currentPhase;
      return;
    }

    // Phases that need timer after AI speaks
    const timedPhases: IeltsPhase[] = ["PART1_QUESTION", "PART2_SPEAK", "PART3_QUESTION", "ASK_ID", "PART2_PREP"];
    if (timedPhases.includes(currentPhase)) {
      pendingActionRef.current = "mic_and_timer";
      pendingTimerPhaseRef.current = currentPhase;
      return;
    }

    // Auto-advance phases (AI speaks then immediately moves on)
    const autoAdvancePhases: IeltsPhase[] = ["ID_PAUSE", "PART1_INTRO", "PART2_INTRO", "PART3_INTRO"];
    if (autoAdvancePhases.includes(currentPhase)) {
      pendingActionRef.current = "auto_advance";
      pendingTimerPhaseRef.current = currentPhase;
      return;
    }

    // CONCLUSION - do nothing, test is over
  };

  const sendMessage = useCallback(async (input: string) => {
    stopTimer();
    if (isListening) stopListening();

    const userMsg: Msg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);

    // Advance to next phase
    const nextPhase = advancePhase();
    if (nextPhase === "CONCLUSION" && phase === "CONCLUSION") {
      return; // Test already complete
    }

    triggerAIMessageRef.current(nextPhase);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, advancePhase, stopTimer, isListening, stopListening]);

  // Keep sendMessageRef always pointing to latest sendMessage
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  // Keep triggerAIMessageRef always pointing to latest triggerAIMessage
  useEffect(() => {
    triggerAIMessageRef.current = triggerAIMessage;
  });

  const processStream = async (body: ReadableStream<Uint8Array>, assistantSoFar: string): Promise<string> => {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { streamDone = true; break; }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantSoFar += content;
            const snapshot = assistantSoFar;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: snapshot } : m));
              }
              return [...prev, { role: "assistant", content: snapshot }];
            });
            checkAndQueueSentences(snapshot);
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
    return assistantSoFar;
  };

  const handleMicToggle = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const handleSpeak = (text: string) => {
    if (isSpeaking) stopSpeaking();
    else speak(getSpeakableText(text));
  };

  // Timer color
  const timerProgress = timerMax > 0 ? (timerSeconds / timerMax) * 100 : 0;
  const timerColor = timerProgress > 50 ? "bg-emerald-500" : timerProgress > 25 ? "bg-amber-500" : "bg-red-500";

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col h-screen bg-[#FAFAF8] relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[200px] sm:w-[300px] h-[200px] sm:h-[300px] rounded-full bg-gradient-to-br from-rose-300/30 to-pink-200/20 blur-[80px] animate-float pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[180px] sm:w-[250px] h-[180px] sm:h-[250px] rounded-full bg-gradient-to-br from-orange-300/20 to-rose-200/15 blur-[80px] animate-float pointer-events-none" style={{ animationDelay: "2s" }} />

      {/* Header */}
      <header className="relative z-10 flex flex-col border-b border-border/50 bg-white/70 backdrop-blur-sm">
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/novaielts")} className="text-muted-foreground hover:text-foreground h-8 w-8 sm:h-9 sm:w-9">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="relative">
            <div className="rounded-full p-0.5 bg-gradient-to-br from-rose-400 to-pink-400">
              <div className="rounded-full overflow-hidden bg-white">
                <LingbotAvatar size="sm" isSpeaking={isSpeaking} />
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">Tom — IELTS Examiner</p>
            <p className="text-xs text-muted-foreground">{phaseLabel}</p>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1">
            {messages.length > 2 && (
              <>
                <Button variant="ghost" size="icon" onClick={() => setShowTranscript(true)}
                  className="text-muted-foreground hover:text-foreground h-8 w-8" title="View transcript">
                  <FileText className="h-4 w-4" />
                </Button>
                {isTestComplete && (
                  <Button variant="ghost" size="icon" onClick={() => setShowFeedback(true)}
                    className="text-muted-foreground hover:text-foreground h-8 w-8" title="View IELTS Report">
                    <ClipboardCheck className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Timer bar */}
        {isTimerRunning && (
          <div className="px-3 sm:px-4 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-slate-600 min-w-[40px]">
                {formatTime(timerSeconds)}
              </span>
              <div className="flex-1">
                <Progress
                  value={timerProgress}
                  className="h-2"
                  style={{
                    // @ts-ignore
                    "--progress-color": timerProgress > 50 ? "hsl(160, 84%, 39%)" : timerProgress > 25 ? "hsl(38, 92%, 50%)" : "hsl(0, 84%, 60%)",
                  }}
                />
              </div>
              <span className="text-xs text-slate-500">{isPrepTime ? "Prep time" : "Speaking"}</span>
            </div>
          </div>
        )}
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 sm:px-4 py-4 relative z-10">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-20">
            <div className="rounded-full p-1 bg-gradient-to-br from-rose-400 to-pink-400 shadow-lg shadow-rose-200/50">
              <div className="rounded-full overflow-hidden bg-white">
                <LingbotAvatar />
              </div>
            </div>
            <p className="mt-4 text-lg font-medium text-foreground">Connecting...</p>
            <p className="text-sm max-w-xs mt-1">Setting up your IELTS examiner</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatBubble
            key={i}
            role={msg.role}
            content={msg.content}
            isSpeaking={isSpeaking}
            onSpeak={msg.role === "assistant" ? () => handleSpeak(msg.content) : undefined}
          />
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-3 mb-4 justify-start">
            <div className="rounded-full p-0.5 bg-gradient-to-br from-rose-400 to-pink-400">
              <div className="rounded-full overflow-hidden bg-white">
                <LingbotAvatar size="sm" />
              </div>
            </div>
            <div className="bg-white border border-border/50 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </ScrollArea>

      {/* Input */}
      <div className="relative z-10">
        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          isListening={isListening}
          onMicToggle={handleMicToggle}
          micSupported={micSupported}
        />
      </div>

      {/* Dialogs */}
      <TranscriptDialog open={showTranscript} onOpenChange={setShowTranscript} messages={messages} language="English" />
      <IeltsFeedbackDialog open={showFeedback} onOpenChange={setShowFeedback} messages={messages} />
    </div>
  );
};

export default IeltsChat;
