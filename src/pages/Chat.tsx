import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { languages } from "@/lib/languages";
import { ChatBubble } from "@/components/ChatBubble";
import { ChatInput } from "@/components/ChatInput";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { TranscriptDialog } from "@/components/TranscriptDialog";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { VideoAvatar } from "@/components/VideoAvatar";
import { useIntroSequence } from "@/hooks/useIntroSequence";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lightbulb, LightbulbOff, FileText, ClipboardCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSpeakableText } from "@/lib/chatHelpers";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const Chat = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const langCode = searchParams.get("lang") || "en";
  const cefrLevel = searchParams.get("level") || "A2";
  const lang = languages.find((l) => l.code === langCode) || languages.find(l => l.code === "en")!;

  const [aiMessages, setAiMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nativeLanguage, setNativeLanguage] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { isSpeaking, speak, speakQueued, stop: stopSpeaking } = useSpeechSynthesis(lang.speechCode);
  const spokenUpToRef = useRef(0);

  const {
    phase,
    isIntroActive,
    segment,
    scriptedMessages,
    handleSegmentEnd,
    handleIntroResponse,
  } = useIntroSequence();

  // Combined messages: scripted intro + AI conversation
  const messages = isIntroActive
    ? [...scriptedMessages, ...aiMessages]
    : [...scriptedMessages, ...aiMessages];

  const onVoiceResult = useCallback((transcript: string) => {
    sendMessage(transcript);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { isListening, start: startListening, stop: stopListening, isSupported: micSupported } =
    useSpeechRecognition({ lang: lang.recognitionCode, onResult: onVoiceResult });

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, aiMessages]);

  // Sentence chunking for TTS (only in normal mode)
  const checkAndQueueSentences = useCallback((fullText: string) => {
    if (isIntroActive) return;
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
  }, [speakQueued, isIntroActive]);

  const flushRemainingSpeech = useCallback((fullText: string) => {
    if (isIntroActive) return;
    const speakable = getSpeakableText(fullText);
    const remaining = speakable.slice(spokenUpToRef.current).trim();
    if (remaining) {
      speakQueued(remaining);
      spokenUpToRef.current = speakable.length;
    }
  }, [speakQueued, isIntroActive]);

  // Detect native language
  useEffect(() => {
    if (nativeLanguage) return;
    const userMsgs = aiMessages.filter(m => m.role === "user");
    if (userMsgs.length >= 1) {
      const lowerContent = userMsgs[0].content.toLowerCase();
      const match = languages.find(l =>
        lowerContent.includes(l.name.toLowerCase()) || lowerContent.includes(l.code)
      );
      if (match) setNativeLanguage(match.code);
    }
  }, [aiMessages, nativeLanguage]);

  const sendMessage = async (input: string) => {
    const userMsg: Msg = { role: "user", content: input };
    setAiMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    stopSpeaking();
    spokenUpToRef.current = 0;

    // During intro, check if user input makes sense
    if (isIntroActive) {
      // Intro validation: reject gibberish/too-vague first replies
      const trimmed = input.trim();
      const normalized = trimmed.toLowerCase();
      const words = normalized.split(/\s+/).filter(Boolean);
      const letterCount = (trimmed.match(/[a-zA-Z\u00C0-\u024F\u0400-\u04FF\u0600-\u06FF\u3040-\u30FF\u4E00-\u9FFF]/g) || []).length;

      const latinLettersOnly = trimmed.replace(/[^a-z]/gi, "");
      const vowelCount = (latinLettersOnly.match(/[aeiou]/gi) || []).length;
      const vowelRatio = latinLettersOnly.length ? vowelCount / latinLettersOnly.length : 0;

      const hasMeaningfulIntro = /\b(my name is|i am|i'm|name|from|native language|i speak|speak)\b/i.test(trimmed) || words.length >= 2;
      const looksLikeRandomLatin = latinLettersOnly.length >= 6 && vowelRatio < 0.23;
      const longSingleToken = words.length === 1 && latinLettersOnly.length > 8;

      const isGibberish =
        trimmed.length < 2 ||
        (letterCount / Math.max(trimmed.length, 1)) < 0.4 ||
        looksLikeRandomLatin ||
        longSingleToken ||
        !hasMeaningfulIntro;

      if (isGibberish) {
        // Add the "pardon" message to aiMessages so it appears after the user's reply
        setAiMessages(prev => [...prev, { role: "assistant", content: "Pardon me, can you repeat that again?" }]);
        handleIntroResponse(false);
        setIsLoading(false);
        return;
      }

      try {
        const allMessages = [...aiMessages, userMsg];
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: allMessages, language: langCode, nativeLanguage, showSuggestions: false, cefrLevel }),
        });

        if (!resp.ok || !resp.body) {
          setAiMessages(prev => [...prev, { role: "assistant", content: "Pardon me, can you repeat that again?" }]);
          handleIntroResponse(false);
          setIsLoading(false);
          return;
        }

        // Read the stream but don't add to messages — we only check if AI understood
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
        }

        if (!fullText || fullText.trim().length === 0) {
          setAiMessages(prev => [...prev, { role: "assistant", content: "Pardon me, can you repeat that again?" }]);
          handleIntroResponse(false);
        } else {
          // Check if the AI's response indicates it couldn't understand the user
          const lower = fullText.toLowerCase();
          const aiDetectedGibberish = /trouble|keyboard|testing|didn.?t understand|not sure what|gibberish|random|unclear|could you (try|say|repeat|type)|what do you mean/i.test(lower);
          
          if (aiDetectedGibberish) {
            setAiMessages(prev => [...prev, { role: "assistant", content: "Pardon me, can you repeat that again?" }]);
            handleIntroResponse(false);
          } else {
            setAiMessages(prev => [...prev, { role: "assistant", content: "Thank you for that. So, what do you want to practice today?" }]);
            handleIntroResponse(true);
          }
        }
      } catch {
        setAiMessages(prev => [...prev, { role: "assistant", content: "Pardon me, can you repeat that again?" }]);
        handleIntroResponse(false);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Normal mode
    let assistantSoFar = "";
    const allMessages = [...scriptedMessages, ...aiMessages, userMsg];

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, language: langCode, nativeLanguage, showSuggestions, cefrLevel }),
      });

      if (resp.status === 429) { toast({ title: "Rate limited", description: "Too many requests.", variant: "destructive" }); setIsLoading(false); return; }
      if (resp.status === 402) { toast({ title: "Credits needed", description: "Please add credits.", variant: "destructive" }); setIsLoading(false); return; }
      if (!resp.ok || !resp.body) throw new Error("Failed to connect");
      assistantSoFar = await processStream(resp.body, assistantSoFar);
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Could not reach the tutor. Try again.", variant: "destructive" });
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
            setAiMessages((prev) => {
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

  const handleSuggestionClick = (suggestion: string) => {
    if (!isLoading) sendMessage(suggestion);
  };

  const hasEnoughMessages = messages.length > 2;

  return (
    <div className="flex flex-col h-screen bg-[#FAFAF8] relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[200px] sm:w-[300px] h-[200px] sm:h-[300px] rounded-full bg-gradient-to-br from-teal-300/30 to-cyan-200/20 blur-[80px] animate-float pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[180px] sm:w-[250px] h-[180px] sm:h-[250px] rounded-full bg-gradient-to-br from-purple-300/20 to-pink-200/15 blur-[80px] animate-float pointer-events-none" style={{ animationDelay: "2s" }} />

      {/* Header */}
      <header className="relative z-10 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border/50 bg-white/70 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate("/novatutor")} className="text-muted-foreground hover:text-foreground h-8 w-8 sm:h-9 sm:w-9">
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">Novate Abby</p>
          <p className="text-xs text-muted-foreground">{lang.flag} {lang.name} tutor</p>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <Button variant="ghost" size="icon" onClick={() => setShowSuggestions(!showSuggestions)}
            className="text-muted-foreground hover:text-foreground h-8 w-8"
            title={showSuggestions ? "Disable suggestions" : "Enable suggestions"}>
            {showSuggestions ? <Lightbulb className="h-4 w-4 text-amber-500" /> : <LightbulbOff className="h-4 w-4" />}
          </Button>
          {hasEnoughMessages && (
            <>
              <Button variant="ghost" size="icon" onClick={() => setShowTranscript(true)}
                className="text-muted-foreground hover:text-foreground h-8 w-8" title="View transcript">
                <FileText className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowFeedback(true)}
                className="text-muted-foreground hover:text-foreground h-8 w-8" title="Get feedback">
                <ClipboardCheck className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Main content: split layout */}
      <div className={`flex-1 flex ${isMobile ? "flex-col" : "flex-row"} overflow-hidden relative z-10`}>
        {/* Video panel */}
        <div className={`${isMobile ? "w-full px-3 pt-3" : "w-[40%] min-w-[300px] max-w-[450px] p-4 flex items-start"}`}>
          <VideoAvatar
            startTime={segment.start}
            endTime={segment.end}
            loop={segment.loop}
            onSegmentEnd={handleSegmentEnd}
          />
        </div>

        {/* Chat panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 px-3 sm:px-4 py-4">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-20">
                <p className="text-lg font-medium text-foreground">Connecting...</p>
                <p className="text-sm max-w-xs mt-1">Setting up your {lang.name} tutor</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <ChatBubble
                key={i}
                role={msg.role}
                content={msg.content}
                isSpeaking={isSpeaking}
                onSpeak={undefined}
                onSuggestionClick={msg.role === "assistant" && i === messages.length - 1 ? handleSuggestionClick : undefined}
              />
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-3 mb-4 justify-start">
                <div className="bg-white border border-border/50 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </ScrollArea>

          {/* Input */}
          <ChatInput onSend={sendMessage} isLoading={isLoading} isListening={isListening} onMicToggle={handleMicToggle} micSupported={micSupported} />
        </div>
      </div>

      {/* Dialogs */}
      <TranscriptDialog open={showTranscript} onOpenChange={setShowTranscript} messages={messages} language={lang.name} />
      <FeedbackDialog open={showFeedback} onOpenChange={setShowFeedback} messages={messages} language={lang.name} />
    </div>
  );
};

export default Chat;
