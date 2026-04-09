import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lightbulb } from "lucide-react";
import { useHints } from "@/hooks/useHints";

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

// Single continuous path for drawing
const CORRECT_PATH = [0, 1, 2, 3, 4, 5, 6, 7];

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
      label: s.id === 0 ? "START" : s.id === 7 ? "END" : "✦",
    }));

    const diff = seed % 3 === 0 ? "easy" : seed % 3 === 1 ? "medium" : "hard";
    return [starPositions, diff];
  }, []);

  const [activePath, setActivePath] = useState<number[]>([]);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shake, setShake] = useState(false);

  const [completed, setCompleted] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showHint, setShowHint] = useState<string | null>(null);
  const { hintsRemaining, canUseHint, submitHint } = useHints();

  const handleHint = () => {
    if (!canUseHint) return;
    if (submitHint()) {
      setShowHint("Click and hold the START star, then drag to connect the stars in order!");
      setTimeout(() => setShowHint(null), 5000);
    }
  };

  const getPos = (e: React.PointerEvent | PointerEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    // Normalize to internal 480x420 coordinate system
    const scaleX = 480 / rect.width;
    const scaleY = 420 / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (id: number, e: React.PointerEvent) => {
    if (completed) return;
    
    if (activePath.length === 0) {
      if (id === 0) {
        setIsDrawing(true);
        setActivePath([0]);
        setCursorPos(getPos(e));
        // We release pointer capture so pointerenter can fire on other elements while dragging
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } else {
        triggerError();
      }
    } else {
      // Allow clicking nodes to connect if they didn't drag
      const expectedNext = CORRECT_PATH[activePath.length];
      if (id === expectedNext) {
        const newPath = [...activePath, id];
        setActivePath(newPath);
        if (newPath.length === CORRECT_PATH.length) {
          setIsDrawing(false);
          setCompleted(true);
          setTimeout(onComplete, 2500);
        } else {
          setIsDrawing(true);
          setCursorPos(getPos(e));
          (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        }
      } else if (!activePath.includes(id)) {
        triggerError();
      }
    }
  };

  const handlePointerEnter = (id: number) => {
    if (!isDrawing || completed) return;
    
    const lastNode = activePath[activePath.length - 1];
    const expectedNext = CORRECT_PATH[activePath.length];
    
    if (id === expectedNext) {
      const newPath = [...activePath, id];
      setActivePath(newPath);
      
      if (newPath.length === CORRECT_PATH.length) {
        setIsDrawing(false);
        setCompleted(true);
        setTimeout(onComplete, 2500);
      }
    } else if (!activePath.includes(id)) {
      triggerError();
    }
  };

  const autoTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerError = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
    setIsDrawing(false);
    setActivePath([]);
    
    const newWrongCount = wrongCount + 1;
    setWrongCount(newWrongCount);
    
    if (newWrongCount === 2 && !completed && !autoTimerRef.current) {
      setFeedback("Hint: Showing sequence...");
      
      // Show the full path briefly, then clear it so they can try
      let step = 0;
      autoTimerRef.current = setInterval(() => {
        if (step < CORRECT_PATH.length) {
          setActivePath(CORRECT_PATH.slice(0, step + 1));
          step++;
        } else {
          if (autoTimerRef.current) {
            clearInterval(autoTimerRef.current);
            autoTimerRef.current = null;
          }
          setTimeout(() => {
            setActivePath([]);
            setFeedback("Now trace the sequence!");
            setTimeout(() => setFeedback(null), 2500);
          }, 500);
        }
      }, 300);
    } else if (newWrongCount >= 4 && !completed && !autoTimerRef.current) {
      setFeedback("Override Triggered! Revealing Full Solution...");
      
      let step = 1;
      setActivePath([CORRECT_PATH[0]]);
      
      autoTimerRef.current = setInterval(() => {
        if (step < CORRECT_PATH.length) {
          setActivePath(prev => [...prev, CORRECT_PATH[step]]);
          step++;
        } else {
          if (autoTimerRef.current) {
            clearInterval(autoTimerRef.current);
            autoTimerRef.current = null;
          }
          setCompleted(true);
          setFeedback("Solution override complete. Access granted.");
          setTimeout(onComplete, 2500);
        }
      }, 400);
    } else if (newWrongCount < 2) {
      setFeedback(`Invalid sequence. Attempts left: ${2 - newWrongCount}`);
      setTimeout(() => setFeedback(null), 2000);
    } else if (newWrongCount === 3) {
      setFeedback(`Final attempt before override...`);
      setTimeout(() => setFeedback(null), 2000);
    }
  };

  useEffect(() => {
    return () => {
      if (autoTimerRef.current) {
        clearInterval(autoTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (isDrawing) {
        setCursorPos(getPos(e));
      }
    };
    
    const handleUp = () => {
      // In click-to-connect mode, we don't drop the line on pointerup
      // We only drop it if they click outside the game area (handled by a separate mechanism if needed)
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [isDrawing, activePath]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-4 mb-2">
        <h3 className="font-display text-2xl font-bold text-primary neon-text">Constellation Connect</h3>
        <HintButton hintsRemaining={hintsRemaining} canUseHint={canUseHint} onClick={handleHint} />
      </div>
      <p className="text-sm font-mono text-muted-foreground mb-6 flex items-center justify-center gap-2">
        Drag from START to connect the stars!
        <span className="text-xs uppercase tracking-widest text-accent">({difficulty})</span>
      </p>

      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-panel px-4 py-2 mb-4 border-accent/40 flex items-center gap-2"
          >
            <Lightbulb className="w-4 h-4 text-accent" />
            <span className="text-sm font-mono text-accent">{showHint}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        ref={containerRef}
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="relative bg-muted/5 border border-primary/20 rounded-lg p-6 w-full max-w-[480px] touch-none shadow-[inset_0_0_50px_rgba(var(--primary),0.05)]" 
        style={{ aspectRatio: "480/420" }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 480 420">
          <defs>
            <filter id="lineGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Guide Path */}
          {CORRECT_PATH.map((id, i) => {
            if (i === 0) return null;
            const p1 = stars[CORRECT_PATH[i-1]];
            const p2 = stars[id];
            if (!p1 || !p2) return null;
            return (
              <line
                key={`guide-${i}`}
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke="hsl(312 100% 63%)" strokeWidth="1" opacity="0.05"
                strokeDasharray="4 8"
              />
            );
          })}

          {/* Connected Path */}
          {activePath.map((id, i) => {
            if (i === 0) return null;
            const p1 = stars[activePath[i-1]];
            const p2 = stars[id];
            if (!p1 || !p2) return null;
            return (
              <motion.line
                key={`conn-${i}`}
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke="hsl(312 100% 63%)" strokeWidth="4" strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.9 }}
                transition={{ duration: 0.2 }}
                filter="url(#lineGlow)"
              />
            );
          })}

          {/* Dragging Line */}
          {isDrawing && activePath.length > 0 && activePath.length < CORRECT_PATH.length && stars[activePath[activePath.length - 1]] && (
            <>
              <line
                x1={stars[activePath[activePath.length - 1]].x} 
                y1={stars[activePath[activePath.length - 1]].y}
                x2={cursorPos.x} y2={cursorPos.y}
                stroke="hsl(312 100% 80%)" strokeWidth="4" strokeLinecap="round"
                opacity="0.8" filter="url(#lineGlow)"
              />
              <circle cx={cursorPos.x} cy={cursorPos.y} r="6" fill="#fff" filter="url(#lineGlow)" className="animate-pulse" />
            </>
          )}
        </svg>

        {stars.map((star) => {
          const isStartEnd = star.id === 0 || star.id === 7;
          const isActive = activePath.includes(star.id);
          const isLatest = activePath[activePath.length - 1] === star.id;
          
          return (
            <motion.div
              key={star.id}
              className={`absolute flex items-center justify-center font-display font-bold transition-colors cursor-pointer select-none z-10 
                ${isStartEnd ? "w-14 h-14 rounded-full text-[10px] tracking-widest" : "w-10 h-10 rounded-full text-sm"} 
                ${isLatest
                  ? "bg-primary text-primary-foreground neon-glow scale-110"
                  : isActive
                    ? "bg-primary/50 text-white border-2 border-primary/80 neon-glow"
                    : isStartEnd
                      ? "bg-secondary/20 text-secondary border-2 border-secondary/40 hover:border-secondary hover:bg-secondary/40"
                      : "bg-muted/50 text-foreground/80 border border-primary/30 hover:border-primary hover:bg-primary/20 backdrop-blur-sm"
                }`}
              style={{
                left: `calc(${(star.x / 480) * 100}% - ${isStartEnd ? 28 : 20}px)`,
                top: `calc(${(star.y / 420) * 100}% - ${isStartEnd ? 28 : 20}px)`,
              }}
              onPointerDown={(e) => handlePointerDown(star.id, e)}
              onPointerEnter={() => handlePointerEnter(star.id)}
              whileHover={!isDrawing ? { scale: 1.15 } : {}}
              whileTap={{ scale: 0.95 }}
            >
              {isActive && !isStartEnd ? <Check className="w-4 h-4 text-white" /> : star.label}
            </motion.div>
          );
        })}

        {completed && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-lg rounded-xl z-20"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
          >
             <div>
                <img src="/logo.png" alt="Celestio" className="w-32 h-32 mb-6 drop-shadow-[0_0_20px_rgba(var(--primary),1)]" />
             </div>
             <h3 className="font-display text-4xl font-black cosmic-gradient-text neon-text mb-2">CELESTIO</h3>
             <p className="text-sm font-mono text-muted-foreground italic mb-4">Connection Re-established</p>
          </motion.div>
        )}
      </motion.div>
      <div className="mt-4 text-xs font-mono text-muted-foreground flex gap-2">
         {CORRECT_PATH.map((id, i) => (
           <div key={i} className={`w-3 h-3 rounded-full ${activePath.includes(id) ? 'bg-primary neon-glow' : 'bg-muted/30'}`} />
         ))}
      </div>

       <div className="h-8 mt-2 flex items-center justify-center">
          <AnimatePresence>
            {feedback && (
              <motion.div
                className={`text-sm font-mono px-4 py-1.5 rounded-lg border bg-black/50 backdrop-blur-sm ${completed || feedback.includes("Revealing") ? 'text-green-400 border-green-500/30' : 'text-orange-400 border-orange-500/30'}`}
                initial={{ opacity: 0, y: 10, scale: 0.9 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                {feedback}
              </motion.div>
            )}
          </AnimatePresence>
       </div>
    </div>
  );
};

export default Level1;
