import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import StarField from "@/components/StarField";
import Navbar from "@/components/Navbar";
import { Trophy, Medal, Clock } from "lucide-react";
import { getLeaderboard, getEventStatus } from "@/lib/apiClient";

interface LeaderboardEntry {
  id: string;
  name: string;
  isSolo: boolean;
  scanCount: number;
  gamesCount: number;
}

const rankStyles: Record<number, { text: string; badge: string }> = {
  1: { text: "text-primary", badge: "cosmic-gradient text-primary-foreground" },
  2: { text: "text-secondary", badge: "bg-secondary/20 text-secondary border border-secondary/30" },
  3: { text: "text-accent", badge: "bg-accent/20 text-accent border border-accent/30" },
};

const Leaderboard = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventStarted, setEventStarted] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem("celestio_session");
    if (!session) {
      navigate("/login");
    } else {
      setIsLoggedIn(true);
      loadEventStatus();
    }
  }, [navigate]);

  const loadEventStatus = async () => {
    try {
      const data = await getEventStatus();
      setEventStarted(data.isStarted);
      if (data.isStarted) {
        loadLeaderboard();
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to load event status:", err);
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const data = await getLeaderboard();
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) return null;

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <StarField />
        <Navbar />
        <div className="relative z-10 pt-28 pb-16 px-4">
          <div className="container mx-auto max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <Trophy className="w-10 h-10 text-primary mx-auto mb-4" />
              <h2 className="font-display text-4xl md:text-5xl font-black cosmic-gradient-text mb-4">Leaderboard</h2>
              <p className="font-mono text-muted-foreground/50 text-sm">Loading...</p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (!eventStarted) {
    return (
      <div className="relative min-h-screen">
        <StarField />
        <Navbar />
        <div className="relative z-10 pt-28 pb-16 px-4">
          <div className="container mx-auto max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
              >
                <Clock className="w-10 h-10 text-accent mx-auto mb-4" />
              </motion.div>
              <h2 className="font-display text-4xl md:text-5xl font-black cosmic-gradient-text mb-2">Leaderboard</h2>
              <div className="mt-8 p-6 rounded-xl border border-accent/20 bg-accent/5">
                <p className="font-mono text-base text-muted-foreground mb-2">Event hasn't started yet</p>
                <p className="font-mono text-sm text-muted-foreground/50">The leaderboard will be available once the event begins</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  const topThree = leaderboard.slice(0, 3);
  const restTeams = leaderboard.slice(3);

  return (
    <div className="relative min-h-screen">
      <StarField />
      <Navbar />
      <div className="relative z-10 pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header */}
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
              >
                <Trophy className="w-10 h-10 text-primary mx-auto mb-4" />
              </motion.div>
              <h2 className="font-display text-4xl md:text-5xl font-black cosmic-gradient-text mb-2">Leaderboard</h2>
              <p className="font-mono text-muted-foreground/50 text-sm">Ranked by completion time</p>
              <motion.div
                className="mx-auto mt-4 h-[1px] cosmic-gradient rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "8rem" }}
                transition={{ delay: 0.3, duration: 0.8 }}
              />
            </div>

            {/* Top 3 podium */}
            <div className="flex items-end justify-center gap-4 mb-12">
              {topThree.length > 0 ? (
                [1, 0, 2].map((idx) => {
                  if (idx >= topThree.length) return null;
                  const team = topThree[idx];
                  const isFirst = idx === 0;
                  const rankNum = idx + 1;
                  const style = rankStyles[rankNum] || { text: "text-foreground", badge: "bg-muted text-muted-foreground" };
                  return (
                    <motion.div
                      key={team.id}
                      className="text-center flex-1 max-w-[140px]"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + idx * 0.1 }}
                    >
                      <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center font-display text-sm font-bold mb-3 ${style.badge}`}>
                        {rankNum <= 3 ? <Medal className="w-5 h-5" /> : rankNum}
                      </div>
                      <div className={`font-display text-sm font-bold ${style.text} mb-0.5 truncate`}>{team.name}</div>
                      <div className="text-xs font-mono text-muted-foreground/40">{team.scanCount}/5 QR</div>
                      <div className={`mt-3 rounded-t-lg ${isFirst ? "h-20 cosmic-gradient-subtle" : idx === 1 ? "h-14 bg-secondary/5" : "h-10 bg-accent/5"}`} />
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center w-full text-muted-foreground font-mono">No completions yet</div>
              )}
            </div>

            {/* Full list */}
            <div>
              <h3 className="font-display text-xs tracking-[0.3em] uppercase text-muted-foreground/50 mb-6">All Teams</h3>
              {loading ? (
                <div className="text-center text-muted-foreground font-mono text-sm py-8">Loading...</div>
              ) : leaderboard.length > 0 ? (
                leaderboard.map((team, i) => {
                  const rankNum = i + 1;
                  const style = rankStyles[rankNum];
                  return (
                    <motion.div
                      key={team.id}
                      className="flex items-center gap-4 py-4 border-b border-border/10 last:border-0"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                    >
                      <span className={`w-8 font-display text-lg font-black ${style?.text || "text-muted-foreground/30"}`}>
                        {String(rankNum).padStart(2, "0")}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className={`font-display text-sm font-bold truncate ${style?.text || "text-foreground/80"}`}>{team.name}</div>
                        <div className="text-[10px] font-mono text-muted-foreground/30">{team.id}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-semibold text-foreground/80">{team.scanCount}/5</div>
                        <div className="text-[10px] font-mono text-muted-foreground/30">{team.gamesCount} games</div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center text-muted-foreground font-mono text-sm py-8">No teams yet</div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
