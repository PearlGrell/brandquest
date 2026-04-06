import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lightbulb, Sparkles } from "lucide-react";
import { useHints } from "@/hooks/useHints";
import { HintButton } from "./Level1";

interface DesignElement {
  id: string;
  name: string;
  type: "Typography" | "Color" | "Feature" | "Style";
  satisfies: string[];
  visual?: {
    fontFamily?: string;
    color?: string;
    className?: string;
    description?: string;
  };
}

interface ConstraintSet {
  brandName: string;
  difficulty: "easy" | "medium" | "hard";
  constraints: { id: string; name: string; description: string }[];
  designElements: DesignElement[];
  correctSelection: string[];
  hints: string[];
}

const CONSTRAINT_SETS: ConstraintSet[] = [
  {
    brandName: "EchoVerse",
    difficulty: "easy",
    constraints: [
      { id: "c1", name: "Minimalist Style", description: "Clean, simple design" },
      { id: "c2", name: "Blue Palette", description: "Cool tones preferred" },
      { id: "c3", name: "Tech-Savvy Audience", description: "Modern & innovative" },
    ],
    designElements: [
      { id: "e1", name: "Bold Sans-Serif", type: "Typography", satisfies: ["c1", "c3"], visual: { fontFamily: "'Space Grotesk', sans-serif" } },
      { id: "e2", name: "Serifs & Flourishes", type: "Typography", satisfies: [], visual: { fontFamily: "serif" } },
      { id: "e3", name: "Ocean Blue (#0066FF)", type: "Color", satisfies: ["c2"], visual: { color: "#0066FF" } },
      { id: "e4", name: "Warm Gold (#FFD700)", type: "Color", satisfies: [], visual: { color: "#FFD700" } },
      { id: "e5", name: "Geometric Icon Set", type: "Feature", satisfies: ["c1", "c3"], visual: { className: "border-2 border-primary/40 rounded-lg p-2" } },
    ],
    correctSelection: ["e1", "e3", "e5"],
    hints: [
      "Choose typography that's clean and modern.",
      "Pick a color that matches the blue palette.",
      "Select a feature that feels minimalist yet innovative.",
    ],
  },
  {
    brandName: "LunarGlow",
    difficulty: "medium",
    constraints: [
      { id: "c1", name: "Luxury Feel", description: "Premium, elegant" },
      { id: "c2", name: "Purple & Silver", description: "Regal color scheme" },
      { id: "c3", name: "High-End Audience", description: "Sophisticated market" },
    ],
    designElements: [
      { id: "e1", name: "Elegant Serif Font", type: "Typography", satisfies: ["c1", "c3"], visual: { fontFamily: "'Orbitron', serif" } },
      { id: "e2", name: "Playful Rounded", type: "Typography", satisfies: [], visual: { fontFamily: "cursive" } },
      { id: "e3", name: "Royal Purple (#7B2CBF)", type: "Color", satisfies: ["c2"], visual: { color: "#7B2CBF" } },
      { id: "e4", name: "Neon Green (#39FF14)", type: "Color", satisfies: [], visual: { color: "#39FF14" } },
      { id: "e5", name: "Metallic Accents", type: "Feature", satisfies: ["c1", "c2"], visual: { className: "neon-glow-purple", description: "Silver sheen" } },
      { id: "e6", name: "Bold Neon Glow", type: "Feature", satisfies: [], visual: { className: "neon-text-blue" } },
    ],
    correctSelection: ["e1", "e3", "e5"],
    hints: [
      "Choose typography that exudes elegance.",
      "Pick the color that matches the royal scheme.",
      "Select metallic elements for luxury.",
    ],
  },
  {
    brandName: "FuturePulse",
    difficulty: "hard",
    constraints: [
      { id: "c1", name: "Cyberpunk Aesthetic", description: "Futuristic, bold" },
      { id: "c2", name: "Neon Colors", description: "Bright, electric palette" },
      { id: "c3", name: "Gen-Z Audience", description: "Young, edgy market" },
    ],
    designElements: [
      { id: "e1", name: "Geometric Bold Font", type: "Typography", satisfies: ["c1", "c3"], visual: { fontFamily: "'Orbitron', monospace" } },
      { id: "e2", name: "Handwritten Script", type: "Typography", satisfies: [], visual: { fontFamily: "cursive" } },
      { id: "e3", name: "Neon Magenta (#FF006E)", type: "Color", satisfies: ["c2"], visual: { color: "#FF006E" } },
      { id: "e4", name: "Soft Pastel Pink", type: "Color", satisfies: [], visual: { color: "#FFB7C5" } },
      { id: "e5", name: "Glitch Effects", type: "Feature", satisfies: ["c1", "c2"], visual: { className: "animate-pulse", description: "Vibrant glitch" } },
      { id: "e6", name: "Soft Shadows", type: "Feature", satisfies: [], visual: { className: "shadow-lg shadow-black/50" } },
      { id: "e7", name: "Vaporwave Vibes", type: "Style", satisfies: ["c3"], visual: { className: "cosmic-gradient-subtle" } },
    ],
    correctSelection: ["e1", "e3", "e5"],
    hints: [
      "Choose a bold, geometric font for the cyberpunk vibe.",
      "Pick a bright neon color.",
      "Add glitch effects for that futuristic feel.",
    ],
  },
  {
    brandName: "AeroStream",
    difficulty: "medium",
    constraints: [
      { id: "c1", name: "Sleek & Fast", description: "Motion, aerodynamics" },
      { id: "c2", name: "Sky Blue Palette", description: "Airy, breathable" },
      { id: "c3", name: "Global Travel", description: "International, bold" },
    ],
    designElements: [
      { id: "e1", name: "Italic Sans-Serif", type: "Typography", satisfies: ["c1", "c3"], visual: { fontFamily: "italic 'Orbitron', sans-serif" } },
      { id: "e2", name: "Stable Slab-Serif", type: "Typography", satisfies: [], visual: { fontFamily: "'Space Grotesk', serif" } },
      { id: "e3", name: "Sky Blue (#00D2FF)", type: "Color", satisfies: ["c2"], visual: { color: "#00D2FF" } },
      { id: "e4", name: "Earthy Brown (#5D4037)", type: "Color", satisfies: [], visual: { color: "#5D4037" } },
      { id: "e5", name: "Motion Blur Trails", type: "Feature", satisfies: ["c1", "c2"], visual: { className: "blur-[0.5px] hover:blur-0 transition-all", description: "Fast motion" } },
      { id: "e6", name: "Static Borders", type: "Feature", satisfies: [], visual: { className: "border border-muted" } },
    ],
    correctSelection: ["e1", "e3", "e5"],
    hints: [
      "Speed is key—choose a font that looks like it's moving.",
      "The color of the sky fits this brand best.",
      "Look for features that imply movement or motion.",
    ],
  },
  {
    brandName: "BioRoot",
    difficulty: "easy",
    constraints: [
      { id: "c1", name: "Organic Texture", description: "Natural, raw" },
      { id: "c2", name: "Forest Green tones", description: "Earthy, sustainable" },
      { id: "c3", name: "Health Focused", description: "Well-being, organic" },
    ],
    designElements: [
      { id: "e1", name: "Soft Rounded Font", type: "Typography", satisfies: ["c1", "c3"], visual: { fontFamily: "'Rajdhani', sans-serif" } },
      { id: "e2", name: "Industrial Heavy", type: "Typography", satisfies: [], visual: { fontFamily: "black 'Orbitron'" } },
      { id: "e3", name: "Forest Green (#2ECC71)", type: "Color", satisfies: ["c2"], visual: { color: "#2ECC71" } },
      { id: "e4", name: "Candy Red (#FF4136)", type: "Color", satisfies: [], visual: { color: "#FF4136" } },
      { id: "e5", name: "Leaf Pattern Overlay", type: "Feature", satisfies: ["c1", "c2"], visual: { className: "bg-[url('https://www.transparenttextures.com/patterns/leaves.png')] opacity-20" } },
      { id: "e6", name: "Mirror Gloss", type: "Feature", satisfies: [], visual: { className: "bg-white/10 backdrop-blur-sm" } },
    ],
    correctSelection: ["e1", "e3", "e5"],
    hints: [
      "Nature isn't sharp—choose rounded typography.",
      "Go for the green that feels most like a forest.",
      "The leaf pattern matches the organic constraint.",
    ],
  },
];


