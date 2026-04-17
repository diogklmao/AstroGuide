"use client";

import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/Navigation";
import MoonPhase from "@/components/MoonPhase";
import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  MapPin,
  Telescope,
  Sparkles,
} from "lucide-react";

// Mock events data
const mockEvents: Record<string, AstronomicalEvent> = {
  "2026-04-22": {
    id: "lyrids-2026",
    name: "Chuva de Meteoros Liridas",
    type: "meteor-shower",
    date: "22 de Abril de 2026",
    peakTime: "22:00 - 04:00",
    intensity: "Moderada (ate 20 meteoros/hora)",
    tips: "Encontre um local escuro, olhe para o leste apos a meia-noite, traga agasalhos.",
    description:
      "As Liridas sao uma das chuvas de meteoros mais antigas conhecidas, observadas ha mais de 2.700 anos.",
  },
  "2026-04-27": {
    id: "lyrids-end-2026",
    name: "Chuva de Meteoros Liridas",
    type: "meteor-shower",
    date: "27 de Abril de 2026",
    peakTime: "22:00 - 04:00",
    intensity: "Fraca (ultimos meteoros)",
    tips: "Ultima oportunidade para observar as Liridas deste ano.",
    description: "Fim da chuva de meteoros Liridas.",
  },
};

interface AstronomicalEvent {
  id: string;
  name: string;
  type: string;
  date: string;
  peakTime: string;
  intensity: string;
  tips: string;
  description: string;
}

interface DayData {
  day: number;
  phase: number;
  event?: AstronomicalEvent;
}

// Calculate moon phase for a given day (simplified)
function getMoonPhase(year: number, month: number, day: number): number {
  // Simplified lunar cycle calculation
  const date = new Date(year, month, day);
  const referenceNewMoon = new Date(2000, 0, 6); // Known new moon
  const daysSinceReference = Math.floor(
    (date.getTime() - referenceNewMoon.getTime()) / (1000 * 60 * 60 * 24)
  );
  const lunarCycle = 29.53059;
  const phase = (daysSinceReference % lunarCycle) / lunarCycle;
  return phase;
}

// Get days in month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Get first day of month (0 = Sunday)
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

