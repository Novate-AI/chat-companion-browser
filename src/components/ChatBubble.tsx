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
      {isBot && <LingbotAvatar size="sm" isSpeaking={isSpeaking} />}
      <div className={cn(
        "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
        isBot
          ? "bg-secondary text-secondary-foreground rounded-bl-sm"
          : "bg-primary text-primary-foreground rounded-br-sm"
      )}>
        <p className="whitespace-pre-wrap">{content}</p>
        {isBot && onSpeak && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 mt-1 opacity-60 hover:opacity-100"
            onClick={onSpeak}
          >
            <Volume2 className={cn("h-3.5 w-3.5", isSpeaking && "text-accent animate-pulse")} />
          </Button>
        )}
      </div>
    </div>
  );
}
