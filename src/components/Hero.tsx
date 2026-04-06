import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Rocket, Sparkles, Gamepad2, Zap, Star, Users, AlertCircle } from "lucide-react";
import { getTeamsStats, getEventStatus } from "@/lib/apiClient";

interface TeamStats {
  id: string;
  name: string;
  qr: {
    scanned: number;
    total: number;
    completed: boolean;
  };
  games: {
    completed: number;
    total: number;
  };
}

const FloatingParticle = ({ delay, x, y, size }: { delay: number; x: string; y: string; size: number }) => (
  <motion.div
    className="absolute rounded-full bg-primary/30"
    style={{ left: x, top: y, width: size, height: size }}
    animate={{
      y: [0, -30, 0],
      opacity: [0.2, 0.8, 0.2],
      scale: [1, 1.5, 1],
    }}
    transition={{ duration: 4, delay, repeat: Infinity, ease: "easeInOut" }}
  />
);

const GlitchText = ({ children }: { children: string }) => (
  <motion.span
    className="relative inline-block"
    animate={{
      textShadow: [
        "0 0 10px hsl(312 100% 63% / 0.8), 0 0 40px hsl(312 100% 63% / 0.4), 0 0 80px hsl(312 100% 63% / 0.2)",
        "2px 0 10px hsl(192 100% 65% / 0.8), -2px 0 40px hsl(264 100% 68% / 0.4), 0 0 80px hsl(312 100% 63% / 0.2)",
        "0 0 10px hsl(312 100% 63% / 0.8), 0 0 40px hsl(312 100% 63% / 0.4), 0 0 80px hsl(312 100% 63% / 0.2)",
      ],
    }}
    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
  >
    {children}
  </motion.span>
);

const Hero = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [teams, setTeams] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [registrationEnded, setRegistrationEnded] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("celestio_session"));
    loadTeams();
    checkEventStatus();
  }, []);

  const checkEventStatus = async () => {
    try {
      const status = await getEventStatus();
      setRegistrationEnded(status.registrationEnded);
    } catch (err) {
      console.error("Failed to check event status:", err);
    }
  };

  const loadTeams = async () => {
    setLoading(true);
    try {
      const data = await getTeamsStats();
      setTeams(data.teams || []);
    } catch (err) {
      console.error("Failed to load teams:", err);
    }
    setLoading(false);
  };

  const particles = Array.from({ length: 12 }, (_, i) => ({
    delay: i * 0.4,
    x: `${10 + Math.random() * 80}%`,
    y: `${10 + Math.random() * 80}%`,
    size: 2 + Math.random() * 4,
  }));

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated orbit rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="w-[500px] h-[500px] rounded-full border border-primary/10"
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute w-[700px] h-[700px] rounded-full border border-secondary/8"
          animate={{ rotate: -360 }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute w-[900px] h-[900px] rounded-full border border-accent/5"
          animate={{ rotate: 360 }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        />
        {/* Orbit dots */}
        <motion.div
          className="absolute w-[500px] h-[500px]"
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary neon-glow" />
        </motion.div>
        <motion.div
          className="absolute w-[700px] h-[700px]"
          animate={{ rotate: -360 }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-secondary neon-glow-purple" />
        </motion.div>
        <motion.div
          className="absolute w-[900px] h-[900px]"
          animate={{ rotate: 360 }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent neon-glow-blue" />
        </motion.div>
      </div>

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 60% 50% at 50% 50%, hsl(312 100% 63% / 0.06) 0%, transparent 70%)"
      }} />

      {/* Floating particles */}
      {particles.map((p, i) => (
        <FloatingParticle key={i} {...p} />
      ))}

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-5 py-2.5 glass-panel rounded-full mb-10 border-accent/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Sparkles className="w-4 h-4 text-accent animate-pulse-glow" />
            <span className="text-sm font-mono text-accent tracking-wider">Arcanum + Software Development</span>
            <Star className="w-3 h-3 text-primary animate-twinkle" />
          </motion.div>

          {/* Title */}
          <h1 className="text-7xl md:text-[8rem] lg:text-[10rem] font-display font-black mb-2 leading-[0.9] tracking-tight">
            <GlitchText>BRAND</GlitchText>
            <motion.span
              className="text-foreground/60 text-5xl md:text-7xl lg:text-8xl align-top ml-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, type: "spring" }}
            >
              'QUEST
            </motion.span>
          </h1>

          {/* Animated underline */}
          <motion.div
            className="mx-auto mb-6 h-[2px] cosmic-gradient rounded-full"
            initial={{ width: 0 }}
            animate={{ width: "40%" }}
            transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
          />

          <motion.p
            className="text-xl md:text-2xl font-body text-muted-foreground font-bold tracking-[0.3em] uppercase mb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Celestio 3.0
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Link
              to="/game"

              className="group relative flex items-center gap-3 px-10 py-5 cosmic-gradient rounded-2xl font-display text-lg font-bold text-primary-foreground transition-all duration-300 hover:scale-105 overflow-hidden"
            >
              <span className="absolute inset-0 neon-glow rounded-2xl" />
              <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 rounded-2xl" />
              <Gamepad2 className="w-5 h-5 relative z-10 group-hover:animate-float" />
              <span className="relative z-10">Play Now</span>
            </Link>
            {!isLoggedIn && (
              registrationEnded ? (
                <div className="group flex items-center gap-3 px-10 py-5 glass-panel-strong rounded-2xl font-display text-lg font-bold text-muted-foreground border-white/5 cursor-not-allowed opacity-70">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  Registration Closed
                </div>
              ) : (
                <Link
                  to="/register"
                  className="group flex items-center gap-3 px-10 py-5 glass-panel-strong rounded-2xl font-display text-lg font-bold text-foreground neon-border transition-all duration-300 hover:scale-105 hover:bg-primary/10 hover:border-primary/60"
                >
                  <Users className="w-5 h-5" />
                  Register Team
                </Link>
              )
            )}

          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="mt-20 flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1.5 }}
          >
            <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Scroll</span>
            <motion.div
              className="w-5 h-8 rounded-full border border-muted-foreground/30 flex justify-center pt-1.5"
              animate={{ borderColor: ["hsl(260 20% 60% / 0.3)", "hsl(312 100% 63% / 0.5)", "hsl(260 20% 60% / 0.3)"] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="w-1 h-2 rounded-full bg-primary/60"
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>  
    </section>
  );
};

export default Hero;
