import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lightbulb, RefreshCcw } from "lucide-react";
import { useHints } from "@/hooks/useHints";
import { HintButton } from "./Level1";

const COLORS = [
  { id: "red", color: "#EF4444" },
  { id: "blue", color: "#3B82F6" },
  { id: "green", color: "#10B981" },
  { id: "yellow", color: "#F59E0B" },
];

interface Point {
  x: number;
  y: number;
}

const Level3 = ({ onComplete }: { onComplete: () => void }) => {
  const [leftNodes] = useState(COLORS);
  const [rightNodes, setRightNodes] = useState([...COLORS].sort(() => Math.random() - 0.5));
  
  const [connections, setConnections] = useState<{from: string, to: string, color: string}[]>([]);
  const [activeWire, setActiveWire] = useState<{from: string, color: string, pos: Point} | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(400);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const [completed, setCompleted] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const { hintsRemaining, canUseHint, submitHint } = useHints();
  const [showHint, setShowHint] = useState<string | null>(null);

  const handleHint = () => {
    if (!canUseHint) return;
    if (submitHint()) {
      setShowHint("Connect the matching colors. Drag from the left port to the right port.");
      setTimeout(() => setShowHint(null), 5000);
    }
  };

  const getPointerPos = (e: React.PointerEvent | PointerEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (id: string, color: string, e: React.PointerEvent) => {
    if (completed) return;
    // Remove existing connection for this node
    setConnections(prev => prev.filter(c => c.from !== id));
    (e.target as HTMLElement).releasePointerCapture(e.pointerId); // Allows pointer events on underlying elements
    setActiveWire({ from: id, color, pos: getPointerPos(e) });
  };

  const autoTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (activeWire) {
        setActiveWire({ ...activeWire, pos: getPointerPos(e) });
      }
    };
    
    const handleUp = (e: PointerEvent) => {
      if (activeWire) {
        // Find if we snapped to a right node
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const rightNodeEl = elements.find(el => el.getAttribute("data-right-node"));
        
        if (rightNodeEl) {
          const toId = rightNodeEl.getAttribute("data-right-node") as string;
          
          if (toId === activeWire.from) {
            // Correct connection
            setConnections(prev => [...prev.filter(c => c.to !== toId), { from: activeWire.from, to: toId, color: activeWire.color }]);
          } else {
            // Wrong connection
            const newWrongCount = wrongCount + 1;
            setWrongCount(newWrongCount);
            if (newWrongCount === 2 && !completed && !autoTimerRef.current) {
              setFeedback("Hint: Patching first port...");
              setActiveWire(null);
              let step = 0;
              // Find the first unconnected or incorrectly connected node
              const firstInvalidNode = COLORS.find(c => !connections.some(conn => conn.from === c.id && conn.to === c.id));
              
              if (firstInvalidNode) {
                autoTimerRef.current = setInterval(() => {
                  setConnections(prev => [...prev.filter(p => p.from !== firstInvalidNode.id), { from: firstInvalidNode.id, to: firstInvalidNode.id, color: firstInvalidNode.color }]);
                  if (autoTimerRef.current) {
                    clearInterval(autoTimerRef.current);
                    autoTimerRef.current = null;
                  }
                  setFeedback("Port patched. Root the remaining relays!");
                  setTimeout(() => setFeedback(null), 3000);
                }, 600);
              }
            } else if (newWrongCount >= 4 && !completed && !autoTimerRef.current) {
              // Auto Complete with staggered animation
              setActiveWire(null);
              setFeedback("System Override Initiated. Patching...");
              
              let step = 0;
              autoTimerRef.current = setInterval(() => {
                const c = COLORS[step];
                if (c) {
                  setConnections(prev => [...prev.filter(p => p.from !== c.id), { from: c.id, to: c.id, color: c.color }]);
                  step++;
                } else {
                  if (autoTimerRef.current) {
                    clearInterval(autoTimerRef.current);
                    autoTimerRef.current = null;
                  }
                  setCompleted(true);
                  setFeedback("Override applied. Ports patched automatically.");
                  setTimeout(onComplete, 2500);
                }
              }, 400);
            } else if (newWrongCount < 2) {
              setFeedback("Mismatched frequencies detected! Try again.");
              setTimeout(() => setFeedback(null), 2000);
            } else if (newWrongCount === 3) {
              setFeedback("Override required for remaining ports? One last attempt...");
              setTimeout(() => setFeedback(null), 2000);
            }
          }
        }
        setActiveWire(null);
      }
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      if (autoTimerRef.current) {
        clearInterval(autoTimerRef.current);
      }
    };
  }, [activeWire, wrongCount, completed]);

  useEffect(() => {
    if (connections.length === COLORS.length && !completed) {
      setCompleted(true);
      setFeedback("System effectively patched.");
      setTimeout(onComplete, 2500);
    }
  }, [connections]);

  const drawBezier = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = Math.abs(x2 - x1) * 0.5;
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  };

  // Fixed positions for standard container sizes
  const nodeY = (index: number) => 60 + index * 80;

  return (
    <div className="flex flex-col items-center w-full select-none">
      <div className="flex items-center gap-4 mb-2">
        <h3 className="font-display text-2xl font-bold text-accent neon-text-blue">System Patch</h3>
        <HintButton hintsRemaining={hintsRemaining} canUseHint={canUseHint} onClick={handleHint} />
      </div>
      <p className="text-sm font-mono text-muted-foreground mb-6 text-center">
        Route the high-frequency cables to their corresponding ports. Drag to connect!
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

      <div 
        ref={containerRef}
        className="w-full max-w-[400px] h-[380px] bg-[hsl(260,100%,3%)]/80 backdrop-blur-md rounded-3xl border-2 border-white/10 relative overflow-hidden shadow-2xl mb-6 touch-none"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent)] pointer-events-none" />

        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.2))" }}>
          {/* Render established connections */}
          {connections.map((conn) => {
            const leftIdx = leftNodes.findIndex(n => n.id === conn.from);
            const rightIdx = rightNodes.findIndex(n => n.id === conn.to);
            const d = drawBezier(40, nodeY(leftIdx), containerWidth - 40, nodeY(rightIdx));
            return (
              <g key={conn.from}>
                <path
                  d={d}
                  fill="none" stroke={conn.color} strokeWidth="12" strokeLinecap="round"
                  className="transition-all duration-300 drop-shadow-[0_0_12px_currentColor]"
                  style={{ filter: "brightness(1.2)" }}
                />
                <path
                  d={d}
                  fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round"
                  className="opacity-50"
                  strokeDasharray="10 20"
                >
                  <animate attributeName="stroke-dashoffset" from="100" to="0" dur="1s" repeatCount="indefinite" />
                </path>
              </g>
            );
          })}

          {/* Render active dragging wire */}
          {activeWire && (
            <path
              d={drawBezier(40, nodeY(leftNodes.findIndex(n => n.id === activeWire.from)), activeWire.pos.x, activeWire.pos.y)}
              fill="none" stroke={activeWire.color} strokeWidth="12" strokeLinecap="round"
              className="drop-shadow-[0_0_15px_currentColor]"
              style={{ filter: "brightness(1.5)" }}
            />
          )}
        </svg>

        {/* Nodes */}
        {leftNodes.map((node, i) => (
          <div
            key={`left-${node.id}`}
            className="absolute left-6 w-8 h-8 rounded-full border-4 border-[hsl(260,100%,10%)] cursor-pointer z-20 hover:scale-110 active:scale-90 transition-transform shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center group"
            style={{ top: nodeY(i) - 16, backgroundColor: node.color, boxShadow: `0 0 20px ${node.color}50` }}
            onPointerDown={(e) => handlePointerDown(node.id, node.color, e)}
          >
             <div className="w-3 h-3 rounded-full bg-black/40" />
          </div>
        ))}
        
        {rightNodes.map((node, i) => {
          const isConnected = connections.some(c => c.to === node.id);
          return (
            <div
              key={`right-${node.id}`}
              data-right-node={node.id}
              className="absolute right-6 w-8 h-8 rounded-full border-4 border-dashed cursor-crosshair z-20 flex items-center justify-center transition-all bg-[hsl(260,100%,10%)]"
              style={{ 
                top: nodeY(i) - 16, 
                borderColor: isConnected ? node.color : "rgba(255,255,255,0.2)",
                boxShadow: isConnected ? `0 0 20px ${node.color}` : "inset 0 0 10px rgba(0,0,0,0.8)"
              }}
            >
               <div 
                 className={`w-3 h-3 rounded-full transition-colors ${isConnected ? 'bg-white' : 'bg-transparent'}`} 
                 style={{ backgroundColor: isConnected ? node.color : undefined }}
               />
               
               {/* Color Hint for right side */}
               <div 
                className="absolute right-12 w-4 h-1 rounded-full opacity-30"
                style={{ backgroundColor: node.color }}
               />
            </div>
          );
        })}
        
        {completed && (
          <motion.div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center flex-col gap-4 text-center p-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          >
            <Check className="w-16 h-16 text-primary neon-text" />
            <div className="font-display text-2xl font-black cosmic-gradient-text">SYSTEM PATCHED</div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            className={`text-sm font-mono mt-2 ${completed ? 'text-green-400' : 'text-destructive'}`}
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => {
          if (!completed) {
            setConnections([]);
            setRightNodes(prev => [...prev].sort(() => Math.random() - 0.5));
          }
        }}
        disabled={completed}
        className="mt-4 flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-white transition-colors disabled:opacity-50"
      >
        <RefreshCcw className="w-4 h-4" /> Reset Output Relays
      </button>
    </div>
  );
};

export default Level3;
