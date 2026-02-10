import { useNavigate } from "react-router-dom";
import { BookOpen, Mic, Stethoscope, ArrowRight } from "lucide-react";
import novateLogo from "@/assets/novate-persona-logo.png";

const products = [
  {
    key: "novatutor",
    title: "Novatutor",
    subtitle: "AI Language Tutor",
    description:
      "Practice any language through natural conversation. Get real-time corrections, translations, and adaptive difficulty.",
    icon: BookOpen,
    path: "/novatutor",
    glowColor: "from-teal-400 to-emerald-500",
    iconGlow: "shadow-teal-500/40",
    borderGlow: "hover:border-teal-500/50",
    iconBg: "bg-teal-500/15 text-teal-400",
    delay: "0s",
  },
  {
    key: "novaielts",
    title: "Nova IELTS",
    subtitle: "AI IELTS Speaking Coach",
    description:
      "Simulate the IELTS Speaking test with an AI examiner. Receive detailed band-score feedback on fluency, vocabulary, grammar and pronunciation.",
    icon: Mic,
    path: "/novaielts",
    glowColor: "from-rose-400 to-orange-500",
    iconGlow: "shadow-rose-500/40",
    borderGlow: "hover:border-rose-500/50",
    iconBg: "bg-rose-500/15 text-rose-400",
    delay: "0.15s",
  },
  {
    key: "novapatient",
    title: "NovaPatient",
    subtitle: "AI Patient for Clinical Practice",
    description:
      "Practice history taking with realistic AI patients. Ideal for medical students and doctors preparing for clinical examinations.",
    icon: Stethoscope,
    path: "/novapatient",
    glowColor: "from-violet-400 to-indigo-500",
    iconGlow: "shadow-violet-500/40",
    borderGlow: "hover:border-violet-500/50",
    iconBg: "bg-violet-500/15 text-violet-400",
    delay: "0.3s",
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0b14]">
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 animate-gradient-shift"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(120, 60, 200, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(60, 200, 180, 0.1) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(200, 60, 120, 0.08) 0%, transparent 50%)",
          backgroundSize: "200% 200%",
        }}
      />

      {/* Floating glow orbs */}
      <div className="absolute top-20 left-[15%] w-72 h-72 bg-purple-600/20 rounded-full blur-[120px] animate-float" />
      <div className="absolute bottom-32 right-[10%] w-96 h-96 bg-teal-500/15 rounded-full blur-[140px] animate-float" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: "4s" }} />

      {/* Content */}
      <div className="relative z-10">
        {/* Hero */}
        <section className="flex flex-col items-center pt-20 pb-14 px-4">
          <img
            src={novateLogo}
            alt="Novate Persona"
            className="w-28 h-28 md:w-36 md:h-36 object-contain mb-8 drop-shadow-[0_0_30px_rgba(139,92,246,0.3)]"
          />
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-center gradient-text leading-tight pb-1">
            Novate Persona
          </h1>
          <p className="mt-4 max-w-lg text-center text-slate-400 text-lg leading-relaxed">
            AI-powered practice partners for language, exams &amp; clinical skills.
            <br className="hidden sm:block" />
            Choose your persona and start learning.
          </p>
        </section>

        {/* Product Cards */}
        <section className="max-w-5xl mx-auto px-4 pb-24 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.key}
                onClick={() => navigate(p.path)}
                className={`group glass-card rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${p.borderGlow} animate-fade-in-up`}
                style={{ animationDelay: p.delay, opacity: 0 }}
              >
                {/* Top glow line */}
                <div className={`h-0.5 w-16 mb-6 rounded-full bg-gradient-to-r ${p.glowColor} opacity-80 group-hover:w-24 group-hover:opacity-100 transition-all duration-300`} />

                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${p.iconBg} shadow-lg ${p.iconGlow} group-hover:animate-glow-pulse`}>
                  <Icon className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-white/90 transition-colors">
                  {p.title}
                </h3>
                <p className="text-sm font-medium text-slate-400 mb-3">
                  {p.subtitle}
                </p>
                <p className="text-sm text-slate-500 leading-relaxed mb-5">
                  {p.description}
                </p>

                <div className="flex items-center gap-2 text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
                  Launch
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </section>

        {/* Footer */}
        <footer className="text-center pb-8 text-xs text-slate-600">
          © 2026 Novate Persona. All rights reserved.
        </footer>
      </div>
    </main>
  );
};

export default Index;
