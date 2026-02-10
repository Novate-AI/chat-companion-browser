import lingbotImg from "@/assets/lingbot.png";
import { cn } from "@/lib/utils";

interface LingbotAvatarProps {
  isSpeaking?: boolean;
  size?: "sm" | "lg";
}

export function LingbotAvatar({ isSpeaking, size = "lg" }: LingbotAvatarProps) {
  return (
    <div className={cn(
      "relative",
      size === "lg" ? "w-32 h-32" : "w-10 h-10",
      isSpeaking && "animate-pulse"
    )}>
      <img src={lingbotImg} alt="NovaPatient" className="w-full h-full object-contain" />
    </div>
  );
}
