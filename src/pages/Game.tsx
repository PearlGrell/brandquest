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
      const levelNames = ["Constellation", "Color Calibration", "Debug Code"];
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

  const levelNames = ["Constellation Connect", "Color Calibration", "System Patch"];
  const levelDescriptions = [
    "Connect the stars to form constellations",
    "Calibrate the RGB frequencies to match the target",
    "Patch the broken data relays"
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
                <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-16">
                  {[1, 2, 3].map((lvl) => {
                    const isCompleted = completedGames.has(lvl);
                    return (
                      <motion.button
                        key={lvl}
                        onClick={() => handleLevelSelect(lvl)}
                        className={`group relative text-left p-8 rounded-[2rem] border overflow-hidden min-h-[280px] flex flex-col justify-between transition-all duration-500
                          ${isCompleted 
                            ? "bg-secondary/5 border-secondary/30 shadow-[0_0_40px_rgba(var(--secondary),0.15)] hover:shadow-[0_0_60px_rgba(var(--secondary),0.3)] hover:border-secondary/50" 
                            : "bg-black/40 backdrop-blur-md border-white/5 hover:border-secondary/40 hover:bg-black/60 shadow-xl"
                          }`}
                        whileHover={{ scale: 1.03, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Background Effects */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className={`absolute -bottom-10 -right-10 w-40 h-40 blur-3xl rounded-full opacity-20 transition-all duration-700
                          ${isCompleted ? "bg-secondary group-hover:scale-150" : "bg-secondary group-hover:scale-150 group-hover:opacity-40"}
                        `} />

                        {/* Watermark Number */}
                        <div className="absolute -top-6 -right-2 text-[180px] font-display font-black leading-none opacity-[0.03] text-white group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none select-none">
                          {lvl}
                        </div>

                        {/* Content Top */}
                        <div className="relative z-10 w-full">
                          <div className="flex items-center justify-between mb-8">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-display text-2xl font-black shadow-lg transition-all duration-500
                              ${isCompleted ? "bg-secondary text-secondary-foreground neon-glow-purple shadow-secondary/40" : "bg-white/10 text-white/50 group-hover:bg-secondary group-hover:text-secondary-foreground group-hover:shadow-secondary/40"}
                            `}>
                              {lvl}
                            </div>
                            
                            {isCompleted && (
                              <motion.div 
                                className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary/20 text-secondary border border-secondary/30"
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                              >
                                <Check className="w-5 h-5" />
                              </motion.div>
                            )}
                          </div>
                          
                          <h3 className={`font-display text-2xl font-black mb-3 transition-colors duration-300 ${isCompleted ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
                            {levelNames[lvl - 1]}
                          </h3>
                          <p className="text-sm font-mono text-muted-foreground line-clamp-2 pr-4">{levelDescriptions[lvl - 1]}</p>
                        </div>

                        {/* Content Bottom */}
                        <div className="relative z-10 w-full mt-6 flex items-center justify-between text-xs font-mono uppercase tracking-widest">
                           <span className={isCompleted ? "text-secondary font-bold" : "text-muted-foreground/50 group-hover:text-secondary font-bold"}>
                             {isCompleted ? "Protocol Cleared" : "Awaiting Input"}
                           </span>
                           <Rocket className={`w-4 h-4 transition-all duration-300 ${isCompleted ? "text-secondary" : "text-white/20 group-hover:text-secondary group-hover:translate-x-1 group-hover:-translate-y-1"}`} />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {!isLoggedIn && completedGames.size >= 3 && (
                  <motion.div
                    className="text-center mt-12 p-10 md:p-14 rounded-[3rem] border border-secondary/40 bg-gradient-to-b from-secondary/10 to-transparent backdrop-blur-xl relative overflow-hidden group shadow-[0_0_80px_rgba(var(--secondary),0.15)]"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", damping: 20, delay: 0.2 }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary/80 to-transparent opacity-80" />
                    
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1] }} 
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <Sparkles className="w-14 h-14 text-secondary mx-auto mb-6 drop-shadow-[0_0_15px_rgba(var(--secondary),0.8)]" />
                    </motion.div>
                    
                    <h3 className="font-display text-3xl md:text-5xl font-black text-white mb-4 drop-shadow-md">Core Systems Online</h3>
                    <p className="font-mono text-secondary/80 tracking-widest uppercase text-xs md:text-sm mb-10 max-w-lg mx-auto">
                      All cosmic challenges defeated. Your team is granted ultimate clearance for final registration.
                    </p>
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-4 px-12 py-5 cosmic-gradient rounded-full font-display text-lg font-black text-primary-foreground shadow-[0_0_30px_rgba(var(--primary),0.4)] hover:shadow-[0_0_50px_rgba(var(--primary),0.6)] hover:scale-105 transition-all duration-300"
                    >
                      Access Registration Terminal <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
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
                        className="text-center pointer-events-auto bg-black/40 backdrop-blur-md border border-white/10 p-10 md:p-14 rounded-[3rem] shadow-2xl"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 100 }}
                      >
                        <div className="mb-6">
                          <Check className="w-16 h-16 text-secondary mx-auto" />
                        </div>
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
