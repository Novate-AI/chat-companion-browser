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
    iconBg: "bg-teal-500",
    cardBorder: "border-t-teal-400",
    hoverShadow: "hover:shadow-teal-200/60",
    accentText: "text-teal-600",
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
    iconBg: "bg-rose-500",
    cardBorder: "border-t-rose-400",
    hoverShadow: "hover:shadow-rose-200/60",
    accentText: "text-rose-600",
    delay: "0.1s",
  },
  {
    key: "novapatient",
    title: "NovaPatient",
    subtitle: "AI Patient for Clinical Practice",
    description:
      "Practice history taking with realistic AI patients. Ideal for medical students and doctors preparing for clinical examinations.",
    icon: Stethoscope,
    path: "/novapatient",
    iconBg: "bg-violet-500",
    cardBorder: "border-t-violet-400",
    hoverShadow: "hover:shadow-violet-200/60",
    accentText: "text-violet-600",
    delay: "0.2s",
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FAFAF8]">
      {/* Floating gradient blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-purple-300/40 to-pink-300/30 blur-[80px] animate-float" />
      <div
        className="absolute top-[20%] right-[-10%] w-[450px] h-[450px] rounded-full bg-gradient-to-br from-teal-300/35 to-cyan-200/25 blur-[80px] animate-float"
        style={{ animationDelay: "2s", animationDuration: "8s" }}
      />
      <div
        className="absolute bottom-[-5%] left-[30%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-orange-200/30 to-rose-300/25 blur-[80px] animate-float"
        style={{ animationDelay: "4s", animationDuration: "10s" }}
      />
      <div
        className="absolute bottom-[20%] right-[20%] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-violet-300/25 to-indigo-200/20 blur-[80px] animate-float"
        style={{ animationDelay: "1s", animationDuration: "7s" }}
      />

      {/* Subtle dot grid */}
      <div className="absolute inset-0 grid-pattern pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Hero */}
        <section className="flex flex-col items-center pt-24 md:pt-32 pb-16 px-4">
          {/* Logo */}
          <div
            className="mb-10 animate-fade-in-up"
            style={{ opacity: 0 }}
          >
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-white flex items-center justify-center logo-shadow">
              <img
                src={novateLogo}
                alt="Novate Persona"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-center leading-[0.95] mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s", opacity: 0 }}>
            <span className="text-slate-800">Novate</span>{" "}
            <span className="gradient-text">Persona</span>
          </h1>

          <p
            className="max-w-md text-center text-slate-500 text-base md:text-lg leading-relaxed animate-fade-in-up"
            style={{ animationDelay: "0.25s", opacity: 0 }}
          >
            AI-powered practice partners for language, exams &amp; clinical skills.
          </p>
        </section>

        {/* Product Cards */}
        <section className="max-w-5xl w-full mx-auto px-4 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.key}
                  onClick={() => navigate(p.path)}
                  className={`group cursor-pointer bg-white rounded-2xl border-t-4 ${p.cardBorder} shadow-lg ${p.hoverShadow} hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 animate-fade-in-up`}
                  style={{ animationDelay: p.delay, opacity: 0 }}
                >
                  <div className="p-6 md:p-8 flex flex-col h-full">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl ${p.iconBg} flex items-center justify-center mb-5 shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className={`text-xl font-bold text-slate-800 mb-1 ${p.accentText} transition-colors duration-300`}>
                      {p.title}
                    </h3>
                    <span className="text-xs font-medium text-slate-400 mb-3">
                      {p.subtitle}
                    </span>

                    {/* Description */}
                    <p className="text-sm text-slate-500 leading-relaxed flex-1">
                      {p.description}
                    </p>

                    {/* CTA */}
                    <div className="flex items-center gap-2 mt-5 text-sm font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">
                      <span>Get Started</span>
                      <ArrowRight className="w-4 h-4 group-hover:animate-bounce-right" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <footer className="text-center pb-8 px-4">
          <div className="inline-block">
            <span className="text-xs text-slate-400 tracking-wide">
              Built by{" "}
              <span className="gradient-text font-semibold">Novate</span>
            </span>
            <div className="h-px w-full mt-1 bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
          </div>
        </footer>
      </div>
    </main>
  );
};

export default Index;
