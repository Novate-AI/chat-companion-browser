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
    accent: "teal",
    borderColor: "border-l-teal-400",
    iconBg: "bg-teal-500/15 text-teal-400 shadow-teal-500/30",
    hoverBorder: "group-hover:border-l-teal-400",
    hoverText: "group-hover:text-teal-400",
    glowColor: "group-hover:shadow-[0_0_30px_rgba(45,212,191,0.15)]",
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
    accent: "rose",
    borderColor: "border-l-rose-400",
    iconBg: "bg-rose-500/15 text-rose-400 shadow-rose-500/30",
    hoverBorder: "group-hover:border-l-rose-400",
    hoverText: "group-hover:text-rose-400",
    glowColor: "group-hover:shadow-[0_0_30px_rgba(251,113,133,0.15)]",
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
    accent: "violet",
    borderColor: "border-l-violet-400",
    iconBg: "bg-violet-500/15 text-violet-400 shadow-violet-500/30",
    hoverBorder: "group-hover:border-l-violet-400",
    hoverText: "group-hover:text-violet-400",
    glowColor: "group-hover:shadow-[0_0_30px_rgba(167,139,250,0.15)]",
    delay: "0.2s",
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#06070e] noise-overlay">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 grid-pattern pointer-events-none" />

      {/* Ambient glow - very subtle */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-600/[0.07] rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-teal-500/[0.05] rounded-full blur-[120px]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Hero */}
        <section className="flex flex-col items-center pt-24 md:pt-32 pb-20 px-4">
          {/* Logo with glow ring */}
          <div className="relative mb-10">
            <div className="absolute inset-0 rounded-full glow-ring" />
            <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-[#06070e] flex items-center justify-center ring-1 ring-white/10">
              <img
                src={novateLogo}
                alt="Novate Persona"
                className="w-full h-full object-contain logo-blend"
              />
            </div>
          </div>

          {/* Heading with word accents */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-center leading-[0.95] mb-6">
            <span className="text-white">Novate</span>{" "}
            <span className="gradient-text">Persona</span>
          </h1>

          <p className="max-w-md text-center text-slate-500 text-base md:text-lg leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
            AI-powered practice partners for language, exams &amp; clinical skills.
          </p>
        </section>

        {/* Product Panels */}
        <section className="max-w-3xl w-full mx-auto px-4 pb-24 flex flex-col gap-px">
          {products.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.key}
                onClick={() => navigate(p.path)}
                className={`group glass-card cursor-pointer border-l-2 border-l-transparent ${p.hoverBorder} transition-all duration-500 ${p.glowColor} animate-fade-in-up`}
                style={{ animationDelay: p.delay, opacity: 0 }}
              >
                <div className="flex items-center gap-4 md:gap-6 px-6 py-5 md:px-8 md:py-6">
                  {/* Icon */}
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center shrink-0 ${p.iconBg} shadow-lg transition-all duration-300`}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className={`text-lg md:text-xl font-bold text-white/90 ${p.hoverText} transition-colors duration-300`}>
                        {p.title}
                      </h3>
                      <span className="text-xs text-slate-600 hidden sm:inline">
                        {p.subtitle}
                      </span>
                    </div>
                    {/* Description - reveals on hover */}
                    <div className="max-h-0 overflow-hidden opacity-0 group-hover:max-h-20 group-hover:opacity-100 transition-all duration-500 ease-out">
                      <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                        {p.description}
                      </p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-white/70 group-hover:translate-x-1 transition-all duration-300 shrink-0" />
                </div>
              </div>
            );
          })}
        </section>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <footer className="text-center pb-8 px-4">
          <div className="inline-block">
            <span className="text-xs text-slate-600 tracking-wide">
              Built by <span className="gradient-text font-medium">Novate</span>
            </span>
            <div className="h-px w-full mt-1 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
          </div>
        </footer>
      </div>
    </main>
  );
};

export default Index;
