import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { LingbotAvatar } from "@/components/LingbotAvatar";
import { MessageCircle } from "lucide-react";

const Index = () => {
  const [language, setLanguage] = useState("es");
  const navigate = useNavigate();

  const start = () => navigate(`/chat?lang=${language}`);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/40 px-4">
      <div className="flex flex-col items-center gap-8 text-center max-w-md">
        <LingbotAvatar />

        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
            Lingbot World
          </h1>
          <p className="mt-2 text-muted-foreground text-lg">
            Your friendly AI language tutor. Practice speaking any language through conversation.
          </p>
        </div>

        <LanguageSelector value={language} onChange={setLanguage} />

        <Button size="lg" onClick={start} className="gap-2 text-base px-8">
          <MessageCircle className="h-5 w-5" />
          Start Conversation
        </Button>
      </div>
    </main>
  );
};

export default Index;
