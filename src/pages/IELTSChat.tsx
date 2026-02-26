import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LingbotAvatar } from "@/components/LingbotAvatar";
import { ChatBubble } from "@/components/ChatBubble";
import { ChatInput } from "@/components/ChatInput";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { IELTSTranscriptDialog } from "@/components/IELTSTranscriptDialog";
import { IELTSFeedbackDialog } from "@/components/IELTSFeedbackDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, ClipboardCheck, Clock, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSpeakableText } from "@/lib/chatHelpers";
import { pickPart1Questions, pickPart2Question, pickPart3Questions } from "@/lib/ieltsQuestions";
import type { IELTSPart2Question } from "@/lib/ieltsQuestions";

type Msg = { role: "user" | "assistant"; content: string };

type Phase =
  | "intro"
  | "ask-name"
  | "ask-origin"
  | "id-check"
  | "id-thanks"
  | "part1-intro"
  | "part1"
  | "part2-intro"
  | "part2-prep"
  | "part2-speak"
  | "part3-intro"
  | "part3"
  | "conclusion";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ielts-chat`;

const IELTSChat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Phase tracking with refs for async safety
  const phaseRef = useRef<Phase>("intro");
  const [phaseDisplay, setPhaseDisplay] = useState<Phase>("intro");
  const questionIndexRef = useRef(0);

  // Test data
  const part1DataRef = useRef(pickPart1Questions());
  const part2DataRef = useRef<IELTSPart2Question>(pickPart2Question());
  const part3QuestionsRef = useRef<string[]>([]);

  // Timer
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerLabel, setTimerLabel] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const testStartTimeRef = useRef<number | null>(null);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const totalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-advance timer for user response windows
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // TTS
  const { isSpeaking, speak, speakQueued, stop: stopSpeaking } = useSpeechSynthesis("en-GB");
  const spokenUpToRef = useRef(0);

  // Track test completion
  const [testFinished, setTestFinished] = useState(false);

  // Pending transcript accumulated during response windows
  const pendingTranscriptRef = useRef("");
  const inTimedWindowRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUserResponseRef = useRef<(input: string) => void>(null as any);

  // Voice recognition callback - fires on every final speech phrase
  const onVoiceResult = useCallback((transcript: string) => {
    if (inTimedWindowRef.current) {
      // In a timed window — accumulate, timer expiry will collect it
      pendingTranscriptRef.current += (pendingTranscriptRef.current ? " " : "") + transcript;
    } else {
      // Non-timed phase (intro, name, origin, id-check) — advance immediately
      handleUserResponseRef.current?.(transcript);
    }
  }, []);

  const { isListening, start: startListening, stop: stopListening, isSupported: micSupported } =
    useSpeechRecognition({ lang: "en-US", onResult: onVoiceResult });

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto start test
  useEffect(() => {
    sendExaminerMessage("Say exactly: We are going to start the IELTS speaking test. Are you ready?");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

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

  const setPhase = (p: Phase) => {
    phaseRef.current = p;
    setPhaseDisplay(p);
  };

  // Start total test timer
  const startTotalTimer = () => {
    if (testStartTimeRef.current) return;
    testStartTimeRef.current = Date.now();
    totalTimerRef.current = setInterval(() => {
      setTotalElapsed(Math.floor((Date.now() - testStartTimeRef.current!) / 1000));
    }, 1000);
  };

  // Start a countdown timer
  const startCountdown = (seconds: number, label: string, onComplete: () => void) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerSeconds(seconds);
    setTimerLabel(label);
    let remaining = seconds;
    timerRef.current = setInterval(() => {
      remaining--;
      setTimerSeconds(remaining);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setTimerLabel("");
        onComplete();
      }
    }, 1000);
  };

  const startUserResponseWindow = (seconds: number) => {
    inTimedWindowRef.current = true;
    pendingTranscriptRef.current = "";
    // Start mic — first call must originate from user gesture context (already granted)
    if (micSupported) startListening();

    startCountdown(seconds, "Time remaining", () => {
      // Time's up — stop mic (fires onResult with accumulated text), then advance
      stopListening();
      // Use setTimeout to let the onResult callback fire first
      setTimeout(() => {
        const transcript = pendingTranscriptRef.current.trim() || "(no response - time expired)";
        pendingTranscriptRef.current = "";
        inTimedWindowRef.current = false;
        advanceAfterUserResponse(transcript);
      }, 100);
    });
  };

  const stopAllTimers = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (autoAdvanceRef.current) { clearTimeout(autoAdvanceRef.current); autoAdvanceRef.current = null; }
    setTimerLabel("");
  };

  // Send an AI examiner message
  const sendExaminerMessage = async (instruction: string) => {
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
        body: JSON.stringify({ messages, instruction }),
      });

      if (resp.status === 429) { toast({ title: "Rate limited", description: "Too many requests.", variant: "destructive" }); setIsLoading(false); return; }
      if (resp.status === 402) { toast({ title: "Credits needed", description: "Please add credits.", variant: "destructive" }); setIsLoading(false); return; }
      if (!resp.ok || !resp.body) throw new Error("Failed to connect");

      assistantSoFar = await processStream(resp.body, assistantSoFar);
      flushRemainingSpeech(assistantSoFar);
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Could not reach the examiner. Try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

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

  // Handle manual user submission (typed text or explicit send)
  const handleUserResponse = (input: string) => {
    if (isLoading || testFinished) return;
    inTimedWindowRef.current = false;
    stopAllTimers();
    stopListening();

    // Combine typed input with any accumulated speech
    const accumulated = pendingTranscriptRef.current.trim();
    pendingTranscriptRef.current = "";
    const finalInput = accumulated ? `${accumulated} ${input}`.trim() : input;

    const userMsg: Msg = { role: "user", content: finalInput };
    setMessages((prev) => [...prev, userMsg]);

    advanceAfterUserResponse(finalInput);
  };
  handleUserResponseRef.current = handleUserResponse;

  const advanceAfterUserResponse = (userInput: string) => {
    // Add user message if not already added (timer-driven path)
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "user" && last.content === userInput) return prev;
      return [...prev, { role: "user", content: userInput }];
    });
    const phase = phaseRef.current;

    switch (phase) {
      case "intro": {
        // User said yes/ready
        startTotalTimer();
        setPhase("ask-name");
        sendExaminerMessage("Say exactly: Hello, my name is Tom. Can you tell me your full name please?");
        break;
      }
      case "ask-name": {
        setPhase("ask-origin");
        sendExaminerMessage(`The candidate said their name. Now say: What shall I call you, and can you tell me where you're from?`);
        break;
      }
      case "ask-origin": {
        setPhase("id-check");
        sendExaminerMessage("Say exactly: May I see your identification please?");
        break;
      }
      case "id-check": {
        // Wait 2-3 seconds then say thank you and move to Part 1
        setPhase("id-thanks");
        setTimeout(() => {
          sendExaminerMessage(
            `Say exactly: Thank you, that's fine. Now, we will start with Part 1 of the IELTS speaking test. In this part of the test, I'm going to ask you about 12 questions on day-to-day topics. They should be simple and familiar questions to you. The topic is ${part1DataRef.current.topic}. The first question. ${part1DataRef.current.questions[0]}`
          );
          setPhase("part1");
          questionIndexRef.current = 0;
          // After AI finishes speaking, start user response window
          waitForSpeechThenStartTimer(20);
        }, 2500);
        break;
      }
      case "part1": {
        const nextIdx = questionIndexRef.current + 1;
        if (nextIdx >= 12) {
          // Move to Part 2
          setPhase("part2-intro");
          const p2 = part2DataRef.current;
          part3QuestionsRef.current = pickPart3Questions(p2.topic);
          sendExaminerMessage(
            `Say: That concludes Part 1. Now we will move on to Part 2 of the speaking test. I'm going to give you a topic and I'd like you to talk about it for one to two minutes. Before you start, you will have one minute to think about what you want to say. Here is your topic. ${p2.prompt} You should say: ${p2.bullets.join(", ")}. ${p2.followUp} You now have one minute to prepare.`
          );
          // Start 1 min preparation countdown after AI speaks
          waitForSpeechThen(() => {
            setPhase("part2-prep");
            startCountdown(60, "Preparation time", () => {
              setPhase("part2-speak");
              sendExaminerMessage("Say exactly: Your preparation time is over. Please begin speaking now. You have two minutes.");
              waitForSpeechThen(() => {
                startUserResponseWindowLong(120);
              });
            });
          });
        } else {
          questionIndexRef.current = nextIdx;
          sendExaminerMessage(`Say exactly: ${part1DataRef.current.questions[nextIdx]}`);
          waitForSpeechThenStartTimer(20);
        }
        break;
      }
      case "part2-speak": {
        // User finished part 2 (or time expired)
        setPhase("part3-intro");
        questionIndexRef.current = 0;
        sendExaminerMessage(
          `Say exactly: Thank you. Now we will move on to Part 3 of the speaking test. In this part, I'd like to discuss some more general questions related to the topic we talked about in Part 2. ${part3QuestionsRef.current[0]}`
        );
        setPhase("part3");
        waitForSpeechThenStartTimer(25);
        break;
      }
      case "part3": {
        const nextIdx = questionIndexRef.current + 1;
        if (nextIdx >= 6) {
          // Test finished
          setPhase("conclusion");
          setTestFinished(true);
          if (totalTimerRef.current) { clearInterval(totalTimerRef.current); totalTimerRef.current = null; }
          sendExaminerMessage("Say exactly: That is the end of the speaking test. Thank you very much for your time. I hope you did well. Goodbye.");
        } else {
          questionIndexRef.current = nextIdx;
          sendExaminerMessage(`Say exactly: ${part3QuestionsRef.current[nextIdx]}`);
          waitForSpeechThenStartTimer(25);
        }
        break;
      }
      default:
        break;
    }
  };

  // Wait for TTS to finish, then start user response timer
  const waitForSpeechThenStartTimer = (seconds: number) => {
    const check = () => {
      // Wait until not loading and not speaking
      setTimeout(() => {
        if (isLoadingRef.current || isSpeakingRef.current) {
          check();
        } else {
          startUserResponseWindow(seconds);
        }
      }, 500);
    };
    check();
  };

  // Wait for speech to finish then execute callback
  const waitForSpeechThen = (cb: () => void) => {
    const check = () => {
      setTimeout(() => {
        if (isLoadingRef.current || isSpeakingRef.current) {
          check();
        } else {
          cb();
        }
      }, 500);
    };
    check();
  };

  const startUserResponseWindowLong = (seconds: number) => {
    inTimedWindowRef.current = true;
    pendingTranscriptRef.current = "";
    if (micSupported) startListening();
    startCountdown(seconds, "Speaking time", () => {
      stopListening();
      setTimeout(() => {
        const transcript = pendingTranscriptRef.current.trim() || "(speaking time ended)";
        pendingTranscriptRef.current = "";
        inTimedWindowRef.current = false;
        advanceAfterUserResponse(transcript);
      }, 100);
    });
  };

  // Refs for async checks
  const isLoadingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);

  const handleMicToggle = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const handleSpeak = (text: string) => {
    if (isSpeaking) stopSpeaking();
    else speak(getSpeakableText(text));
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const getPhaseLabel = () => {
    switch (phaseDisplay) {
      case "intro": return "Introduction";
      case "ask-name": case "ask-origin": case "id-check": case "id-thanks": return "Identity Check";
      case "part1-intro": case "part1": return "Part 1 — Interview";
      case "part2-intro": case "part2-prep": return "Part 2 — Preparation";
      case "part2-speak": return "Part 2 — Long Turn";
      case "part3-intro": case "part3": return "Part 3 — Discussion";
      case "conclusion": return "Test Complete";
      default: return "";
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#FAFAF8] relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[200px] sm:w-[300px] h-[200px] sm:h-[300px] rounded-full bg-gradient-to-br from-rose-300/30 to-pink-200/20 blur-[80px] animate-float pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[180px] sm:w-[250px] h-[180px] sm:h-[250px] rounded-full bg-gradient-to-br from-orange-300/20 to-amber-200/15 blur-[80px] animate-float pointer-events-none" style={{ animationDelay: "2s" }} />

      {/* Header */}
      <header className="relative z-10 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border/50 bg-white/70 backdrop-blur-sm">
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
          <p className="font-semibold text-sm text-foreground truncate">IELTS Examiner — Tom</p>
          <p className="text-xs text-muted-foreground">{getPhaseLabel()}</p>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Total timer */}
          {testStartTimeRef.current && (
            <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground bg-white/80 rounded-full px-2 py-1 border border-border/50">
              <Clock className="h-3 w-3" />
              {formatTime(totalElapsed)}
            </div>
          )}
          {/* Response timer */}
          {timerLabel && (
            <div className={`flex items-center gap-1 text-xs font-mono rounded-full px-2 py-1 border ${timerSeconds <= 5 ? "text-red-600 bg-red-50 border-red-200 animate-pulse" : "text-foreground bg-amber-50 border-amber-200"}`}>
              <Mic className="h-3 w-3" />
              {formatTime(timerSeconds)}
            </div>
          )}
          {testFinished && (
            <>
              <Button variant="ghost" size="icon" onClick={() => setShowTranscript(true)}
                className="text-muted-foreground hover:text-foreground h-8 w-8" title="View transcript">
                <FileText className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowFeedback(true)}
                className="text-muted-foreground hover:text-foreground h-8 w-8" title="Get band score">
                <ClipboardCheck className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
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
            <p className="mt-4 text-lg font-medium text-foreground">Setting up your test...</p>
            <p className="text-sm max-w-xs mt-1">Preparing the IELTS Speaking examination</p>
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
          onSend={handleUserResponse}
          isLoading={isLoading || testFinished}
          isListening={isListening}
          onMicToggle={handleMicToggle}
          micSupported={micSupported}
          autoMicMessage={
            ["part1", "part2-speak", "part3"].includes(phaseDisplay)
              ? "🎙️ Mic is auto-activated. Please speak while the recording is in progress."
              : undefined
          }
        />
      </div>

      {/* Dialogs */}
      <IELTSTranscriptDialog open={showTranscript} onOpenChange={setShowTranscript} messages={messages} />
      <IELTSFeedbackDialog open={showFeedback} onOpenChange={setShowFeedback} messages={messages} />
    </div>
  );
};

export default IELTSChat;
