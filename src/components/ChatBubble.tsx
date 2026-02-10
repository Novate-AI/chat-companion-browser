import { cn } from "@/lib/utils";
import { LingbotAvatar } from "./LingbotAvatar";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  isSpeaking?: boolean;
  onSpeak?: () => void;
}

export function ChatBubble({ role, content, isSpeaking, onSpeak }: ChatBubbleProps) {
  const isBot = role === "assistant";

  return (
    <div className={cn("flex gap-3 mb-4", isBot ? "justify-start" : "justify-end")}>
      {isBot && (
        <div className="rounded-full p-0.5 bg-gradient-to-br from-teal-400 to-cyan-400 self-end shrink-0">
          <div className="rounded-full overflow-hidden bg-white">
            <LingbotAvatar size="sm" isSpeaking={isSpeaking} />
          </div>
        </div>
      )}
      <div className={cn(
        "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
        isBot
          ? "bg-white border border-border/50 text-foreground rounded-bl-sm"
          : "bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-br-sm shadow-teal-200/40 shadow-md"
      )}>
        <p className="whitespace-pre-wrap">{content}</p>
        {isBot && onSpeak && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 mt-1 opacity-60 hover:opacity-100"
            onClick={onSpeak}
          >
            <Volume2 className={cn("h-3.5 w-3.5", isSpeaking && "text-teal-500 animate-pulse")} />
          </Button>
        )}
      </div>
    </div>
  );
}
