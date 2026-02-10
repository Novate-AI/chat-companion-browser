import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { languages } from "@/lib/languages";
import { LingbotAvatar } from "@/components/LingbotAvatar";
import { ChatBubble } from "@/components/ChatBubble";
import { ChatInput } from "@/components/ChatInput";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { TranscriptDialog } from "@/components/TranscriptDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lightbulb, LightbulbOff, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const Chat = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const langCode = searchParams.get("lang") || "en";
  const lang = languages.find((l) => l.code === langCode) || languages.find(l => l.code === "en")!;

  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nativeLanguage, setNativeLanguage] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [autoIntroSent, setAutoIntroSent] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { isSpeaking, speak, stop: stopSpeaking } = useSpeechSynthesis(lang.speechCode);

  const onVoiceResult = useCallback((transcript: string) => {
    sendMessage(transcript);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { isListening, start: startListening, stop: stopListening, isSupported: micSupported } =
    useSpeechRecognition({ lang: lang.recognitionCode, onResult: onVoiceResult });

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-send intro message on mount
  useEffect(() => {
    if (!autoIntroSent) {
      setAutoIntroSent(true);
      triggerIntro();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-play voice when a new assistant message finishes streaming
  const lastAssistantRef = useRef<string>("");
  const wasLoadingRef = useRef(false);
  useEffect(() => {
    if (wasLoadingRef.current && !isLoading && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === "assistant" && last.content !== lastAssistantRef.current) {
        lastAssistantRef.current = last.content;
        // Auto-play the response
        speak(last.content);
      }
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading, messages, speak]);

  // Detect native language from early messages
  useEffect(() => {
    if (nativeLanguage) return;
    const userMsgs = messages.filter(m => m.role === "user");
    if (userMsgs.length >= 1) {
      // Check if the AI responded with knowledge of native language
      const lastAssistant = messages.filter(m => m.role === "assistant").pop();
      if (lastAssistant) {
        // Try to detect language codes mentioned
        const lowerContent = userMsgs[0].content.toLowerCase();
        const match = languages.find(l =>
          lowerContent.includes(l.name.toLowerCase()) || lowerContent.includes(l.code)
        );
        if (match) {
          setNativeLanguage(match.code);
        }
      }
    }
  }, [messages, nativeLanguage]);

  const triggerIntro = async () => {
    setIsLoading(true);
    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [],
          language: langCode,
          nativeLanguage: null,
          showSuggestions,
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("Failed to connect");
      await processStream(resp.body, assistantSoFar);
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Could not reach the tutor. Try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (input: string) => {
    const userMsg: Msg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = "";
    const allMessages = [...messages, userMsg];

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages,
          language: langCode,
          nativeLanguage,
          showSuggestions,
        }),
      });

      if (resp.status === 429) {
        toast({ title: "Rate limited", description: "Too many requests. Please wait a moment.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast({ title: "Credits needed", description: "Please add credits to continue.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("Failed to connect");

      await processStream(resp.body, assistantSoFar);
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Could not reach the tutor. Try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const processStream = async (body: ReadableStream<Uint8Array>, assistantSoFar: string) => {
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
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
  };

  const handleMicToggle = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const handleSpeak = (text: string) => {
    if (isSpeaking) stopSpeaking();
    else speak(text);
  };

  return (
    <div className="flex flex-col h-screen bg-[#FAFAF8] relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-teal-300/30 to-cyan-200/20 blur-[80px] animate-float pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[250px] h-[250px] rounded-full bg-gradient-to-br from-purple-300/20 to-pink-200/15 blur-[80px] animate-float pointer-events-none" style={{ animationDelay: "2s" }} />

      {/* Header */}
      <header className="relative z-10 flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-white/70 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate("/novatutor")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="relative">
          <div className="rounded-full p-0.5 bg-gradient-to-br from-teal-400 to-cyan-400">
            <div className="rounded-full overflow-hidden bg-white">
              <LingbotAvatar size="sm" isSpeaking={isSpeaking} />
            </div>
          </div>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-foreground">Tom Holland</p>
          <p className="text-xs text-muted-foreground">{lang.flag} {lang.name} tutor</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="text-muted-foreground hover:text-foreground"
            title={showSuggestions ? "Disable response suggestions" : "Enable response suggestions"}
          >
            {showSuggestions ? <Lightbulb className="h-4 w-4 text-amber-500" /> : <LightbulbOff className="h-4 w-4" />}
          </Button>
          {messages.length > 2 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowTranscript(true)}
              className="text-muted-foreground hover:text-foreground"
              title="View transcript"
            >
              <FileText className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4 relative z-10">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-20">
            <div className="rounded-full p-1 bg-gradient-to-br from-teal-400 to-cyan-400 shadow-lg shadow-teal-200/50">
              <div className="rounded-full overflow-hidden bg-white">
                <LingbotAvatar />
              </div>
            </div>
            <p className="mt-4 text-lg font-medium text-foreground">Connecting...</p>
            <p className="text-sm max-w-xs mt-1">Setting up your {lang.name} tutor</p>
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
            <div className="rounded-full p-0.5 bg-gradient-to-br from-teal-400 to-cyan-400">
              <div className="rounded-full overflow-hidden bg-white">
                <LingbotAvatar size="sm" />
              </div>
            </div>
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
      <div className="relative z-10">
        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          isListening={isListening}
          onMicToggle={handleMicToggle}
          micSupported={micSupported}
        />
      </div>

      {/* Transcript Dialog */}
      <TranscriptDialog
        open={showTranscript}
        onOpenChange={setShowTranscript}
        messages={messages}
        language={lang.name}
      />
    </div>
  );
};

export default Chat;
