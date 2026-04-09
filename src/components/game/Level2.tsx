import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lightbulb, Sliders } from "lucide-react";
import { useHints } from "@/hooks/useHints";
import { HintButton } from "./Level1";

const BRAND_COLORS = [
  { name: "Cyberpunk Magenta", r: 255, g: 0, b: 110, hints: ["Max out RED", "Reduce GREEN to zero", "Add some BLUE for that magenta pop"] },
  { name: "Forest Green", r: 46, g: 204, b: 113, hints: ["GREEN is your primary color here", "Keep RED low", "A little BLUE helps the tone"] },
  { name: "Oceanic Blue", r: 0, g: 102, b: 255, hints: ["Push BLUE all the way up", "Drop RED to zero", "A bit of GREEN makes it oceanic"] },
  { name: "Galactic Purple", r: 123, g: 44, b: 191, hints: ["Mix RED and BLUE", "Keep GREEN very low", "More BLUE than RED"] },
  { name: "Neon Yellow", r: 255, g: 255, b: 0, hints: ["Max out RED and GREEN", "Zero BLUE", "Yellow is made of red + green light"] }
];

const Level2 = ({ onComplete }: { onComplete: () => void }) => {
  const [targetIndex, difficulty] = useMemo(() => {
    const idx = Math.floor(Math.random() * BRAND_COLORS.length);
    const diff = idx === 4 || idx === 0 ? "easy" : "medium";
    return [idx, diff];
  }, []);

  const target = BRAND_COLORS[targetIndex];
  const [r, setR] = useState(0);
  const [g, setG] = useState(0);
  const [b, setB] = useState(0);

  useEffect(() => {
    setR(Math.floor(Math.random() * 255));
    setG(Math.floor(Math.random() * 255));
    setB(Math.floor(Math.random() * 255));
  }, [targetIndex]);

  const [completed, setCompleted] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showHint, setShowHint] = useState<string | null>(null);
  
  const hintIndexRef = useRef(0);
  const { hintsRemaining, canUseHint, submitHint } = useHints();

  const handleHint = () => {
    if (!canUseHint) return;
    const idx = hintIndexRef.current;
    if (idx >= target.hints.length) return;
    if (submitHint()) {
      setShowHint(target.hints[idx]);
      hintIndexRef.current = idx + 1;
      setTimeout(() => setShowHint(null), 5000);
    }
  };

  const handleCalibrate = () => {
    if (completed) return;
    
    const diff = Math.abs(r - target.r) + Math.abs(g - target.g) + Math.abs(b - target.b);
    
    if (diff < 45) {
      setR(target.r);
      setG(target.g);
      setB(target.b);
      setCompleted(true);
      setFeedback(null);
      setTimeout(onComplete, 2500);
    } else {
      const newWrongCount = wrongCount + 1;
      setWrongCount(newWrongCount);
      
      if (newWrongCount >= 2) {
        setFeedback("Auto-calibrating override...");
        let step = 0;
        const int = setInterval(() => {
          step += 15;
          setR(prev => prev < target.r ? Math.min(prev + 15, target.r) : Math.max(prev - 15, target.r));
          setG(prev => prev < target.g ? Math.min(prev + 15, target.g) : Math.max(prev - 15, target.g));
          setB(prev => prev < target.b ? Math.min(prev + 15, target.b) : Math.max(prev - 15, target.b));
          
          if (step > 300) {
            setR(target.r);
            setG(target.g);
            setB(target.b);
            clearInterval(int);
            setCompleted(true);
            setFeedback("System Override Complete!");
            setTimeout(onComplete, 2500);
          }
        }, 50);
      } else {
        setFeedback("Mismatch. Adjust frequencies & try again.");
        setTimeout(() => setFeedback(null), 2000);
      }
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex items-center gap-4 mb-2">
        <h3 className="font-display text-2xl font-bold text-secondary neon-text-purple">Color Calibration</h3>
        <HintButton hintsRemaining={hintsRemaining} canUseHint={canUseHint} onClick={handleHint} />
      </div>
      <p className="text-sm font-mono text-muted-foreground mb-6 text-center flex items-center justify-center gap-2">
        Adjust RGB to match the target. <span className="text-xs uppercase tracking-widest text-accent">({difficulty})</span>
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

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-2xl mb-8">
        <div className="flex-1 space-y-2">
          <div className="text-[10px] font-display uppercase tracking-[0.3em] text-muted-foreground/60 text-center">Target</div>
          <div 
            className="h-32 md:h-48 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/10"
            style={{ backgroundColor: `rgb(${target.r}, ${target.g}, ${target.b})` }}
          />
          <div className="text-center font-mono text-xs mt-2">{target.name}</div>
        </div>
        
        <div className="flex-1 space-y-2">
           <div className="text-[10px] font-display uppercase tracking-[0.3em] text-muted-foreground/60 text-center">Current</div>
           <div 
            className="h-32 md:h-48 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden"
            style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
          >
            {completed && (
              <motion.div 
                className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              >
                <Check className="w-12 h-12 text-white" />
              </motion.div>
            )}
          </div>
           <div className="text-center font-mono text-xs mt-2 text-muted-foreground">rgb({r}, {g}, {b})</div>
        </div>
      </div>

      <div className="w-full max-w-md space-y-6 glass-panel p-6 mb-8">
        {[
          { label: "R", val: r, set: setR, bg: "bg-red-500", accent: "text-red-500" },
          { label: "G", val: g, set: setG, bg: "bg-green-500", accent: "text-green-500" },
          { label: "B", val: b, set: setB, bg: "bg-blue-500", accent: "text-blue-500" }
        ].map(slider => (
          <div key={slider.label} className="space-y-3">
             <div className="flex justify-between items-center text-xs font-mono">
               <span className={`${slider.accent} font-bold`}>{slider.label}</span>
               <span>{slider.val}</span>
             </div>
             <input 
               type="range" min="0" max="255" value={slider.val}
               onChange={(e) => slider.set(parseInt(e.target.value))}
               disabled={completed}
               className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${slider.bg}`}
               style={{ opacity: completed ? 0.5 : 1 }}
             />
          </div>
        ))}
      </div>

       <div className="w-full max-w-sm flex flex-col items-center">
          {feedback && (
            <motion.div
              className={`text-sm font-mono mb-4 ${completed && feedback === "Auto-calibrated!" ? 'text-green-400' : 'text-destructive'}`}
              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            >
              {feedback}
            </motion.div>
          )}

          <motion.button
            onClick={handleCalibrate}
            disabled={completed}
            className="w-full relative px-8 py-4 rounded-2xl font-display font-black text-lg tracking-widest overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed border border-secondary/30"
            whileHover={!completed ? { scale: 1.02 } : {}}
            whileTap={!completed ? { scale: 0.98 } : {}}
          >
             <div className="absolute inset-0 bg-secondary/10 group-hover:bg-secondary/20 transition-colors" />
             <span className="relative z-10 flex items-center justify-center gap-3 text-secondary">
              <Sliders className="w-5 h-5" />
              {completed ? "CALIBRATED" : "CALIBRATE"}
            </span>
          </motion.button>
       </div>
    </div>
  );
};

export default Level2;
