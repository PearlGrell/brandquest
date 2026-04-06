import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import StarField from "@/components/StarField";
import Navbar from "@/components/Navbar";
import { Users, Check, Loader, AlertCircle, ArrowLeft } from "lucide-react";
import { getMatchupPool, joinMatchup, getEventStatus } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";

interface TeamMember {
  id: string;
  teamId: string;
  name: string;
  email: string;
  year: string;
  rollNumber: string;
  createdAt: string;
}

interface MatchupTeam {
  id: string;
  name: string;
  currentSize: number;
  leaderName: string;
  isSolo: boolean;
  participants: TeamMember[];
}

const Matchup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pool, setPool] = useState<MatchupTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningTeam, setJoiningTeam] = useState<string | null>(null);
  const [joinedTeam, setJoinedTeam] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const teamData = useMemo(() => {
    const sessionData = localStorage.getItem("celestio_session");
    return sessionData ? JSON.parse(sessionData) : null;
  }, []);

  useEffect(() => {
    if (!teamData?.isSolo) {
      navigate("/dashboard");
      return;
    }

    const checkStatus = async () => {
      try {
        const status = await getEventStatus();
        if (status.registrationEnded) {
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Matchup status check error:", err);
      }
    };

    checkStatus();
    loadMatchupPool(true);


    const pollInterval = setInterval(() => {
      loadMatchupPool(false);
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [teamData, navigate]);

  const loadMatchupPool = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const data = await getMatchupPool(teamData?.teamId);
      setPool(data);
      setError(null);
    } catch (err) {
      console.error("Failed to load matchup pool:", err);
      if (showLoading) setError("Failed to load available teams");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleJoinTeam = async (targetTeamId: string) => {
    if (!teamData?.participantId) {
      setError("Participant ID not found in session");
      return;
    }

    try {
      setJoiningTeam(targetTeamId);
      const response = await joinMatchup(teamData.participantId, targetTeamId);


      const session = JSON.parse(localStorage.getItem("celestio_session") || "{}");
      const { session: newSession } = response;
      
      localStorage.setItem("celestio_session", JSON.stringify({
        ...session,
        teamId: targetTeamId,
        teamName: newSession.teamName,
        isSolo: false
      }));

      toast({
        title: "Team Joined!",
        description: `Successfully joined ${newSession.teamName}`,
      });
      setJoinedTeam(targetTeamId);
      setError(null);

      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to join team");
      setJoiningTeam(null);
    }
  };

  if (!teamData?.isSolo) return null;

  if (joinedTeam) {
    return (
      <div className="relative min-h-screen">
        <StarField />
        <Navbar />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-6"
            >
              <Check className="w-16 h-16 text-primary" />
            </motion.div>
            <h2 className="font-display text-3xl font-black cosmic-gradient-text mb-2">Successfully Matched!</h2>
            <p className="font-mono text-muted-foreground mb-6">You've joined a team. Redirecting to dashboard...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <StarField />
      <Navbar />
      <div className="relative z-10 pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header */}
            <div className="mb-12">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6 text-sm font-mono"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </button>
              <motion.span
                className="text-xs font-mono text-accent tracking-[0.3em] uppercase"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                Matchmaking
              </motion.span>
              <h2 className="font-display text-4xl md:text-5xl font-black cosmic-gradient-text mt-2 mb-1">Find Your Team</h2>
              <p className="font-mono text-muted-foreground/50 text-sm">Browse available teams looking for members</p>
              <motion.div
                className="mx-auto mt-4 h-[1px] cosmic-gradient rounded-full max-w-xs"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.3, duration: 0.8 }}
              />
            </div>

            {error && (
              <motion.div
                className="mb-8 flex items-start gap-3 border-l-2 border-destructive pl-4 py-3 text-destructive"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="font-mono text-sm">{error}</p>
              </motion.div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="mb-4"
                >
                  <Loader className="w-8 h-8 text-primary" />
                </motion.div>
                <p className="font-mono text-muted-foreground">Loading available teams...</p>
              </div>
            ) : pool.length > 0 ? (
              <div className="space-y-4">
                {pool.map((team, i) => (
                  <motion.div
                    key={team.id}
                    className="glass-panel p-6 border-white/5 hover:border-primary/20 transition-all cursor-pointer group"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-display text-lg font-bold text-foreground truncate max-w-[150px]">
                              {team.name}
                            </h3>
                            <span className="text-[10px] font-mono text-muted-foreground/50 bg-white/5 px-2 py-1 rounded">
                              {team.isSolo ? "Solo" : "Team"}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-primary/60 flex items-center gap-1.5">
                            <Users className="w-3 h-3" />
                            <span>Leader: {team.leaderName}</span>
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground/40 mt-1">
                            Capacity: {team.currentSize}/3
                          </div>
                        </div>

                        <div className="space-y-2 mt-4">
                          <p className="text-[10px] font-mono text-muted-foreground/60 tracking-widest uppercase mb-3">Members</p>
                          <div className="space-y-1">
                            {team.participants.map((member) => (
                              <div key={member.id} className="text-sm font-mono text-muted-foreground/50">
                                <span className="text-primary">{member.name}</span>
                                <span className="text-muted-foreground/30 ml-2">({member.year})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <motion.button
                        onClick={() => handleJoinTeam(team.id)}
                        disabled={joiningTeam === team.id}
                        className="flex items-center gap-2 px-6 py-3 cosmic-gradient rounded-xl font-display text-sm font-bold text-primary-foreground relative overflow-hidden group/btn disabled:opacity-50 disabled:pointer-events-none transition-all"
                        whileHover={joiningTeam !== team.id ? { scale: 1.05 } : {}}
                        whileTap={joiningTeam !== team.id ? { scale: 0.95 } : {}}
                      >
                        <span className="absolute inset-0 neon-glow rounded-xl" />
                        {joiningTeam === team.id ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin relative z-10" />
                            <span className="relative z-10">Joining...</span>
                          </>
                        ) : (
                          <>
                            <span className="relative z-10">Join Team</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="font-mono text-muted-foreground mb-2">No teams available for matchup</p>
                <p className="font-mono text-muted-foreground/50 text-sm">Check back later or create your own team</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Matchup;
