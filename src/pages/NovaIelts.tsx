import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LingbotAvatar } from "@/components/LingbotAvatar";
import { Mic, ArrowLeft, Sparkles } from "lucide-react";

const NovaIelts = () => {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FAFAF8]">
      {/* Floating gradient blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-rose-300/40 to-pink-200/30 blur-[80px] animate-float" />
      <div
        className="absolute bottom-[-5%] left-[-5%] w-[350px] h-[350px] rounded-full bg-gradient-to-br from-orange-300/30 to-rose-200/25 blur-[80px] animate-float"
        style={{ animationDelay: "2s", animationDuration: "8s" }}
      />
      <div
        className="absolute top-[40%] left-[60%] w-[250px] h-[250px] rounded-full bg-gradient-to-br from-red-200/25 to-pink-200/20 blur-[80px] animate-float"
        style={{ animationDelay: "3s", animationDuration: "9s" }}
      />

      <div className="absolute inset-0 grid-pattern pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen items-center justify-center px-4">
        <Button
          variant="ghost"
          className="absolute top-4 left-4 gap-1 text-slate-500 hover:text-slate-800"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="flex flex-col items-center gap-8 text-center max-w-md">
          <div className="animate-fade-in-up" style={{ opacity: 0 }}>
            <div className="rounded-full p-1 bg-gradient-to-br from-rose-400 to-pink-400 shadow-lg shadow-rose-200/50">
              <div className="rounded-full overflow-hidden bg-white">
                <LingbotAvatar />
              </div>
            </div>
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s", opacity: 0 }}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-rose-500" />
              <span className="text-xs font-semibold tracking-widest uppercase text-rose-600">
                AI IELTS Examiner
              </span>
              <Sparkles className="w-5 h-5 text-rose-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-800">
              Nova<span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-pink-500">IELTS</span>
            </h1>
            <p className="mt-3 text-slate-500 text-lg leading-relaxed">
              Full IELTS Speaking test simulation with Parts 1, 2 and 3. Get band score feedback instantly.
            </p>
          </div>

          <div className="animate-fade-in-up text-left bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-rose-100 text-sm text-slate-600 space-y-1.5" style={{ animationDelay: "0.2s", opacity: 0 }}>
            <p><strong className="text-slate-800">Part 1:</strong> 12 questions on everyday topics (15-20s each)</p>
            <p><strong className="text-slate-800">Part 2:</strong> 1 min prep + 2 min speaking on a cue card</p>
            <p><strong className="text-slate-800">Part 3:</strong> 6 discussion questions (20-25s each)</p>
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: "0.3s", opacity: 0 }}>
            <Button
              size="lg"
              onClick={() => navigate("/ielts-chat")}
              className="gap-2 text-base px-8 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg shadow-rose-200/50 hover:shadow-xl hover:shadow-rose-200/60 transition-all duration-300 hover:-translate-y-0.5"
            >
              <Mic className="h-5 w-5" />
              Start Practice Test
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default NovaIelts;