function shuffleArray<T>(arr: T[]): T[] {
  const sorted = [...arr];
  for (let i = sorted.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
  }
  return sorted;
}

const Level2 = ({ onComplete }: { onComplete: () => void }) => {
  const [setIndex, difficulty] = useMemo(() => {
    const session = localStorage.getItem("celestio_session");
    let seed = 42;
    if (session) {
      try {
        const teamId = JSON.parse(session).teamId || "";
        seed = teamId.charCodeAt(4) || 42;
      } catch { /* fallback */ }
    }
    // Distribute difficulties: 0-2 = easy, 3-5 = medium, 6-8 = hard
    const set = seed % CONSTRAINT_SETS.length;
    const diff = CONSTRAINT_SETS[set].difficulty;
    return [set, diff];
  }, []);

  const set = CONSTRAINT_SETS[setIndex];
  const shuffledElements = useMemo(() => shuffleArray(set.designElements), [set]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [completed, setCompleted] = useState(false);
  const [showHint, setShowHint] = useState<string | null>(null);
  const [wrongAttempt, setWrongAttempt] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const hintIndexRef = useRef(0);
  const { hintsRemaining, canUseHint, submitHint } = useHints();

  const MAX_SELECTIONS = 3;

  const handleHint = () => {
    if (!canUseHint) return;
    const idx = hintIndexRef.current;
    if (idx >= set.hints.length) return;
    if (submitHint()) {
      setShowHint(set.hints[idx]);
      hintIndexRef.current = idx + 1;
      setTimeout(() => setShowHint(null), 5000);
    }
  };

  const toggleElement = (id: string) => {
    if (completed) return;
    const newSelected = new Set(selected);

    if (newSelected.has(id)) {
      newSelected.delete(id);
      setFeedback(null);
    } else {
      if (newSelected.size >= MAX_SELECTIONS) {
        setFeedback("Select exactly 3 elements!");
        setWrongAttempt(true);
        setTimeout(() => setWrongAttempt(false), 400);
        return;
      }
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const checkSelection = () => {
    if (completed) return;

    if (selected.size !== MAX_SELECTIONS) {
      setFeedback(`Select exactly ${MAX_SELECTIONS} elements!`);
      return;
    }

    const isCorrect = set.correctSelection.every((id) => selected.has(id));

    if (isCorrect) {
      setCompleted(true);
      setFeedback(null);
      setTimeout(onComplete, 2500);
    } else {
      setWrongAttempt(true);
      setFeedback("Not quite right. Try again!");
      setTimeout(() => setWrongAttempt(false), 500);
    }
  };

  const isSatisfying = (elementId: string): boolean => {
    const element = shuffledElements.find((e) => e.id === elementId);
    return element ? element.satisfies.length > 0 : false;
  };

  const getSatisfiedConstraints = (elementId: string): string[] => {
    const element = shuffledElements.find((e) => e.id === elementId);
    return element?.satisfies.map((id) => set.constraints.find((c) => c.id === id)?.name).filter(Boolean) as string[] || [];
  };

  const getSelectedStyles = () => {
    let style: React.CSSProperties = {};
    let classNames: string[] = [];

    selected.forEach((id) => {
      const element = shuffledElements.find((e) => e.id === id);
      if (element?.visual) {
        if (element.visual.fontFamily) style.fontFamily = element.visual.fontFamily;
        if (element.visual.color) style.color = element.visual.color;
        if (element.visual.className) classNames.push(element.visual.className);
      }
    });

    return { style, className: classNames.join(" ") };
  };

  const previewStyles = getSelectedStyles();

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex items-center gap-4 mb-2">
        <h3 className="font-display text-2xl font-bold text-secondary neon-text-purple">Brand Identity Builder</h3>
        <HintButton hintsRemaining={hintsRemaining} canUseHint={canUseHint} onClick={handleHint} />
      </div>
      <p className="text-sm font-mono text-muted-foreground mb-6 text-center">
        Select exactly 3 design elements that satisfy ALL constraints for{" "}
        <span className="font-bold text-primary">{set.brandName}</span>
        <span className="ml-2 text-xs uppercase tracking-widest text-accent">({set.difficulty})</span>
      </p>

      {/* Brand Preview Area */}
      <div className="w-full max-w-2xl mb-4 md:mb-8 relative">
        <div className="text-[10px] font-display uppercase tracking-[0.3em] text-muted-foreground/60 mb-2 px-1 flex justify-between items-center">
          <span>Brand Preview</span>
          <span className="hidden md:inline font-mono text-accent/50 lowercase">Real-time update</span>
        </div>
        <div className="h-32 md:h-40 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-md flex items-center justify-center overflow-hidden relative group">
          <div className="absolute inset-0 bg-grid-white/[0.01] bg-[size:15px_15px]" />
          <motion.div
            key={Array.from(selected).join("-")}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-3xl md:text-5xl font-bold transition-all duration-300 text-center z-10 px-4 ${previewStyles.className}`}
            style={previewStyles.style}
          >
            {set.brandName}
          </motion.div>
          
          {selected.size === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="font-mono text-[10px] text-muted-foreground/30 animate-pulse uppercase tracking-widest px-4 text-center">
                Select studio assets to build {set.brandName}
              </span>
            </div>
          )}
        </div>
      </div>

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

      {/* Constraints Section */}
      <div className="w-full max-w-2xl mb-4 md:mb-8 glass-panel p-4 md:p-5 border border-secondary/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="text-[10px] font-display uppercase tracking-[0.3em] text-muted-foreground/60 mb-3 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Requirements
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
          {set.constraints.map((constraint) => (
            <div key={constraint.id} className="p-2.5 rounded-xl border border-primary/10 bg-primary/5 hover:border-primary/30 transition-colors">
              <div className="font-display text-xs font-bold text-primary mb-0.5">{constraint.name}</div>
              <div className="text-[9px] leading-tight font-mono text-muted-foreground uppercase">{constraint.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Design Elements Selection */}
      <div className="w-full max-w-2xl mb-6 md:mb-10">
        <div className="text-[10px] font-display uppercase tracking-[0.3em] text-muted-foreground/60 mb-3 px-1 flex justify-between">
          <span>Studio Assets</span>
          <span className="font-mono text-[9px] text-muted-foreground/40 italic">Scroll to view all ↓</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {shuffledElements.map((element) => {
            const isSelected = selected.has(element.id);
            const isSatisfied = isSatisfying(element.id);

            return (
              <motion.button
                key={element.id}
                onClick={() => toggleElement(element.id)}
                className={`group relative overflow-hidden glass-panel p-5 text-left transition-all border-2 ${isSelected
                    ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.2)]"
                    : "border-muted-foreground/10 hover:border-primary/30 hover:bg-muted/5"
                  }`}
                whileHover={!completed ? { scale: 1.02, y: -2 } : {}}
                whileTap={!completed ? { scale: 0.98 } : {}}
                animate={wrongAttempt && !isSelected ? { x: [-2, 2, -2, 0] } : {}}
              >
                <div className="flex items-start gap-4 relative z-10">
                  <div
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${isSelected ? "bg-primary border-primary rotate-0" : "border-muted-foreground/30 rotate-45 group-hover:rotate-0"
                      }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-display font-bold text-foreground text-sm uppercase tracking-tight">{element.name}</div>
                      <div className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/20 text-muted-foreground/70">{element.type}</div>
                    </div>
                    
                    {/* Visual Preview in Button */}
                    <div className="mt-2 flex items-center gap-3">
                      {element.type === "Typography" && (
                        <div 
                          className="text-xl leading-none border-l-2 border-primary/20 pl-2 py-1 opacity-80"
                          style={{ fontFamily: element.visual?.fontFamily }}
                        >
                          Aa Bb
                        </div>
                      )}
                      {element.type === "Color" && (
                        <div className="flex items-center gap-2">
                           <div 
                            className="w-10 h-4 rounded-sm shadow-inner" 
                            style={{ backgroundColor: element.visual?.color }}
                          />
                          <span className="text-[10px] font-mono text-muted-foreground/50">{element.visual?.color}</span>
                        </div>
                      )}
                      {element.type === "Feature" && (
                        <div className="text-[10px] font-mono text-accent italic">
                          +{element.visual?.description || "Visual Effect"}
                        </div>
                      )}
                      {element.type === "Style" && (
                         <div className="w-full h-1 rounded-full cosmic-gradient opacity-30" />
                      )}
                    </div>

                    {(wrongAttempt || completed) && isSatisfied && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-[10px] font-mono text-accent mt-3 flex items-center gap-2 bg-accent/10 px-2 py-1 rounded"
                      >
                        <Sparkles className="w-3 h-3" />
                        Validates: {getSatisfiedConstraints(element.id).join(", ")}
                      </motion.div>
                    )}
                  </div>
                </div>
                
                {/* Decorative background element */}
                <div className="absolute -bottom-2 -right-2 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform">
                   {element.type === "Typography" && <span className="font-display text-4xl">T</span>}
                   {element.type === "Color" && <span className="font-display text-4xl">C</span>}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selection Status */}
      <div className="w-full max-w-2xl flex flex-col items-center">
        <motion.div
          className="text-xs font-mono mb-4 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 flex items-center gap-3"
          animate={wrongAttempt ? { scale: [1, 1.05, 1], backgroundColor: "rgba(var(--destructive), 0.1)" } : {}}
        >
          <div className="flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full transition-all duration-300 ${i <= selected.size ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),1)]" : "bg-muted/40"}`} 
              />
            ))}
          </div>
          <span className={selected.size === 3 ? "text-primary font-bold" : "text-muted-foreground"}>
            {selected.size} of 3 assets integrated
          </span>
        </motion.div>

        {feedback && (
          <motion.div
            className="text-sm font-mono text-destructive mb-4"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {feedback}
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.button
          onClick={checkSelection}
          disabled={completed}
          className="relative px-12 py-4 rounded-2xl font-display font-black text-lg tracking-widest overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={!completed ? { scale: 1.05 } : {}}
          whileTap={!completed ? { scale: 0.95 } : {}}
        >
           <div className="absolute inset-0 cosmic-gradient opacity-90 group-hover:opacity-100 transition-opacity" />
           <div className="absolute inset-0 neon-glow opacity-30 group-hover:opacity-50 transition-opacity" />
           <span className="relative z-10 flex items-center gap-3 text-primary-foreground drop-shadow-md">
            {completed ? (
              <>
                <Check className="w-6 h-6" /> BRAND APPROVED
              </>
            ) : (
              "FINALIZE IDENTITY"
            )}
          </span>
        </motion.button>

        {completed && (
          <motion.div
            className="mt-8 flex items-center gap-3 text-primary font-display text-xl neon-text-blue"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Sparkles className="w-6 h-6 animate-spin-slow" />
            TRANSMISSION SECURED
            <Sparkles className="w-6 h-6 animate-spin-slow" />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Level2;
