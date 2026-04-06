import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lightbulb } from "lucide-react";
import { useHints } from "@/hooks/useHints";
import { HintButton } from "./Level1";

interface CodeLine {
  id: number;
  code: string;
  buggy: boolean;
  fix: string;
  hint: string;
}

const CODE_SETS: { lines: CodeLine[]; hints: string[] }[] = [
  {
    lines: [
      { id: 0, code: 'if (user = loggedIn) {', buggy: true, fix: 'if (user === loggedIn) {', hint: "Assignment vs comparison" },
      { id: 1, code: '  console.log("Welcome");', buggy: false, fix: '  console.log("Welcome");', hint: "" },
      { id: 2, code: '  data = fetchData();', buggy: true, fix: '  const data = fetchData();', hint: "Missing declaration" },
      { id: 3, code: '  for (let i = 0; i <= data.lenght; i++) {', buggy: true, fix: '  for (let i = 0; i < data.length; i++) {', hint: "Typo + off-by-one" },
      { id: 4, code: '    render(data[i]);', buggy: false, fix: '    render(data[i]);', hint: "" },
      { id: 5, code: '  }', buggy: false, fix: '  }', hint: "" },
      { id: 6, code: '}', buggy: false, fix: '}', hint: "" },
    ],
    hints: [
      "Line 1 has an assignment operator where a comparison should be.",
      "Line 3 is missing a keyword for variable declaration.",
      "Line 4 has a typo in a property name and a boundary error.",
      "Only 3 lines have bugs — don't click the clean ones!",
    ],
  },
  {
    lines: [
      { id: 0, code: 'function launch(rocket) {', buggy: false, fix: 'function launch(rocket) {', hint: "" },
      { id: 1, code: '  let fuel = rocket.getFule();', buggy: true, fix: '  let fuel = rocket.getFuel();', hint: "Method name typo" },
      { id: 2, code: '  if (fuel > 0) {', buggy: false, fix: '  if (fuel > 0) {', hint: "" },
      { id: 3, code: '    rocket.ignite()', buggy: true, fix: '    rocket.ignite();', hint: "Missing semicolon" },
      { id: 4, code: '    console.log("Liftoff!");', buggy: false, fix: '    console.log("Liftoff!");', hint: "" },
      { id: 5, code: '  } else {', buggy: false, fix: '  } else {', hint: "" },
      { id: 6, code: '    thorw new Error("No fuel");', buggy: true, fix: '    throw new Error("No fuel");', hint: "Keyword typo" },
      { id: 7, code: '  }', buggy: false, fix: '  }', hint: "" },
      { id: 8, code: '}', buggy: false, fix: '}', hint: "" },
    ],
    hints: [
      "Line 2 has a misspelled method name.",
      "Line 4 is missing statement termination.",
      "Line 7 has a keyword typed wrong.",
      "Only 3 lines have bugs!",
    ],
  },
  {
    lines: [
      { id: 0, code: 'const stars = [];', buggy: false, fix: 'const stars = [];', hint: "" },
      { id: 1, code: 'for (let i = 0; i < 10; i--) {', buggy: true, fix: 'for (let i = 0; i < 10; i++) {', hint: "Wrong increment" },
      { id: 2, code: '  const star = createStar(i);', buggy: false, fix: '  const star = createStar(i);', hint: "" },
      { id: 3, code: '  star.brightnes = Math.random();', buggy: true, fix: '  star.brightness = Math.random();', hint: "Property typo" },
      { id: 4, code: '  stars.push(star);', buggy: false, fix: '  stars.push(star);', hint: "" },
      { id: 5, code: '}', buggy: false, fix: '}', hint: "" },
      { id: 6, code: 'retrun stars;', buggy: true, fix: 'return stars;', hint: "Keyword typo" },
    ],
    hints: [
      "Line 2 has the wrong direction of counting.",
      "Line 4 has a misspelled property.",
      "Line 7 has a keyword typed backwards.",
      "3 bugs total — look for typos and logic errors.",
    ],
  },
];

const Level3 = ({ onComplete }: { onComplete: () => void }) => {
  const [setIndex, difficulty] = useMemo(() => {
    const session = localStorage.getItem("celestio_session");
    let seed = 42;
    if (session) {
      try {
        const id = JSON.parse(session).teamId || "";
        seed = id.charCodeAt(4) || 42;
      } catch { /* fallback */ }
    }

    const set = seed % CODE_SETS.length;
    const diff = CODE_SETS[set].lines.some((l, i) => l.buggy && [0, 2, 6].includes(i % 4)) ? "easy" :
      CODE_SETS[set].lines.some((l, i) => l.buggy && [1, 3, 7].includes(i % 5)) ? "hard" : "medium";
    return [set, diff];
  }, []);

  const { lines: CODE_LINES, hints: HINTS } = CODE_SETS[setIndex];
  const totalBugs = CODE_LINES.filter((l) => l.buggy).length;

  const [fixed, setFixed] = useState<Set<number>>(new Set());
  const [wrongClick, setWrongClick] = useState<number | null>(null);
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

  const handleLineClick = (line: CodeLine) => {
    if (completed) return;
    if (line.buggy && !fixed.has(line.id)) {
      const newFixed = new Set(fixed).add(line.id);
      setFixed(newFixed);
      if (newFixed.size === totalBugs) {
        setCompleted(true);
        setTimeout(onComplete, 1500);
      }
    } else if (!line.buggy) {
      setWrongClick(line.id);
      setTimeout(() => setWrongClick(null), 500);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-4 mb-2">
        <h3 className="font-display text-2xl font-bold text-accent neon-text-blue">System Debug</h3>
        <HintButton hintsRemaining={hintsRemaining} canUseHint={canUseHint} onClick={handleHint} />
      </div>
      <p className="text-sm font-mono text-muted-foreground mb-6 flex items-center justify-center gap-2">
        Click on the buggy lines to fix them.
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

      <div className="glass-panel p-6 font-mono text-sm max-w-lg w-full">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/30">
          <span className="text-xs font-display text-muted-foreground">main.js</span>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${completed ? "bg-green-500" : "bg-destructive"}`} />
            <span className="text-xs text-muted-foreground">{fixed.size}/{totalBugs} bugs fixed</span>
          </div>
        </div>
        {CODE_LINES.map((line) => {
          const isFixed = fixed.has(line.id);
          return (
            <motion.div
              key={line.id}
              className={`px-3 py-2 rounded cursor-pointer transition-all duration-200 flex items-center gap-3 group ${isFixed
                  ? "bg-accent/10 text-accent border-l-2 border-accent"
                  : wrongClick === line.id
                    ? "bg-destructive/10 text-destructive"
                    : "hover:bg-primary/10 text-foreground/80 border-l-2 border-transparent"
                }`}
              onClick={() => handleLineClick(line)}
              animate={wrongClick === line.id ? { x: [0, -4, 4, -4, 0] } : {}}
            >
              <span className="text-muted-foreground/40 w-5 text-right text-xs select-none font-mono">{line.id + 1}</span>
              <code className="flex-1 font-mono text-sm whitespace-pre-wrap break-words">{isFixed ? line.fix : line.code}</code>
              {isFixed && <Check className="w-3 h-3 text-accent ml-auto" />}
              {line.buggy && !isFixed && (
                <span className="w-1.5 h-1.5 rounded-full bg-destructive/60 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </motion.div>
          );
        })}
      </div>
      {completed && (
        <motion.div
          className="mt-4 flex items-center gap-2 text-accent font-display neon-text-blue"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Check className="w-5 h-5" /> System Debugged!
        </motion.div>
      )}
    </div>
  );
};

export default Level3;
