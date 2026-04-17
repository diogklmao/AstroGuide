"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Sun, Calendar, Settings, MapPin, Clock } from "lucide-react";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/ceu", label: "Ceu Agora", icon: Sun },
  { href: "/calendario", label: "Calendario", icon: Calendar },
];

export default function Navigation() {
  const pathname = usePathname();
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("pt-PT", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setCurrentDate(
        now.toLocaleDateString("pt-PT", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="relative z-50 w-full">
      <div className="glass-card mx-4 mt-4 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <motion.div
              className="text-2xl font-bold gradient-text-orange"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              AstroGuide
            </motion.div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    className={`nav-item flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? "active bg-white/10 text-foreground"
                        : "text-muted hover:text-foreground hover:bg-white/5"
                    }`}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon size={18} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* Location & Time */}
          <div className="hidden lg:flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-muted">
              <MapPin size={16} className="text-primary" />
              <span>Vila Nova de Gaia, 41.13N, 8.66W</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Clock size={16} className="text-secondary" />
              <span>
                {currentDate} {currentTime}
              </span>
            </div>
          </div>

          {/* Settings */}
          <motion.button
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.3 }}
          >
            <Settings size={20} className="text-muted" />
          </motion.button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex md:hidden items-center justify-center gap-2 mt-4 pt-4 border-t border-border">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? "bg-white/10 text-foreground"
                      : "text-muted hover:text-foreground"
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon size={20} />
                  <span className="text-xs">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
