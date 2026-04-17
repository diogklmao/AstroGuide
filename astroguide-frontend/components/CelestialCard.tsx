"use client";

import { motion } from "framer-motion";
import CircularGauge from "./CircularGauge";
import MoonPhase from "./MoonPhase";
import { Check, X, Sun as SunIcon, Moon as MoonIcon } from "lucide-react";

interface CelestialCardProps {
  type: "sun" | "moon";
  altitude: number;
  azimuth: number;
  distance: string;
  visible: boolean;
  phase?: number; // Only for moon
}

export default function CelestialCard({
  type,
  altitude,
  azimuth,
  distance,
  visible,
  phase = 0.5,
}: CelestialCardProps) {
  const isSun = type === "sun";

  return (
    <motion.div
      className={`glass-card p-6 relative overflow-hidden ${
        isSun ? "glow-orange" : "glow-cyan"
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={{ scale: 1.01 }}
    >
      {/* Background gradient accent */}
      <div
        className="absolute top-0 right-0 w-64 h-64 opacity-20 blur-3xl pointer-events-none"
        style={{
          background: isSun
            ? "radial-gradient(circle, #f97316 0%, transparent 70%)"
            : "radial-gradient(circle, #06b6d4 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        {isSun ? (
          <SunIcon className="w-6 h-6 text-primary" />
        ) : (
          <MoonIcon className="w-6 h-6 text-secondary" />
        )}
        <h2
          className={`text-2xl font-bold ${
            isSun ? "gradient-text-orange" : "gradient-text-cyan"
          }`}
        >
          {isSun ? "Sol" : "Lua"}
        </h2>
      </div>

      {/* Content */}
      <div className="flex items-center gap-6">
        {/* Celestial body visualization */}
        <div className="flex-shrink-0">
          {isSun ? (
            <motion.div
              className="w-28 h-28 rounded-full relative"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, #fcd34d 0%, #f97316 40%, #ea580c 70%, #c2410c 100%)",
                boxShadow:
                  "0 0 60px rgba(249, 115, 22, 0.5), 0 0 100px rgba(249, 115, 22, 0.3), inset -8px -8px 20px rgba(194, 65, 12, 0.5)",
              }}
              animate={{
                boxShadow: [
                  "0 0 60px rgba(249, 115, 22, 0.5), 0 0 100px rgba(249, 115, 22, 0.3)",
                  "0 0 80px rgba(249, 115, 22, 0.6), 0 0 120px rgba(249, 115, 22, 0.4)",
                  "0 0 60px rgba(249, 115, 22, 0.5), 0 0 100px rgba(249, 115, 22, 0.3)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {/* Sun corona effect */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.3) 0%, transparent 50%)",
                }}
              />
            </motion.div>
          ) : (
            <MoonPhase phase={phase} size={112} />
          )}
        </div>

        {/* Gauges */}
        <div className="flex gap-6">
          <CircularGauge
            value={altitude}
            max={90}
            label="Altitude"
            color={isSun ? "orange" : "cyan"}
          />
          <CircularGauge
            value={azimuth}
            max={360}
            label="Azimute"
            color={isSun ? "orange" : "cyan"}
          />
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-sm">
        <div className="text-muted">
          <span className="font-medium text-foreground">Distancia:</span>{" "}
          {distance}
        </div>
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${
            visible
              ? "bg-success/20 text-success"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {visible ? <Check size={14} /> : <X size={14} />}
          <span className="font-medium">
            {visible ? "Visivel" : "Nao visivel"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
