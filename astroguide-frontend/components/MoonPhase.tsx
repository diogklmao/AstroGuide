"use client";

import { motion } from "framer-motion";

interface MoonPhaseProps {
  phase: number; // 0 = new moon, 0.5 = full moon, 1 = new moon
  size?: number;
  showGlow?: boolean;
}

export default function MoonPhase({
  phase,
  size = 80,
  showGlow = true,
}: MoonPhaseProps) {
  // Normalize phase to 0-1 range
  const normalizedPhase = ((phase % 1) + 1) % 1;

  // Calculate shadow position based on phase
  // Phase 0 = new moon (fully dark)
  // Phase 0.25 = first quarter (right half lit)
  // Phase 0.5 = full moon (fully lit)
  // Phase 0.75 = last quarter (left half lit)

  const getShadowStyle = () => {
    if (normalizedPhase < 0.03 || normalizedPhase > 0.97) {
      // New moon - fully dark
      return {
        background: "rgba(0, 0, 0, 0.95)",
        clipPath: "circle(50% at 50% 50%)",
      };
    } else if (normalizedPhase < 0.25) {
      // Waxing crescent
      const progress = normalizedPhase / 0.25;
      const xOffset = 100 - progress * 50;
      return {
        background: "rgba(0, 0, 0, 0.9)",
        clipPath: `ellipse(${50 - progress * 25}% 50% at ${xOffset}% 50%)`,
      };
    } else if (normalizedPhase < 0.5) {
      // First quarter to full
      const progress = (normalizedPhase - 0.25) / 0.25;
      return {
        background: "rgba(0, 0, 0, 0.9)",
        clipPath: `ellipse(${25 - progress * 25}% 50% at ${50 - progress * 50}% 50%)`,
      };
    } else if (normalizedPhase < 0.53) {
      // Full moon - minimal shadow
      return {
        background: "transparent",
        clipPath: "circle(0% at 50% 50%)",
      };
    } else if (normalizedPhase < 0.75) {
      // Waning gibbous
      const progress = (normalizedPhase - 0.5) / 0.25;
      return {
        background: "rgba(0, 0, 0, 0.9)",
        clipPath: `ellipse(${progress * 25}% 50% at ${progress * 50}% 50%)`,
      };
    } else {
      // Last quarter to new
      const progress = (normalizedPhase - 0.75) / 0.25;
      const xOffset = 50 + progress * 50;
      return {
        background: "rgba(0, 0, 0, 0.9)",
        clipPath: `ellipse(${25 + progress * 25}% 50% at ${xOffset}% 50%)`,
      };
    }
  };

  const shadowStyle = getShadowStyle();
  const isFullMoon = normalizedPhase > 0.47 && normalizedPhase < 0.53;

  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Glow effect for fuller phases */}
      {showGlow && normalizedPhase > 0.3 && normalizedPhase < 0.7 && (
        <div
          className="absolute inset-0 rounded-full blur-xl"
          style={{
            background: `radial-gradient(circle, rgba(200, 200, 220, ${0.3 * (1 - Math.abs(normalizedPhase - 0.5) * 4)}) 0%, transparent 70%)`,
            transform: "scale(1.5)",
          }}
        />
      )}

      {/* Moon surface */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          background: isFullMoon
            ? "radial-gradient(circle at 35% 35%, #f5f5f5 0%, #e0e0e0 30%, #c0c0c0 60%, #a0a0a0 100%)"
            : "radial-gradient(circle at 35% 35%, #e8e8e8 0%, #d0d0d0 30%, #b0b0b0 60%, #909090 100%)",
          boxShadow: isFullMoon
            ? "inset -2px -2px 10px rgba(0,0,0,0.3), inset 2px 2px 10px rgba(255,255,255,0.3)"
            : "inset -2px -2px 8px rgba(0,0,0,0.2), inset 2px 2px 8px rgba(255,255,255,0.2)",
        }}
      >
        {/* Moon craters/texture */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 25% 30%, rgba(180,180,180,0.3) 0%, transparent 15%),
              radial-gradient(circle at 60% 20%, rgba(170,170,170,0.25) 0%, transparent 12%),
              radial-gradient(circle at 70% 60%, rgba(160,160,160,0.3) 0%, transparent 18%),
              radial-gradient(circle at 35% 70%, rgba(175,175,175,0.25) 0%, transparent 10%),
              radial-gradient(circle at 50% 45%, rgba(165,165,165,0.2) 0%, transparent 8%)
            `,
          }}
        />

        {/* Shadow overlay */}
        <div
          className="absolute inset-0 transition-all duration-500"
          style={shadowStyle}
        />
      </div>
    </motion.div>
  );
}
