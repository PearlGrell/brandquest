import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { HelpCircle, ChevronDown, Rocket, Users, Shield, Zap, X } from "lucide-react";

const HelpItem = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/5 last:border-0 group">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left hover:text-primary transition-colors duration-300"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-white/5 group-hover:bg-primary/10 transition-colors ${isOpen ? "text-primary bg-primary/10" : "text-muted-foreground"}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className={`font-display text-xs font-bold ${isOpen ? "text-primary" : "text-muted-foreground"}`}>{title}</span>
        </div>
        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : "text-muted-foreground/30"}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pb-6 pl-11 pr-4 font-mono text-[10px] leading-relaxed text-muted-foreground/70">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AuthHelp = () => {
  const [show, setShow] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
            className="absolute bottom-16 right-0 w-[320px] md:w-[380px] bg-[hsl(260,100%,4%)]/95 border border-white/10 rounded-2xl p-6 backdrop-blur-2xl shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-[10px] tracking-[0.3em] uppercase text-primary font-black">Event FAQ</h3>
                    <p className="text-[9px] font-mono text-muted-foreground/40 mt-0.5">Authorization Guidelines</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShow(false)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-muted-foreground/50 hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <HelpItem title="Team vs. Solo Registration" icon={Users}>
                  <p className="mb-2">Choose <span className="text-foreground">Team Mode</span> if you already have 2-3 members. One person (Leader) registers everyone in a single transmission.</p>
                  <p>Choose <span className="text-foreground">Solo Mode</span> if you are joining the journey alone. We will pair you with a team later.</p>
                </HelpItem>

                <HelpItem title="How to Access Dashboard?" icon={Zap}>
                  <p className="mb-2">If you registered as a <span className="text-foreground uppercase italic">Team</span>, use your unique <span className="text-primary font-bold">Team ID</span> (like CEL-XXXXX).</p>
                  <p>If you registered as a <span className="text-foreground uppercase italic">Soloist</span>, login using your <span className="text-primary font-bold">Roll Number</span> (like 2024UG1234).</p>
                </HelpItem>

                <HelpItem title="Password Protocol" icon={Shield}>
                  <p className="mb-3">Each registration is protected by a password. All members in a team share the Team Password.</p>
                  <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                    <p className="text-accent font-bold">⚠ Joined a team afterwards?</p>
                    <p className="mt-1">Ask your team leader to provide the team's access password.</p>
                  </div>
                </HelpItem>

                <HelpItem title="Squad Recruitment" icon={Rocket}>
                  <p className="mb-2">Soloist? You can <strong>match with an existing team</strong> directly from your dashboard's recruitment hub. Simply enlist in a team that has open slots!</p>
                  <p>Incomplete teams (2 persons) will also be matched with soloists by the organizers once registration concludes.</p>
                </HelpItem>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShow(!show)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(var(--primary),0.2)] relative overflow-hidden group transition-all duration-500 ${
          show 
            ? 'cosmic-gradient rotate-90 text-primary-foreground' 
            : 'bg-primary/10 border border-primary/40 text-primary hover:bg-primary/20'
        }`}
      >
        <span className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        <div className="absolute inset-0 animate-pulse-glow opacity-20 pointer-events-none" />
        {show ? <X className="w-6 h-6 relative z-10" /> : <HelpCircle className="w-6 h-6 relative z-10" />}
      </motion.button>
    </div>
  );
};

export default AuthHelp;
