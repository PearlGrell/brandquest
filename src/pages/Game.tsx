import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StarField from "@/components/StarField";
import Navbar from "@/components/Navbar";
import Level1 from "@/components/game/Level1";
import Level2 from "@/components/game/Level2";
import Level3 from "@/components/game/Level3";
import { Rocket, Check, Sparkles, ArrowRight } from "lucide-react";
import { isGameCompleted, markGameCompleted, getCompletedGames } from "@/lib/gameCompletion";
import { markGameComplete } from "@/lib/apiClient";
import { Link } from "react-router-dom";

const GamePage = () => {
  const [level, setLevel] = useState<number | null>(() => {
    const saved = localStorage.getItem("celestio_game_level");
    return null;
  });

  const sessionData = localStorage.getItem("celestio_session");
  const teamId = useMemo(() => {
    if (!sessionData) return null;
    try {
      const data = JSON.parse(sessionData);
      return data.teamId || data.id || (data.team && (data.team.teamId || data.team.id)) || null;
    } catch { return null; }
  }, [sessionData]);

  const [completedGames, setCompletedGames] = useState<Set<number>>(() => {
    const completed = getCompletedGames(teamId);
    return new Set(completed.map((c) => c.levelId));
  });

  const [justCompletedLevel, setJustCompletedLevel] = useState<number | null>(null);

  const handleLevelSelect = (selectedLevel: number) => {
    setLevel(selectedLevel);
  };

  const handleLevelComplete = async () => {

    if (level) {
      const levelNames = ["Constellation", "Brand Builder", "Debug Code"];
      const levelName = levelNames[level - 1];


      markGameCompleted(teamId, level as 1 | 2 | 3, levelName);


      if (teamId) {
        try {
          await markGameComplete(teamId, level, levelName);
        } catch (err) {
          console.error("Failed to mark game complete on backend:", err);
        }
      }


      const newCompleted = new Set([...completedGames, level]);
      setCompletedGames(newCompleted);
      setJustCompletedLevel(level);


      if (newCompleted.size >= 3) {
        localStorage.setItem("celestio_game_complete", "true");
      }


      setTimeout(() => {
        setLevel(null);
        setJustCompletedLevel(null);
      }, 2000);
    }
  };

  const isLoggedIn = !!localStorage.getItem("celestio_session");

  const levelNames = ["Constellation", "Brand Builder", "Debug Code"];
  const levelDescriptions = [
    "Connect the stars to form constellations",
    "Match design elements to constraints",
    "Find and fix bugs in the code"
  ];

  return (
    <div className="relative min-h-screen">
      <StarField />
      <Navbar />
      <div className="relative z-10 pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-xs font-mono text-accent tracking-[0.3em] uppercase">Challenge Mode</span>
            <h2 className="font-display text-3xl md:text-5xl font-black cosmic-gradient-text mt-2 mb-1">
              Cosmic Challenges
            </h2>
            <p className="font-mono text-muted-foreground/50 text-sm">Master all challenges to prove your skills</p>
          </motion.div>

          <AnimatePresence mode="wait">
            {level === null ? (

              <motion.div
                key="selector"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid md:grid-cols-3 gap-4 mb-10">
                  {[1, 2, 3].map((lvl) => {
                    const isCompleted = completedGames.has(lvl);
                    return (
                      <motion.button
                        key={lvl}
                        onClick={() => handleLevelSelect(lvl)}
                        className="group relative p-6 rounded-2xl border border-accent/20 bg-muted/5 backdrop-blur-sm hover:bg-muted/10 transition-all"
                        whileHover={{ scale: 1.02, borderColor: "hsl(var(--accent))" }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="absolute inset-0 rounded-2xl neon-glow opacity-0 group-hover:opacity-20 transition-opacity" />

                        <div className="relative z-10 text-left">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-display font-black text-primary-foreground transition-all ${isCompleted ? "cosmic-gradient" : "cosmic-gradient"
                              }`}>
                              {isCompleted ? <Check className="w-6 h-6" /> : lvl}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-display text-lg font-bold">{levelNames[lvl - 1]}</h3>
                              {isCompleted && (
                                <motion.span
                                  className="text-xs font-mono text-primary inline-block"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                >
                                  ✓ Completed
                                </motion.span>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mb-4">{levelDescriptions[lvl - 1]}</p>

                          <div className="flex items-center gap-2 text-xs font-mono text-accent/70">
                            <Rocket className="w-3 h-3" />
                            {isCompleted ? "Play again" : "Click to start"}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {!isLoggedIn && completedGames.size >= 3 && (
                  <motion.div
                    className="text-center mt-12 p-8 rounded-3xl border border-primary/30 bg-primary/5 backdrop-blur-md relative overflow-hidden"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-20 pointer-events-none" />
                    <Sparkles className="w-10 h-10 text-primary mx-auto mb-4 animate-pulse-glow" />
                    <h3 className="font-display text-2xl font-black text-foreground mb-2">Protocol Complete</h3>
                    <p className="font-mono text-muted-foreground/70 text-sm mb-8 max-w-md mx-auto">
                      You've mastered all cosmic challenges. Your team is now cleared for final registration.
                    </p>
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-3 px-10 py-4 cosmic-gradient rounded-2xl font-display font-bold text-primary-foreground neon-glow hover:scale-105 transition-transform group"
                    >
                      Launch Registration <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </motion.div>
                )}

                {!isLoggedIn && completedGames.size < 3 && (
                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className="font-mono text-muted-foreground/40 text-xs">
                      Complete all 3 challenges to unlock registration
                    </p>
                  </motion.div>
                )}

                {isLoggedIn && (
                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className="font-mono text-muted-foreground/60 text-sm">
                      ✨ All challenges unlocked. Play unlimited times!
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ) : (

              <motion.div
                key={`level-${level}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
              >
                <div className="mb-6 flex items-center justify-between">
                  <motion.button
                    onClick={() => setLevel(null)}
                    className="text-sm font-mono text-muted-foreground/70 hover:text-accent transition-colors flex items-center gap-2"
                    whileHover={{ x: -4 }}
                  >
                    ← Back to Challenges
                  </motion.button>
                  <span className="text-xs font-mono text-accent/70">Challenge {level} of 3</span>
                </div>

                {level === 1 && <Level1 onComplete={handleLevelComplete} />}
                {level === 2 && <Level2 onComplete={handleLevelComplete} />}
                {level === 3 && <Level3 onComplete={handleLevelComplete} />}

                {/* Completion notification */}
                <AnimatePresence>
                  {justCompletedLevel && (
                    <motion.div
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="text-center pointer-events-auto"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 100 }}
                      >
                        <motion.div
                          className="mb-6"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Check className="w-16 h-16 text-primary mx-auto" />
                        </motion.div>
                        <h3 className="font-display text-3xl font-black cosmic-gradient-text mb-2">
                          Challenge Complete!
                        </h3>
                        <p className="font-mono text-muted-foreground/70 text-sm">
                          Returning to challenges...
                        </p>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default GamePage;
