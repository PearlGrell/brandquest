import { Rocket, Heart } from "lucide-react";
import { motion } from "framer-motion";

const Footer = () => (
  <footer className="relative z-10 border-t border-border/20 py-10">
    <div className="container mx-auto px-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-2">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <motion.img src="/logo.png" alt="Celestio Logo" className="w-8 h-8"/>
          <span className="font-display text-sm font-bold cosmic-gradient-text">Brand'Quest</span>
        </motion.div>

        <motion.div
          className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground/60"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <span>Built with</span>
          <Heart className="w-3 h-3 text-primary fill-primary animate-pulse-glow" />
          <span>by Arcanum</span>
        </motion.div>
      </div>
    </div>
  </footer>
);

export default Footer;
