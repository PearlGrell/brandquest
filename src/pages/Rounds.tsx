import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Unlock, QrCode, Palette, Code2, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import StarField from "@/components/StarField";
import { getEventStatus } from "@/lib/apiClient";

const Rounds = () => {
  const navigate = useNavigate();
  const teamDataString = localStorage.getItem("celestio_session");

  const [currentRound, setCurrentRound] = useState(1);
  const [eventStarted, setEventStarted] = useState(false);

  useEffect(() => {
    if (!teamDataString) {
      navigate("/login");
      return;
    }

    const checkEventStatus = async () => {
      try {
        const data = await getEventStatus();
        setEventStarted(data.isStarted);
        setCurrentRound(data.currentRound);
      } catch (err) {
        console.error("Failed to fetch event status:", err);
      }
    };

    checkEventStatus();
  }, [teamDataString, navigate]);

  const roundsData = [
    {
      id: 1,
      title: "QR Hunt Challenge",
      description: "Navigate physical locations to scan QR codes and assemble your brand identity.",
      icon: QrCode,
      color: "text-primary",
      borderColor: "border-primary",
      link: "/qr-scanner",
      linkText: "Go to Scanner",
      requiresRound: 1,
    },
    {
      id: 2,
      title: "Brand Identity Design",
      description: "Transform your collected constraints into a stunning logo and promotional banner.",
      icon: Palette,
      color: "text-secondary",
      borderColor: "border-secondary",
      link: "/submit/round-2",
      linkText: "Submit Design",
      requiresRound: 2,
    },
    {
      id: 3,
      title: "Cosmic Code Challenge",
      description: "Bring your brand to life. Code and design a fully functional, interactive web interface.",
      icon: Code2,
      color: "text-accent",
      borderColor: "border-accent",
      link: "/submit/round-3",
      linkText: "Submit Code",
      requiresRound: 3,
    }
  ];

  return (
    <div className="relative min-h-screen">
      <StarField />
      <Navbar />
      <div className="relative z-10 pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-12">
              <motion.span
                className="text-xs font-mono text-accent tracking-[0.3em] uppercase"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                Event Hub
              </motion.span>
              <h2 className="font-display text-4xl md:text-5xl font-black cosmic-gradient-text mt-2 mb-4">
                Competition Rounds
              </h2>
              <p className="font-mono text-muted-foreground">
                Access your designated challenges below. Future rounds will unlock automatically as the event progresses.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {roundsData.map((round) => {
                const isUnlocked = eventStarted && currentRound >= round.requiresRound;
                
                return (
                  <motion.div
                    key={round.id}
                    className={`relative overflow-hidden glass-panel p-6 border ${isUnlocked ? 'border-white/20 hover:border-white/40' : 'border-white/5 opacity-70'} transition-all flex flex-col h-full`}
                    whileHover={isUnlocked ? { y: -5 } : {}}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 border ${isUnlocked ? round.borderColor : 'border-white/10'}`}>
                        <round.icon className={`w-6 h-6 ${isUnlocked ? round.color : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono">
                        {isUnlocked ? (
                          <span className="flex items-center gap-1 text-primary">
                            <Unlock className="w-3 h-3" /> Unlocked
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <h3 className={`font-display text-xl font-bold mb-2 ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                      Round {round.id}: {round.title}
                    </h3>
                    
                    <p className="font-mono text-sm text-muted-foreground mb-6 flex-grow">
                      {round.description}
                    </p>

                    {isUnlocked ? (
                      <Link
                        to={round.link}
                        className={`mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-lg font-mono text-sm font-bold bg-white/5 hover:bg-white/10 border border-white/10 ${round.color} transition-colors group`}
                      >
                        {round.linkText} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    ) : (
                      <div className="mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-lg font-mono text-sm text-muted-foreground bg-black/20 border border-white/5 cursor-not-allowed">
                        Awaiting Round {round.requiresRound}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Rounds;
