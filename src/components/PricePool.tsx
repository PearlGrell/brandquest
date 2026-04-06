import { motion } from "framer-motion";
import { Trophy, Sparkles, Star } from "lucide-react";

const PricePool = () => {
  return (
    <section className="relative z-10 py-20 overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div
          className="relative max-w-4xl mx-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full -z-10 animate-pulse-glow" />

          <div className="glass-panel-strong p-6 md:p-24 rounded-[2rem] md:rounded-[3rem] border-primary/20 text-center relative overflow-hidden group">
            {/* Animated background glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 blur-2xl opacity-50 transition-opacity duration-1000" />
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative z-10"
            >
              {/* Refined label */}
              <motion.div 
                className="inline-block mb-4 px-4 md:px-6 py-1.5 md:py-2 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-sm relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
                <span className="text-[9px] md:text-xs font-mono font-bold tracking-[0.2em] md:tracking-[0.3em] uppercase text-primary/80">
                  Total Prize Pool
                </span>
                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-neon" />
              </motion.div>

              <h2 className="text-5xl sm:text-6xl md:text-8xl lg:text-[10rem] font-display font-black tracking-tighter mb-4 py-4 leading-none select-none relative">
                <span className="cosmic-gradient-text animate-pulse-glow drop-shadow-[0_0_20px_rgba(var(--neon-pink),0.3)]">
                  ₹10,000+
                </span>
                
                {/* Floating particles/sparkles */}
                <motion.div
                  className="absolute -top-6 -right-6 md:-top-20 md:-right-20"
                  animate={{ 
                    rotate: [0, 90, 180, 270, 360],
                    scale: [1, 1.2, 1],
                    y: [0, -10, 0]
                  }}
                  transition={{ 
                    duration: 12, 
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <Sparkles className="w-10 h-10 md:w-32 md:h-32 text-primary/30 blur-[0.5px]" />
                </motion.div>

                <motion.div
                  className="absolute -bottom-6 -left-6 md:-bottom-16 md:-left-16"
                  animate={{ 
                    rotate: [-360, 0],
                    scale: [0.7, 1.1, 0.7],
                    x: [0, 10, 0]
                  }}
                  transition={{ 
                    duration: 18, 
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <Star className="w-8 h-8 md:w-20 md:h-20 text-accent/20 blur-[1px]" />
                </motion.div>
              </h2>

              <div className="flex justify-center items-center gap-4 md:gap-6 mt-4 md:mt-6">
                <div className="h-[1px] flex-1 max-w-[60px] md:max-w-[100px] bg-gradient-to-r from-transparent via-primary/30 to-primary/60" />
                <Trophy className="w-6 h-6 md:w-8 md:h-8 text-primary shadow-neon animate-float opacity-80" />
                <div className="h-[1px] flex-1 max-w-[60px] md:max-w-[100px] bg-gradient-to-l from-transparent via-primary/30 to-primary/60" />
              </div>
            </motion.div>

            {/* Decorative background orbits */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-white/5 rounded-full -z-10 animate-spin-slow opacity-20" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] border border-white/5 rounded-full -z-10 animate-reverse-spin-slow opacity-10" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricePool;
