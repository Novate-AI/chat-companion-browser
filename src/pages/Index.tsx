import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BookOpen, Mic, Stethoscope } from "lucide-react";
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
    gradient: "from-teal-500 to-emerald-400",
    iconBg: "bg-teal-500/10 text-teal-600",
  },
  {
    key: "novaielts",
    title: "Nova IELTS",
    subtitle: "AI IELTS Speaking Coach",
    description:
      "Simulate the IELTS Speaking test with an AI examiner. Receive detailed band-score feedback on fluency, vocabulary, grammar and pronunciation.",
    icon: Mic,
    path: "/novaielts",
    gradient: "from-rose-500 to-orange-400",
    iconBg: "bg-rose-500/10 text-rose-600",
  },
  {
    key: "novapatient",
    title: "NovaPatient",
    subtitle: "AI Patient for Clinical Practice",
    description:
      "Practice history taking with realistic AI patients. Ideal for medical students and doctors preparing for clinical examinations.",
    icon: Stethoscope,
    path: "/novapatient",
    gradient: "from-violet-500 to-indigo-400",
    iconBg: "bg-violet-500/10 text-violet-600",
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Hero Section */}
      <section className="flex flex-col items-center pt-16 pb-10 px-4">
        <img
          src={novateLogo}
          alt="Novate Persona"
          className="w-28 h-28 md:w-36 md:h-36 object-contain drop-shadow-lg mb-6"
        />
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 text-center">
          Novate Persona
        </h1>
        <p className="mt-3 max-w-lg text-center text-slate-500 text-lg leading-relaxed">
          AI-powered practice partners for language, exams &amp; clinical skills.
          Choose your persona and start learning.
        </p>
      </section>

      {/* Product Cards */}
      <section className="max-w-5xl mx-auto px-4 pb-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => {
          const Icon = p.icon;
          return (
            <Card
              key={p.key}
              onClick={() => navigate(p.path)}
              className="group relative cursor-pointer overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white"
            >
              {/* Top gradient bar */}
              <div
                className={`h-1.5 w-full bg-gradient-to-r ${p.gradient}`}
              />

              <CardHeader className="pb-2 pt-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${p.iconBg}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                  {p.title}
                </CardTitle>
                <CardDescription className="text-sm font-medium text-teal-600 mt-0.5">
                  {p.subtitle}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {p.description}
                </p>

                <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-teal-600 group-hover:gap-2.5 transition-all">
                  Get started
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Footer */}
      <footer className="text-center pb-8 text-xs text-slate-400">
        © 2026 Novate Persona. All rights reserved.
      </footer>
    </main>
  );
};

export default Index;
