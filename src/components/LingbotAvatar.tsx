import lingbotImg from "@/assets/lingbot.png";
import { cn } from "@/lib/utils";

interface LingbotAvatarProps {
  isSpeaking?: boolean;
  size?: "sm" | "lg";
}

export function LingbotAvatar({ isSpeaking, size = "lg" }: LingbotAvatarProps) {
  return (
    <div className={cn(
      "relative rounded-full overflow-hidden border-4 border-primary/20 shadow-lg",
      size === "lg" ? "w-32 h-32" : "w-10 h-10",
      isSpeaking && "ring-4 ring-accent animate-pulse"
    )}>
      <img src={lingbotImg} alt="Novatutor" className="w-full h-full object-cover" />
    </div>
  );
}
