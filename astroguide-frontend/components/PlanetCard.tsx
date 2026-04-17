"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

interface PlanetCardProps {
  name: string;
  altitude: number;
  azimuth: number;
  visible: boolean;
  index: number;
  color: string;
  planetImage?: string;
}

const planetColors: Record<string, { gradient: string; glow: string }> = {
  Mercurio: {
    gradient: "linear-gradient(135deg, #a0a0a0 0%, #707070 50%, #505050 100%)",
    glow: "rgba(160, 160, 160, 0.3)",
  },
  Venus: {
    gradient: "linear-gradient(135deg, #f4d03f 0%, #e59866 50%, #d35400 100%)",
    glow: "rgba(244, 208, 63, 0.3)",
  },
  Marte: {
    gradient: "linear-gradient(135deg, #e74c3c 0%, #c0392b 50%, #922b21 100%)",
    glow: "rgba(231, 76, 60, 0.3)",
  },
  Jupiter: {
    gradient: "linear-gradient(135deg, #f5cba7 0%, #d4a574 30%, #a67c52 60%, #8b5e3c 100%)",
    glow: "rgba(245, 203, 167, 0.3)",
  },
  Saturno: {
    gradient: "linear-gradient(135deg, #f7dc6f 0%, #d4ac0d 50%, #9a7d0a 100%)",
    glow: "rgba(247, 220, 111, 0.3)",
  },
  Urano: {
    gradient: "linear-gradient(135deg, #85c1e9 0%, #5dade2 50%, #3498db 100%)",
    glow: "rgba(133, 193, 233, 0.3)",
  },
  Netuno: {
    gradient: "linear-gradient(135deg, #5499c7 0%, #2980b9 50%, #1a5276 100%)",
    glow: "rgba(84, 153, 199, 0.3)",
  },
};

export default function PlanetCard({
  name,
  altitude,
  azimuth,
  visible,
  index,
}: PlanetCardProps) {
  const colors = planetColors[name] || {
    gradient: "linear-gradient(135deg, #666 0%, #444 100%)",
    glow: "rgba(100, 100, 100, 0.3)",
  };

  return (
    <motion.div
      className="glass-card p-4 flex items-center gap-4 cursor-pointer group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      {/* Index badge */}
      <div className="absolute top-2 left-2 w-5 h-5 rounded bg-white/10 flex items-center justify-center text-xs font-medium text-muted">
        {index + 1}
      </div>

      {/* Planet sphere */}
      <div className="relative flex-shrink-0">
        <motion.div
          className="w-16 h-16 rounded-full"
          style={{
            background: colors.gradient,
            boxShadow: `0 4px 20px ${colors.glow}, inset -4px -4px 10px rgba(0,0,0,0.3), inset 2px 2px 10px rgba(255,255,255,0.2)`,
          }}
          animate={{
            boxShadow: visible
              ? [
                  `0 4px 20px ${colors.glow}`,
                  `0 4px 30px ${colors.glow}`,
                  `0 4px 20px ${colors.glow}`,
                ]
              : `0 4px 15px rgba(0,0,0,0.3)`,
          }}
          transition={{ duration: 2, repeat: visible ? Infinity : 0 }}
        >
          {/* Jupiter bands */}
          {name === "Jupiter" && (
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div
                className="absolute w-full h-2 bg-gradient-to-r from-transparent via-orange-700/40 to-transparent"
                style={{ top: "30%" }}
              />
              <div
                className="absolute w-full h-1.5 bg-gradient-to-r from-transparent via-orange-800/30 to-transparent"
                style={{ top: "50%" }}
              />
              <div
                className="absolute w-full h-2 bg-gradient-to-r from-transparent via-orange-700/35 to-transparent"
                style={{ top: "65%" }}
              />
              {/* Great Red Spot */}
              <div
                className="absolute w-3 h-2 rounded-full bg-red-700/60"
                style={{ top: "45%", left: "60%" }}
              />
            </div>
          )}

          {/* Saturn rings */}
          {name === "Saturno" && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ transform: "rotateX(70deg)" }}
            >
              <div
                className="absolute w-24 h-24 rounded-full border-4 border-amber-300/30"
                style={{ borderWidth: "3px" }}
              />
              <div
                className="absolute w-28 h-28 rounded-full border-2 border-amber-200/20"
                style={{ borderWidth: "2px" }}
              />
            </div>
          )}
        </motion.div>
      </div>

      {/* Planet info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground text-lg">{name}</h3>
        <div className="text-sm text-muted space-y-0.5">
          <p>
            Alt: <span className="text-foreground">{altitude.toFixed(2)}°</span>
          </p>
          <p>
            Az: <span className="text-foreground">{azimuth.toFixed(2)}°</span>
          </p>
        </div>
      </div>

      {/* Visibility indicator */}
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
          visible
            ? "bg-success/20 text-success"
            : "bg-red-500/20 text-red-400"
        }`}
      >
        {visible ? <Check size={14} /> : <X size={14} />}
        <span>{visible ? "Visivel" : "Nao visivel"}</span>
      </div>
    </motion.div>
  );
}
