import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lightbulb, Sparkles } from "lucide-react";
import { useHints } from "@/hooks/useHints";


const BASE_STARS = [
  { id: 0, x: 300, y: 40 },
  { id: 1, x: 200, y: 70 },
  { id: 2, x: 130, y: 140 },
  { id: 3, x: 110, y: 220 },
  { id: 4, x: 140, y: 300 },
  { id: 5, x: 220, y: 350 },
  { id: 6, x: 320, y: 360 },
  { id: 7, x: 280, y: 200 },
];

const CORRECT_PATH: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
  [2, 7], [3, 7],
];

const HINTS = [
  "Start from the top — connect the first two stars at the top of the 'C'.",
  "Trace the curve down the left side of the letter.",
  "The center gear ⚙ connects to stars on the inner curve.",
  "Complete the bottom of the 'C' and connect the gear to the mid-left star.",
];

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

const Level1 = ({ onComplete }: { onComplete: () => void }) => {
  const [stars, difficulty] = useMemo(() => {
    const session = localStorage.getItem("celestio_session");
    let seed = 42;
    if (session) {
      try {
        const teamId = JSON.parse(session).teamId || "";
        seed = teamId.charCodeAt(4) || 42;
      } catch { /* fallback */ }
    }
    const rng = seededRandom(seed);
    const starPositions = BASE_STARS.map((s) => ({
      ...s,
      x: s.x + Math.floor((rng() - 0.5) * 30),
      y: s.y + Math.floor((rng() - 0.5) * 30),
      label: s.id === 7 ? "⚙" : "✦",
    }));


    const diff = seed % 3 === 0 ? "easy" : seed % 3 === 1 ? "medium" : "hard";
    return [starPositions, diff];
  }, []);

  const [connections, setConnections] = useState<[number, number][]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [shakeId, setShakeId] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [showHint, setShowHint] = useState<string | null>(null);
  const hintIndexRef = useRef(0);
  const { hintsRemaining, canUseHint, submitHint } = useHints();

  const handleHint = () => {
    if (!canUseHint) return;
    const idx = hintIndexRef.current;
    if (idx >= HINTS.length) return;
    if (submitHint()) {
      setShowHint(HINTS[idx]);
      hintIndexRef.current = idx + 1;
      setTimeout(() => setShowHint(null), 5000);
    }
  };

  const handleStarClick = (id: number) => {
    if (completed) return;
    if (selected === null) {
      setSelected(id);
    } else if (selected === id) {
      setSelected(null);
    } else {
      const pair: [number, number] = [Math.min(selected, id), Math.max(selected, id)];
      const isCorrect = CORRECT_PATH.some(([a, b]) => a === pair[0] && b === pair[1]);
      const alreadyConnected = connections.some(([a, b]) => a === pair[0] && b === pair[1]);

      if (isCorrect && !alreadyConnected) {
        const newConns = [...connections, pair];
        setConnections(newConns);
        if (newConns.length === CORRECT_PATH.length) {
          setCompleted(true);
          setTimeout(onComplete, 2500);
        }
      } else if (!isCorrect) {
        setShakeId(id);
        setTimeout(() => setShakeId(null), 500);
      }
      setSelected(null);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-4 mb-2">
        <h3 className="font-display text-2xl font-bold text-primary neon-text">Constellation Connect</h3>
        <HintButton hintsRemaining={hintsRemaining} canUseHint={canUseHint} onClick={handleHint} />
      </div>
      <p className="text-sm font-mono text-muted-foreground mb-6 flex items-center justify-center gap-2">
        Connect the stars to reveal the Celestio constellation.
        <span className="text-xs uppercase tracking-widest text-accent">({difficulty})</span>
      </p>

      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-panel px-4 py-2 mb-4 border-accent/40 flex items-center gap-2"
          >
            <Lightbulb className="w-4 h-4 text-accent" />
            <span className="text-sm font-mono text-accent">{showHint}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative bg-muted/5 border border-primary/20 rounded-lg p-6 w-full max-w-[480px]" style={{ aspectRatio: "480/420" }}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 480 420">
          {connections.map(([a, b], i) => (
            <motion.line
              key={`conn-${i}`}
              x1={stars[a].x} y1={stars[a].y}
              x2={stars[b].x} y2={stars[b].y}
              stroke="hsl(312 100% 63%)" strokeWidth="2.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.9 }}
              transition={{ duration: 0.5 }}
              filter="url(#lineGlow)"
            />
          ))}
          {CORRECT_PATH.filter(
            ([a, b]) => !connections.some(([ca, cb]) => ca === a && cb === b)
          ).map(([a, b], i) => (
            <line
              key={`guide-${i}`}
              x1={stars[a].x} y1={stars[a].y}
              x2={stars[b].x} y2={stars[b].y}
              stroke="hsl(312 100% 63%)" strokeWidth="0.5" opacity="0.06"
              strokeDasharray="3 9"
            />
          ))}
          <defs>
            <filter id="lineGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
        </svg>

        {stars.map((star) => {
          const isGear = star.id === 7;
          const isConnected = connections.some(([a, b]) => a === star.id || b === star.id);
          return (
            <motion.button
              key={star.id}
              className={`absolute flex items-center justify-center font-display font-bold transition-all cursor-pointer z-10 ${isGear ? "w-12 h-12 rounded-full text-base" : "w-9 h-9 rounded-full text-xs"
                } ${selected === star.id
                  ? "bg-primary text-primary-foreground neon-glow scale-125"
                  : isConnected
                    ? "bg-primary/30 text-primary border border-primary/60 neon-glow"
                    : isGear
                      ? "bg-secondary/20 text-secondary border border-secondary/40 hover:border-secondary hover:bg-secondary/30"
                      : "bg-muted/50 text-foreground/80 border border-primary/30 hover:border-primary hover:bg-primary/20"
                }`}
              style={{
                left: `calc(${(star.x / 480) * 100}% - ${isGear ? 24 : 18}px)`,
                top: `calc(${(star.y / 420) * 100}% - ${isGear ? 24 : 18}px)`,
              }}
              onClick={() => handleStarClick(star.id)}
              animate={shakeId === star.id ? { x: [0, -5, 5, -5, 0] } : {}}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              {star.label}
            </motion.button>
          );
        })}

        {completed && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-md rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <motion.img
              src="/logo.png"
              alt="Celestio"
              className="w-24 h-24 mb-4"
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", duration: 1, delay: 0.3 }}
            />
            <motion.h3
              className="font-display text-3xl font-black cosmic-gradient-text neon-text mb-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              CELESTIO
            </motion.h3>
            <motion.p
              className="text-sm font-mono text-muted-foreground italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              Where Technology Dances With Culture
            </motion.p>
            <motion.div
              className="mt-3 flex items-center gap-2 text-primary font-display text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <Check className="w-4 h-4" /> Constellation Formed!
            </motion.div>
          </motion.div>
        )}
      </div>
      <div className="mt-3 text-xs font-mono text-muted-foreground">
        {connections.length}/{CORRECT_PATH.length} connections made
      </div>
    </div>
  );
};

export const HintButton = ({ hintsRemaining, canUseHint, onClick }: { hintsRemaining: number; canUseHint: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    disabled={!canUseHint}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${canUseHint
      ? "glass-panel border-accent/30 text-accent hover:bg-accent/10 hover:scale-105"
      : "glass-panel border-muted/30 text-muted-foreground opacity-50 cursor-not-allowed"
      }`}
  >
    <Lightbulb className="w-3.5 h-3.5" />
    Hint ({hintsRemaining})
  </button>
);

export default Level1;
