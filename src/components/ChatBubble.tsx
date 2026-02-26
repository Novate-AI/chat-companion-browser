import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { parseAssistantMessage } from "@/lib/chatHelpers";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  onSuggestionClick?: (suggestion: string) => void;
}

export function ChatBubble({ role, content, onSuggestionClick }: ChatBubbleProps) {
  const isBot = role === "assistant";
  const [showTranslation, setShowTranslation] = useState(false);

  const parsed = isBot ? parseAssistantMessage(content) : null;
  const displayContent = isBot ? parsed!.mainContent : content;
  const hasTranslation = parsed?.translation || parsed?.transliteration;

  return (
    <div className={cn("mb-4", isBot ? "" : "flex justify-end")}>
      <div className={cn("flex gap-3", isBot ? "justify-start" : "justify-end")}>
      {/* Avatar removed — video panel serves as the avatar */}
        <div className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
          isBot
            ? "bg-white border border-border/50 text-foreground rounded-bl-sm"
            : "bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-br-sm shadow-teal-200/40 shadow-md"
        )}>
          <p className="whitespace-pre-wrap">{displayContent}</p>

          {/* Translation/Transliteration dropdown */}
          {isBot && hasTranslation && (
            <div className="mt-2 border-t border-border/30 pt-2">
              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showTranslation ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {showTranslation ? "Hide translation" : "Show translation"}
              </button>
              {showTranslation && (
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {parsed?.translation && (
                    <p><span className="font-medium text-foreground/70">Translation:</span> {parsed.translation}</p>
                  )}
                  {parsed?.transliteration && (
                    <p><span className="font-medium text-foreground/70">Transliteration:</span> {parsed.transliteration}</p>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Suggestions below the bubble */}
      {isBot && parsed?.suggestions && parsed.suggestions.length > 0 && onSuggestionClick && (
        <div className="ml-12 mt-2 flex flex-wrap gap-2">
          {parsed.suggestions.map((sug, i) => (
            <button
              key={i}
              onClick={() => onSuggestionClick(sug)}
              className="text-xs px-3 py-1.5 rounded-full border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:border-teal-300 transition-colors"
            >
              {sug}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
