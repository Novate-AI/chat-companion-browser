import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { LingbotAvatar } from "@/components/LingbotAvatar";
import { MessageCircle, ArrowLeft, Sparkles } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const cefrLevels = [
  { value: "A1", label: "A1", desc: "Starter" },
  { value: "A2", label: "A2", desc: "Beginner" },
  { value: "B1", label: "B1", desc: "Intermediate" },
  { value: "B2", label: "B2", desc: "Upper Intermediate" },
  { value: "C1", label: "C1", desc: "Advanced" },
  { value: "C2", label: "C2", desc: "Mastery" },
];

const Novatutor = () => {
  const [language, setLanguage] = useState("en");
  const [level, setLevel] = useState("A2");
  const navigate = useNavigate();

  const start = () => navigate(`/chat?lang=${language}&level=${level}`);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FAFAF8]">
      {/* Floating gradient blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-teal-300/40 to-cyan-200/30 blur-[80px] animate-float" />
      <div
        className="absolute bottom-[-5%] left-[-5%] w-[350px] h-[350px] rounded-full bg-gradient-to-br from-purple-300/30 to-pink-200/25 blur-[80px] animate-float"
        style={{ animationDelay: "2s", animationDuration: "8s" }}
      />
      <div
        className="absolute top-[40%] left-[60%] w-[250px] h-[250px] rounded-full bg-gradient-to-br from-orange-200/25 to-rose-200/20 blur-[80px] animate-float"
        style={{ animationDelay: "3s", animationDuration: "9s" }}
      />

      {/* Subtle dot grid */}
      <div className="absolute inset-0 grid-pattern pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen items-center justify-center px-4">
        {/* Back button */}
        <Button
          variant="ghost"
          className="absolute top-4 left-4 gap-1 text-slate-500 hover:text-slate-800"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="flex flex-col items-center gap-8 text-center max-w-md">
          {/* Avatar with colored shadow */}
          <div className="animate-fade-in-up" style={{ opacity: 0 }}>
            <div className="rounded-full p-1 bg-gradient-to-br from-teal-400 to-cyan-400 shadow-lg shadow-teal-200/50">
              <div className="rounded-full overflow-hidden bg-white">
                <LingbotAvatar />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s", opacity: 0 }}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-teal-500" />
              <span className="text-xs font-semibold tracking-widest uppercase text-teal-600">
                AI Language Tutor
              </span>
              <Sparkles className="w-5 h-5 text-teal-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-800">
              Nova<span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-cyan-500">tutor</span>
            </h1>
            <p className="mt-3 text-slate-500 text-lg leading-relaxed">
              Your friendly AI language tutor. Practice any language through conversation.
            </p>
          </div>

          {/* Language Selector */}
          <div className="animate-fade-in-up w-full flex justify-center" style={{ animationDelay: "0.2s", opacity: 0 }}>
            <LanguageSelector value={language} onChange={setLanguage} />
          </div>

          {/* CEFR Level Selector */}
          <div className="animate-fade-in-up w-full" style={{ animationDelay: "0.25s", opacity: 0 }}>
            <p className="text-sm font-medium text-slate-600 mb-3">Your level</p>
            <RadioGroup value={level} onValueChange={setLevel} className="grid grid-cols-3 gap-2 w-full max-w-xs mx-auto">
              {cefrLevels.map((l) => (
                <Label
                  key={l.value}
                  htmlFor={`level-${l.value}`}
                  className={`flex flex-col items-center gap-0.5 rounded-lg border-2 p-2.5 cursor-pointer transition-all text-center ${
                    level === l.value
                      ? "border-teal-500 bg-teal-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <RadioGroupItem value={l.value} id={`level-${l.value}`} className="sr-only" />
                  <span className={`text-sm font-bold ${level === l.value ? "text-teal-600" : "text-slate-700"}`}>{l.label}</span>
                  <span className="text-[10px] text-slate-400 leading-tight">{l.desc}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* CTA */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.3s", opacity: 0 }}>
            <Button
              size="lg"
              onClick={start}
              className="gap-2 text-base px-8 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-200/50 hover:shadow-xl hover:shadow-teal-200/60 transition-all duration-300 hover:-translate-y-0.5"
            >
              <MessageCircle className="h-5 w-5" />
              Start Conversation
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Novatutor;
