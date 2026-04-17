"use client";

import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import { ArrowRight, Sun, Moon, Calendar, Star, Sparkles } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const features = [
    {
      icon: Sun,
      title: "Ceu Agora",
      description:
        "Veja a posicao atual do Sol, Lua e planetas com dados em tempo real",
      href: "/ceu",
      color: "orange",
    },
    {
      icon: Calendar,
      title: "Calendario Lunar",
      description:
        "Acompanhe as fases da lua e eventos astronomicos do mes",
      href: "/calendario",
      color: "cyan",
    },
    {
      icon: Star,
      title: "Eventos Especiais",
      description:
        "Chuvas de meteoros, eclipses e outros fenomenos celestes",
      href: "/calendario",
      color: "purple",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center justify-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-muted uppercase tracking-wider">
                  Observatorio Digital
                </span>
                <Sparkles className="w-5 h-5 text-primary" />
              </div>

              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                <span className="gradient-text-orange">Astro</span>
                <span className="text-foreground">Guide</span>
              </h1>

              <p className="text-xl text-muted mb-8 leading-relaxed">
                Explore o universo a partir da sua localizacao. Acompanhe o ceu
                em tempo real, descubra eventos astronomicos e nunca perca um
                fenomeno celeste.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/ceu">
                  <motion.button
                    className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-orange-400 rounded-xl font-semibold text-white shadow-lg shadow-primary/25"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Sun className="w-5 h-5" />
                    Ver Ceu Agora
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>

                <Link href="/calendario">
                  <motion.button
                    className="group flex items-center gap-2 px-8 py-4 glass-card font-semibold text-foreground hover:bg-white/10 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Moon className="w-5 h-5" />
                    Calendario Lunar
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Link key={feature.title} href={feature.href}>
                <motion.div
                  className="glass-card p-6 h-full cursor-pointer group"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.6 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
                      feature.color === "orange"
                        ? "bg-primary/20"
                        : feature.color === "cyan"
                          ? "bg-secondary/20"
                          : "bg-accent/20"
                    }`}
                  >
                    <feature.icon
                      className={`w-7 h-7 ${
                        feature.color === "orange"
                          ? "text-primary"
                          : feature.color === "cyan"
                            ? "text-secondary"
                            : "text-accent"
                      }`}
                    />
                  </div>

                  <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-muted leading-relaxed">
                    {feature.description}
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Explorar</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 py-16">
          <motion.div
            className="glass-card p-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: "8", label: "Planetas" },
                { value: "12+", label: "Chuvas de Meteoros/Ano" },
                { value: "29.5", label: "Dias do Ciclo Lunar" },
                { value: "24/7", label: "Dados em Tempo Real" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <div className="text-3xl font-bold gradient-text-orange mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted">
            <p>2026 AstroGuide - Observatorio Digital</p>
            <p>Dados astronomicos atualizados em tempo real</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
