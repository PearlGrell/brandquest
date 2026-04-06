import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import StarField from "@/components/StarField";
import Navbar from "@/components/Navbar";
import { Clock, Users, Trophy, Zap, BookOpen, ArrowRight } from "lucide-react";

const About = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("celestio_session");

  return (
    <div className="relative min-h-screen">
      <StarField />
      <Navbar />
      <div className="relative z-10 pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          {/* Header */}
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.span
              className="text-xs font-mono text-accent tracking-[0.3em] uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              About Celestio
            </motion.span>
            <h1 className="font-display text-5xl md:text-6xl font-black cosmic-gradient-text mt-4 mb-4">
              BRAND'QUEST
            </h1>
            <p className="font-mono text-muted-foreground/70 text-lg max-w-2xl mx-auto">
              A dynamic competition testing creativity, design, and coding skills across three immersive rounds
            </p>
            <motion.div
              className="mx-auto mt-6 h-[1px] cosmic-gradient rounded-full"
              initial={{ width: 0 }}
              animate={{ width: "12rem" }}
              transition={{ delay: 0.3, duration: 0.8 }}
            />
          </motion.div>

          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-16">
            {[
              { icon: Clock, label: "Duration", value: "120 Min" },
              { icon: Users, label: "Team Size", value: "2-3 People" },
              { icon: Trophy, label: "Prize Pool", value: "10K+" },
              { icon: Zap, label: "Rounds", value: "3 Stages" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="glass-panel p-4 border border-white/5 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <stat.icon className="w-6 h-6 text-accent mx-auto mb-2 opacity-60" />
                <div className="text-xs font-mono text-muted-foreground/60 tracking-widest uppercase mb-1">{stat.label}</div>
                <div className="font-display text-xl font-bold text-primary">{stat.value}</div>
              </motion.div>
            ))}
          </div>

          {/* Round Details */}
          <motion.div
            className="mb-16 space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="font-display text-3xl font-bold cosmic-gradient-text mb-8">Three Stages of Excellence</h2>

            {[
              {
                num: 1,
                title: "QR Hunt Challenge",
                duration: "30 Minutes",
                description: "Navigate physical locations to scan QR codes and unlock digital clues. Teams race against time to collect random digits and complete the brand name puzzle.",
                icon: "🔍",
                color: "text-primary",
              },
              {
                num: 2,
                title: "Brand Identity Design",
                duration: "30 Minutes",
                description: "Transform collected digits into design constraints. Create stunning brand logos and promotional banners using your creative expertise. Top 70% advance to the final round.",
                icon: "🎨",
                color: "text-secondary",
              },
              {
                num: 3,
                title: "Cosmic Code Challenge",
                duration: "60 Minutes",
                description: "Code, debug, and design interactive web interfaces. Combine technical skills with creative UI/UX to build a working frontend for your unique brand. Judged on design quality, functionality, and brand consistency.",
                icon: "⚡",
                color: "text-accent",
              },
            ].map((round, i) => (
              <motion.div
                key={round.num}
                className="glass-panel p-6 md:p-8 border border-white/5 hover:border-primary/20 transition-all"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
              >
                <div className="flex items-start gap-6">
                  <div className={`text-5xl ${round.color}`}>{round.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3 mb-2">
                      <h3 className="font-display text-2xl font-bold text-foreground">{round.title}</h3>
                      <span className="text-xs font-mono text-muted-foreground/60 bg-white/5 px-3 py-1 rounded-full">
                        {round.duration}
                      </span>
                    </div>
                    <p className="font-mono text-muted-foreground/80 leading-relaxed">{round.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Judging Criteria */}
          <motion.div
            className="mb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <h2 className="font-display text-3xl font-bold cosmic-gradient-text mb-6">Judging Criteria</h2>
            <div className="glass-panel p-6 md:p-8 border border-white/5 space-y-4">
              {[
                { title: "Creativity & Innovation", desc: "Originality and uniqueness of solutions across all rounds" },
                { title: "Technical Execution", desc: "Code quality, debugging accuracy, and implementation proficiency" },
                { title: "Brand Consistency", desc: "Alignment between design decisions and brand identity" },
                { title: "Time Management", desc: "Efficient completion within allocated timeframes" },
                { title: "User Experience", desc: "Interface design quality, responsiveness, and usability" },
                { title: "Problem Solving", desc: "Creative approaches to constraints and challenges" },
              ].map((criterion, i) => (
                <motion.div
                  key={criterion.title}
                  className="flex items-start gap-3 pb-4 border-b border-white/5 last:border-0 last:pb-0"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.05 }}
                >
                  <Zap className="w-4 h-4 text-accent mt-1 shrink-0" />
                  <div>
                    <div className="font-display font-bold text-foreground mb-1">{criterion.title}</div>
                    <div className="font-mono text-sm text-muted-foreground/70">{criterion.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Rules & Guidelines */}
          <motion.div
            className="mb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <h2 className="font-display text-3xl font-bold cosmic-gradient-text mb-6">Essential Rules</h2>
            <div className="glass-panel p-6 md:p-8 border border-white/5 space-y-3">
              {[
                "Teams must be 2-3 members strong (or solo with matchup option)",
                "Round 1: Navigate in-person QR code locations — no spoilers allowed!",
                "Round 2: Use laptops/devices you bring yourself for design work",
                "Round 3: Write frontend code during the event, no pre-written templates",
                "All work must be original and created during the event",
                "Respect all safety and venue guidelines throughout",
                "Teams will be disqualified for violation of academic integrity",
              ].map((rule, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.0 + i * 0.05 }}
                >
                  <span className="text-accent font-bold shrink-0">▸</span>
                  <p className="font-mono text-sm text-muted-foreground/80">{rule}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            className="text-center py-12 border-t border-border/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <h3 className="font-display text-2xl font-bold cosmic-gradient-text mb-4">Ready to take the challenge?</h3>
            <p className="font-mono text-muted-foreground mb-8">Join teams of creative minds and skilled coders</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isLoggedIn ? (
                <>
                  <Link
                    to="/dashboard"
                    className="flex items-center justify-center gap-2 px-8 py-4 cosmic-gradient rounded-xl font-display font-bold text-primary-foreground neon-glow hover:scale-105 transition-transform"
                  >
                    Go to Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="flex items-center justify-center gap-2 px-8 py-4 cosmic-gradient rounded-xl font-display font-bold text-primary-foreground neon-glow hover:scale-105 transition-transform"
                  >
                    Register Now <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-2 px-8 py-4 border border-primary/30 rounded-xl font-display font-bold text-primary hover:border-primary/60 transition-all"
                  >
                    <BookOpen className="w-4 h-4" /> Already Registered
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default About;
