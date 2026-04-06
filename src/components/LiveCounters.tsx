import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Rocket, Users, Zap, Clock } from "lucide-react";
import { getEventCounters } from "@/lib/apiClient";

const AnimatedNumber = ({ target, duration = 2000, id }: { target: number; duration?: number; id: string }) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.5 }
    );
    const el = document.getElementById(id);
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [id]);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = Math.max(target / (duration / 16), 0.1);
    const interval = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(interval);
  }, [started, target, duration]);

  return <span id={id}>{count}</span>;
};

const LiveCounters = () => {
  const [stats, setStats] = useState({
    teams: 0,
    participants: 0,
    challenges: 3,
    hours: 2
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getEventCounters();
        setStats(prev => ({
          ...prev,
          teams: data.teams,
          participants: data.participants
        }));
      } catch (error) {
        console.error("Failed to fetch live stats:", error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const counters = [
    { icon: Rocket, label: "Teams", value: stats.teams, color: "primary", glow: "neon-text" },
    { icon: Users, label: "Participants", value: stats.participants, color: "secondary", glow: "neon-text-purple" },
    { icon: Zap, label: "Challenges", value: stats.challenges, color: "accent", glow: "neon-text-blue" },
    { icon: Clock, label: "Hours", value: stats.hours, color: "primary", glow: "neon-text" },
  ];

  return (
    <section className="relative z-10 py-20">
      <div className="container mx-auto px-6">
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {counters.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.label}
                className="glass-panel-strong p-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Icon className={`w-7 h-7 text-${c.color} mx-auto mb-3 animate-pulse-glow`} />
                <div className={`text-4xl md:text-5xl font-display font-black text-${c.color} ${c.glow} mb-1`}>
                  <AnimatedNumber target={c.value} id={`counter-${c.label}`} />
                </div>
                <div className="text-xs font-mono text-muted-foreground tracking-[0.2em] uppercase">{c.label}</div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default LiveCounters;
