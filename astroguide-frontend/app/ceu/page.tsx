"use client";

import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import CelestialCard from "@/components/CelestialCard";
import PlanetCard from "@/components/PlanetCard";
import { useState, useEffect } from "react";

// Mock data - Replace with your actual API calls
const mockSkyData = {
  sun: {
    altitude: 41.77,
    azimuth: 243.14,
    distance: "1.0038 UA (150,173,593 km)",
    visible: true,
  },
  moon: {
    altitude: 44.58,
    azimuth: 247.02,
    distance: "359,284 km",
    visible: true,
    phase: 0.35, // 0 = new moon, 0.5 = full moon, 1 = new moon
  },
  planets: [
    { name: "Mercurio", altitude: 18.67, azimuth: 251.39, visible: true },
    { name: "Venus", altitude: 62.34, azimuth: 220.9, visible: true },
    { name: "Marte", altitude: 21.57, azimuth: 252.1, visible: true },
    { name: "Jupiter", altitude: 51.47, azimuth: 105.91, visible: true },
    { name: "Saturno", altitude: -12.3, azimuth: 45.67, visible: false },
    { name: "Urano", altitude: 8.45, azimuth: 180.23, visible: true },
    { name: "Netuno", altitude: -5.67, azimuth: 210.45, visible: false },
  ],
};

export default function CeuPage() {
  const [skyData, setSkyData] = useState(mockSkyData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call - Replace with your actual API
    const fetchSkyData = async () => {
      try {
        // const response = await fetch('/api/ceu');
        // const data = await response.json();
        // setSkyData(data);
        
        // Using mock data for now
        setTimeout(() => {
          setSkyData(mockSkyData);
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error("Error fetching sky data:", error);
        setIsLoading(false);
      }
    };

    fetchSkyData();
    
    // Refresh every minute
    const interval = setInterval(fetchSkyData, 60000);
    return () => clearInterval(interval);
  }, []);

  const visiblePlanets = skyData.planets.filter((p) => p.visible);
  const hiddenPlanets = skyData.planets.filter((p) => !p.visible);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 relative z-10 container mx-auto px-4 py-8">
        {/* Page Title */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Ceu Agora
          </h1>
          <p className="text-muted">
            Posicao atual dos corpos celestes visiveis da sua localizacao
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Sun and Moon Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <CelestialCard
                type="sun"
                altitude={skyData.sun.altitude}
                azimuth={skyData.sun.azimuth}
                distance={skyData.sun.distance}
                visible={skyData.sun.visible}
              />
              <CelestialCard
                type="moon"
                altitude={skyData.moon.altitude}
                azimuth={skyData.moon.azimuth}
                distance={skyData.moon.distance}
                visible={skyData.moon.visible}
                phase={skyData.moon.phase}
              />
            </div>

            {/* Planets Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                <span className="w-8 h-1 bg-gradient-to-r from-primary to-orange-400 rounded-full" />
                Planetas
              </h2>

              {/* Visible Planets */}
              {visiblePlanets.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-success mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-success rounded-full" />
                    Visiveis agora ({visiblePlanets.length})
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {visiblePlanets.map((planet, index) => (
                      <PlanetCard
                        key={planet.name}
                        name={planet.name}
                        altitude={planet.altitude}
                        azimuth={planet.azimuth}
                        visible={planet.visible}
                        index={index}
                        color=""
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Hidden Planets */}
              {hiddenPlanets.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-muted rounded-full" />
                    Abaixo do horizonte ({hiddenPlanets.length})
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 opacity-60">
                    {hiddenPlanets.map((planet, index) => (
                      <PlanetCard
                        key={planet.name}
                        name={planet.name}
                        altitude={planet.altitude}
                        azimuth={planet.azimuth}
                        visible={planet.visible}
                        index={visiblePlanets.length + index}
                        color=""
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Legend */}
            <motion.div
              className="mt-12 glass-card p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Legenda
              </h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-muted">
                    <strong className="text-foreground">Altitude:</strong> Angulo
                    acima do horizonte
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-secondary" />
                  <span className="text-muted">
                    <strong className="text-foreground">Azimute:</strong> Direcao
                    a partir do Norte
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className="text-muted">
                    <strong className="text-foreground">Visivel:</strong> Acima
                    do horizonte
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-muted">
                    <strong className="text-foreground">Nao visivel:</strong>{" "}
                    Abaixo do horizonte
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