export default function CalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 1)); // April 2026
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarData = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days: (DayData | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      days.push({
        day,
        phase: getMoonPhase(year, month, day),
        event: mockEvents[dateKey],
      });
    }

    return days;
  }, [year, month]);

  const nextEvent = useMemo(() => {
    const today = new Date();
    const events = Object.entries(mockEvents)
      .filter(([date]) => new Date(date) >= today)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());
    return events[0]?.[1];
  }, []);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (dayData: DayData) => {
    setSelectedDay(dayData);
    if (dayData.event) {
      setShowEventModal(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 relative z-10 container mx-auto px-4 py-8">
        {/* Page Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            <span className="gradient-text-orange">AstroGuide</span> Lunar
            Calendar & Events
          </h1>
          <p className="text-muted">Observatorio Digital</p>
        </motion.div>

        {/* Month Navigation */}
        <motion.div
          className="flex items-center justify-center gap-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.button
            onClick={goToPrevMonth}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-secondary"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft size={32} />
          </motion.button>

          <h2 className="text-2xl md:text-3xl font-semibold gradient-text-cyan min-w-[200px] text-center">
            {monthNames[month]} {year}
          </h2>

          <motion.button
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-secondary"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight size={32} />
          </motion.button>
        </motion.div>

        {/* Calendar Grid */}
        <motion.div
          className="glass-card p-4 md:p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarData.map((dayData, index) => (
              <motion.div
                key={index}
                className={`aspect-square relative ${
                  dayData ? "cursor-pointer" : ""
                }`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.01 }}
              >
                {dayData && (
                  <motion.div
                    className={`w-full h-full rounded-xl p-2 flex flex-col items-center justify-center gap-1 transition-all ${
                      dayData.event
                        ? "event-card"
                        : "glass-card hover:bg-white/10"
                    } ${
                      selectedDay?.day === dayData.day
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                    onClick={() => handleDayClick(dayData)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Day number */}
                    <span className="text-xs font-medium text-muted absolute top-1 left-2">
                      {dayData.day}
                    </span>

                    {/* Event indicator */}
                    {dayData.event && (
                      <Sparkles
                        size={12}
                        className="absolute top-1 right-2 text-accent"
                      />
                    )}

                    {/* Moon phase */}
                    <div className="flex-1 flex items-center justify-center">
                      <MoonPhase
                        phase={dayData.phase}
                        size={40}
                        showGlow={false}
                      />
                    </div>

                    {/* Event name (if exists) */}
                    {dayData.event && (
                      <span className="text-[9px] text-center text-secondary line-clamp-2 leading-tight px-1">
                        {dayData.event.name}
                      </span>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Next Event Card */}
        {nextEvent && (
          <motion.div
            className="event-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex flex-col md:flex-row gap-6">
              {/* Event image placeholder */}
              <div className="w-full md:w-64 h-40 rounded-xl bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 flex items-center justify-center overflow-hidden relative">
                {/* Animated meteor effect */}
                <div className="absolute inset-0">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-8 bg-gradient-to-b from-white to-transparent rounded-full"
                      style={{
                        left: `${20 + i * 15}%`,
                        top: `${10 + i * 10}%`,
                        transform: "rotate(45deg)",
                      }}
                      animate={{
                        opacity: [0, 1, 0],
                        y: [0, 100],
                        x: [0, 50],
                      }}
                      transition={{
                        duration: 1.5,
                        delay: i * 0.3,
                        repeat: Infinity,
                        repeatDelay: 2,
                      }}
                    />
                  ))}
                </div>
                <Sparkles size={48} className="text-white/50" />
              </div>

              {/* Event details */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-primary">
                    Proximo Evento
                  </span>
                </div>

                <h3 className="text-xl font-bold text-foreground mb-4">
                  {nextEvent.name}
                </h3>

                <div className="space-y-2 text-sm">
                  <p className="text-muted">
                    <strong className="text-foreground">Data:</strong>{" "}
                    {nextEvent.date}
                  </p>
                  <p className="text-muted">
                    <strong className="text-foreground">Horario de Pico:</strong>{" "}
                    {nextEvent.peakTime}
                  </p>
                  <p className="text-muted">
                    <strong className="text-foreground">Intensidade:</strong>{" "}
                    {nextEvent.intensity}
                  </p>
                  <p className="text-muted">
                    <strong className="text-foreground">
                      Dicas de Observacao:
                    </strong>{" "}
                    {nextEvent.tips}
                  </p>
                </div>

                {/* Quick action buttons */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/20 text-secondary text-xs font-medium hover:bg-secondary/30 transition-colors">
                    <Clock size={14} />
                    Horarios
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/20 text-accent text-xs font-medium hover:bg-accent/30 transition-colors">
                    <MapPin size={14} />
                    Localizacao
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition-colors">
                    <Telescope size={14} />
                    Equipamento
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Event Modal */}
        <AnimatePresence>
          {showEventModal && selectedDay?.event && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEventModal(false)}
            >
              <motion.div
                className="glass-card p-6 max-w-lg w-full relative"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/10 transition-colors"
                  onClick={() => setShowEventModal(false)}
                >
                  <X size={20} className="text-muted" />
                </button>

                <h3 className="text-xl font-bold text-foreground mb-4">
                  {selectedDay.event.name}
                </h3>

                <div className="space-y-3 text-sm">
                  <p className="text-muted">
                    <strong className="text-foreground">Data:</strong>{" "}
                    {selectedDay.event.date}
                  </p>
                  <p className="text-muted">
                    <strong className="text-foreground">Horario de Pico:</strong>{" "}
                    {selectedDay.event.peakTime}
                  </p>
                  <p className="text-muted">
                    <strong className="text-foreground">Intensidade:</strong>{" "}
                    {selectedDay.event.intensity}
                  </p>
                  <p className="text-muted leading-relaxed">
                    {selectedDay.event.description}
                  </p>
                  <p className="text-muted">
                    <strong className="text-foreground">Dicas:</strong>{" "}
                    {selectedDay.event.tips}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
