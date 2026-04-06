import { motion } from "framer-motion";
import { QrCode, Palette, Code2, Trophy, ArrowRight } from "lucide-react";

const rounds = [
  {
    icon: QrCode,
    title: "QR Hunt",
    duration: "30 min",
    description: "Scan hidden QR codes across campus to collect cosmic coordinates and unlock secret data.",
    color: "primary",
    number: "01",
  },
  {
    icon: Palette,
    title: "Brand Identity",
    duration: "30 min",
    description: "Craft a complete brand identity system using collected constraints and cosmic inspiration.",
    color: "secondary",
    number: "02",
  },
  {
    icon: Code2,
    title: "Frontend Build",
    duration: "60 min",
    description: "Transform your brand vision into a fully functional, responsive frontend implementation.",
    color: "accent",
    number: "03",
  },
  {
    icon: Trophy,
    title: "Final Verdict",
    duration: "Results",
    description: "Top teams ranked by execution speed, design excellence & code quality metrics.",
    color: "primary",
    number: "04",
  },
];

const colorMap: Record<string, { text: string; border: string; bg: string; glow: string }> = {
  primary: { text: "text-primary", border: "border-primary/30", bg: "bg-primary/5", glow: "neon-glow" },
  secondary: { text: "text-secondary", border: "border-secondary/30", bg: "bg-secondary/5", glow: "neon-glow-purple" },
  accent: { text: "text-accent", border: "border-accent/30", bg: "bg-accent/5", glow: "neon-glow-blue" },
};

const EventTimeline = () => {
  return (
    <section className="relative z-10 py-28" id="mission">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <motion.span
            className="inline-block text-sm font-mono text-accent tracking-[0.3em] uppercase mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Event Phases
          </motion.span>
          <h2 className="text-4xl md:text-6xl font-display font-black cosmic-gradient-text">
            Mission Briefing
          </h2>
          <motion.div
            className="mx-auto mt-4 h-[2px] cosmic-gradient rounded-full"
            initial={{ width: 0 }}
            whileInView={{ width: "12rem" }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
          />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {rounds.map((round, i) => {
            const Icon = round.icon;
            const colors = colorMap[round.color];
            return (
              <motion.div
                key={round.title}
                className={`glass-panel-strong p-8 relative border ${colors.border}`}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
              >
                {/* Large background number */}
                <span className="absolute -top-2 -right-2 text-[5rem] font-display font-black text-foreground/[0.03] leading-none select-none">
                  {round.number}
                </span>

                <div className="flex items-start gap-5">
                  <div className={`p-3 rounded-xl ${colors.bg} ${colors.border} border shrink-0`}>
                    <Icon className={`w-7 h-7 ${colors.text}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-display text-lg font-bold text-foreground">{round.title}</h3>
                      <span className={`text-xs font-mono ${colors.text} px-3 py-1 rounded-full ${colors.bg} border ${colors.border}`}>
                        {round.duration}
                      </span>
                    </div>
                    <p className="text-sm font-body text-muted-foreground leading-relaxed">{round.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
                
      </div>
    </section>
  );
};

export default EventTimeline;
