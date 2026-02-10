import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, MicOff } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  isListening: boolean;
  onMicToggle: () => void;
  micSupported: boolean;
  autoMicMessage?: string;
}

export function ChatInput({ onSend, isLoading, isListening, onMicToggle, micSupported, autoMicMessage }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="border-t border-border/50 bg-white/70 backdrop-blur-sm">
      {autoMicMessage && (
        <div className="flex items-center gap-2 px-4 pt-3 pb-1 text-xs text-muted-foreground">
          <Mic className="h-3 w-3 text-rose-500 animate-pulse" />
          <span>{autoMicMessage}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2 p-4 pt-2">
        {micSupported && (
          <Button
            type="button"
            variant={isListening ? "destructive" : "outline"}
            size="icon"
            onClick={autoMicMessage ? undefined : onMicToggle}
            disabled={!!autoMicMessage}
            className="shrink-0"
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        )}
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? "🎙️ Listening..." : "Type a message..."}
          disabled={isLoading}
          className="flex-1 bg-white/80 border-border/50"
        />
        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          size="icon"
          className="shrink-0 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-sm"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
