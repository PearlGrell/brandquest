import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import StarField from "@/components/StarField";
import Navbar from "@/components/Navbar";
import { Shield, QrCode, Gamepad2, ExternalLink, Users, Zap, AlertCircle } from "lucide-react";
import { getQRScans, getCompletedGames, getEventStatus, getTeamParticipants, syncSession } from "@/lib/apiClient";

interface Team {
  teamId: string;
  teamName: string;
  isSolo?: boolean;
  rollNumber?: string;
  wantsMatchup?: boolean;
}

interface Member {
  id: string;
  name: string;
  rollNumber: string;
  year: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const teamDataString = localStorage.getItem("celestio_session");


  const team = useMemo(() => {
    if (!teamDataString) return null;
    try {
      const data = JSON.parse(teamDataString);

      if (data.team && (data.team.teamId || data.team.id)) {
        return {
          ...data.team,
          teamId: data.team.teamId || data.team.id,
          teamName: data.team.teamName || data.team.name,
          token: data.token
        };
      }
      return data;
    } catch (e) {
      return null;
    }
  }, [teamDataString]);

  const [qrProgress, setQrProgress] = useState({ scanned: 0, total: 5 });
  const [gamesProgress, setGamesProgress] = useState({ completed: 0, total: 3 });
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [eventStarted, setEventStarted] = useState(true);
  const [registrationEnded, setRegistrationEnded] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);

  useEffect(() => {
    if (!team) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      try {

        const latest = await syncSession(team.teamId, team.rollNumber);
        if (latest.teamId !== team.teamId) {
          const newSession = { ...team, ...latest };
          localStorage.setItem("celestio_session", JSON.stringify(newSession));
          window.location.reload();
          return;
        }



        if (team.teamId) {
          const [qr, games, event, pts] = await Promise.all([
            getQRScans(team.teamId),
            getCompletedGames(team.teamId),
            getEventStatus(),
            getTeamParticipants(team.teamId)
          ]);

          setQrProgress({ scanned: qr.scans.length, total: 5 });
          setGamesProgress({ completed: games.completed.length, total: 3 });
          setCompletedLevels(games.completed.map((c: any) => c.level_id));
          setEventStarted(event.isStarted);
          setRegistrationEnded(event.registrationEnded);
          setCurrentRound(event.currentRound || 1);
          setMembers(pts || []);

        } else {

          const event = await getEventStatus();
          setEventStarted(event.isStarted);
          setRegistrationEnded(event.registrationEnded);
          setCurrentRound(event.currentRound || 1);
        }
      } catch (err) {
        console.error("Dashboard sync/load error:", err);
      }
    };

    loadData();
  }, [team, navigate]);

  if (!team) return null;

  return (
    <div className="relative min-h-screen">
      <StarField />
      <Navbar />
      <div className="relative z-10 pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header */}
            <div className="mb-12">
              <motion.span
                className="text-xs font-mono text-accent tracking-[0.3em] uppercase"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                Dashboard
              </motion.span>
              <h2 className="font-display text-4xl md:text-5xl font-black cosmic-gradient-text mt-2 mb-1">
                {team.teamName}
              </h2>
              <div className="flex items-center gap-3">
                <p className="font-mono text-muted-foreground/50 text-sm">
                  {team.isSolo ? `Solo Explorer: ${team.rollNumber || team.participantId.slice(0, 8)}` : `Team ID: ${team.teamId}`}
                </p>
                {team.isSolo && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary/10 border border-secondary/20 text-[10px] font-mono text-secondary uppercase font-bold animate-pulse">
                    Waiting for Squad
                  </span>
                )}
              </div>
            </div>

            {/* Registration Ended Notice for Soloists */}
            {registrationEnded && team.isSolo && (
              <motion.div
                className="mb-12 p-6 glass-panel-strong border-destructive/20 bg-destructive/5 relative overflow-hidden group"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <AlertCircle className="w-16 h-16 text-destructive" />
                </div>
                <div className="relative z-10 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-destructive text-lg mb-1 uppercase tracking-tight">Registration has Closed</h4>
                    <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                      The squad formation period has ended. Since you are still a <span className="text-destructive font-bold">Soloist</span>, 
                      you cannot participate in game levels yet. Please reach out to an admin at the event hub to be manually assigned to a team.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-3 mb-12 flex-wrap">
              <Link
                to="/game"
                className="flex items-center gap-2 px-6 py-3 cosmic-gradient rounded-xl font-display text-sm font-bold text-primary-foreground neon-glow hover:scale-105 transition-transform"
              >
                <Gamepad2 className="w-4 h-4" /> Play Game
              </Link>
              <Link
                to="/leaderboard"
                className="flex items-center gap-2 px-6 py-3 border border-border/30 rounded-xl font-display text-sm font-bold text-foreground hover:border-primary/40 hover:text-primary transition-all"
              >
                <ExternalLink className="w-4 h-4" /> Leaderboard
              </Link>
              {team?.isSolo && (
                <Link
                  to="/matchup"
                  className="flex items-center gap-2 px-6 py-3 border border-secondary/30 rounded-xl font-display text-sm font-bold text-secondary hover:border-secondary/60 hover:text-secondary transition-all"
                >
                  <Users className="w-4 h-4" /> Find Team
                </Link>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-px mb-12">
              {[
                { icon: Shield, label: "Status", value: eventStarted ? "Active" : "Pending", color: eventStarted ? "text-primary" : "text-muted-foreground/50" },
                { icon: QrCode, label: "QR Progress", value: `${qrProgress.scanned}/${qrProgress.total}`, color: "text-accent" },
                { icon: Gamepad2, label: "Games", value: `${gamesProgress.completed}/${gamesProgress.total}`, color: "text-secondary" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="text-center py-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                >
                  <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-2 opacity-60`} />
                  <div className={`font-display text-2xl font-black ${stat.color}`}>{stat.value}</div>
                  <div className="text-[10px] font-mono text-muted-foreground/40 tracking-widest uppercase mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Progress */}
            <div className="mb-12">
              <h3 className="font-display text-xs tracking-[0.3em] uppercase text-muted-foreground/50 mb-6">Event Timeline</h3>
              <div className="h-1 rounded-full bg-border/20 overflow-hidden">
                <motion.div
                  className="h-full cosmic-gradient rounded-full shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                  initial={{ width: 0 }}
                  animate={{
                    width: !eventStarted ? "0%" :
                      currentRound === 1 ? "15%" :
                        currentRound === 2 ? "50%" : "100%"
                  }}
                  transition={{ duration: 1.2, ease: "anticipate" }}
                />
              </div>
              <div className="flex justify-between mt-3">
                {[
                  { name: "QR Quest", round: 1 },
                  { name: "Brand Forge", round: 2 },
                  { name: "Showcase", round: 3 }
                ].map((s, i) => {
                  const isActive = eventStarted && currentRound === s.round;
                  const isCompleted = eventStarted && currentRound > s.round;
                  return (
                    <span key={s.name} className={`text-[10px] font-mono tracking-wider transition-all duration-500 ${isActive ? "text-primary font-black scale-110" :
                        isCompleted ? "text-primary/60" :
                          eventStarted ? "text-muted-foreground/40" : "text-muted-foreground/20"
                      }`}>
                      {s.name}
                    </span>
                  );
                })}
              </div>
              <p className="text-[10px] font-mono text-muted-foreground/50 mt-3 animate-pulse">
                {eventStarted ? (
                  currentRound === 1 ? "Round 1: QR Scans & Brand Discovery in progress" :
                    currentRound === 2 ? "Round 2: Identity Design & Brand Forge in progress" :
                      "Round 3: Final Pitch & Showcase Presentation"
                ) : "Event awaiting initialization..."}
              </p>
            </div>

            {/* Team Members */}
            <div className="mb-12">
              <h3 className="font-display text-xs tracking-[0.3em] uppercase text-muted-foreground/50 mb-6 flex items-center justify-between">
                Team Members
                <span className="text-primary font-bold">({members.length}/3)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {members.map((m, i) => (
                  <div key={m.id} className="glass-panel p-4 border-white/5 relative group overflow-hidden">
                    <div className="absolute -right-2 -top-2 w-12 h-12 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors" />
                    <div className="relative z-10">
                      <div className="text-[10px] font-mono text-primary/60 mb-1">
                        {i === 0 ? "LEADER" : `MEMBER ${i + 1}`}
                      </div>
                      <div className="font-display font-bold text-foreground truncate">{m.name}</div>
                      <div className="text-[10px] font-mono text-muted-foreground/50 mt-1">{m.rollNumber}</div>
                    </div>
                  </div>
                ))}
                {members.length < 3 && team.isSolo && (
                  <Link
                    to="/matchup"
                    className="glass-panel p-4 border-dashed border-white/10 flex flex-col items-center justify-center gap-1 hover:border-secondary/30 transition-all group"
                  >
                    <Users className="w-4 h-4 text-muted-foreground group-hover:text-secondary group-hover:scale-110 transition-all" />
                    <span className="text-[10px] font-mono text-muted-foreground/40 group-hover:text-secondary">Find a teammate</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Games Checklist */}
            <div className="glass-panel p-6 border-white/5">
              <h3 className="font-display text-sm font-bold mb-6 flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-secondary" /> Event Challenges
              </h3>
              <div className="space-y-4">
                {[
                  { id: 1, name: "Constellation", desc: "Connect the stars" },
                  { id: 2, name: "Brand Builder", desc: "Design constraints" },
                  { id: 3, name: "Debug Code", desc: "Logic & Syntax" }
                ].map((game) => {
                  const isDone = completedLevels.includes(game.id);
                  const isAvailable = eventStarted;
                  return (
                    <div key={game.id} className={`flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 ${!isAvailable ? "opacity-50" : ""}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-black text-xs ${isDone ? "bg-primary text-primary-foreground" : "bg-white/10 text-muted-foreground"}`}>
                          {isDone ? <Zap className="w-4 h-4" /> : game.id}
                        </div>
                        <div>
                          <div className={`font-display text-sm font-bold ${isDone ? "text-foreground" : "text-muted-foreground"}`}>{game.name}</div>
                          <div className="text-[10px] font-mono text-muted-foreground/40">{game.desc}</div>
                        </div>
                      </div>
                      {isDone ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                          <Zap className="w-3 h-3 text-primary" />
                          <span className="text-[10px] font-mono text-primary uppercase font-bold">Completed</span>
                        </div>
                      ) : isAvailable ? (
                        <Link to="/game" className="text-[10px] font-mono text-muted-foreground/40 hover:text-primary transition-colors uppercase tracking-widest">
                          Not Started
                        </Link>
                      ) : (
                        <span className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-widest">Locked</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
