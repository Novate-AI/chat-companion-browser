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
}

export function ChatInput({ onSend, isLoading, isListening, onMicToggle, micSupported }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t border-border/50 bg-white/70 backdrop-blur-sm">
      {micSupported && (
        <Button
          type="button"
          variant={isListening ? "destructive" : "outline"}
          size="icon"
          onClick={onMicToggle}
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
  );
}
