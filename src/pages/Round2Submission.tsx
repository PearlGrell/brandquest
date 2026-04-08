import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Link as LinkIcon, Send, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import StarField from "@/components/StarField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSubmission, submitRound, getEventStatus } from "@/lib/apiClient";
import { AlertCircle } from "lucide-react";

const Round2Submission = () => {
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
        };
      }
      return data;
    } catch (e) {
      return null;
    }
  }, [teamDataString]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  
  const [logoLink, setLogoLink] = useState("");
  const [bannerLink, setBannerLink] = useState("");

  useEffect(() => {
    if (!team) {
      navigate("/login");
      return;
    }

    const checkSubmission = async () => {
      try {
        const [submission, status] = await Promise.all([
          getSubmission(team.teamId, 2),
          getEventStatus()
        ]);
        
        if (submission) {
          setHasSubmitted(true);
        }

        let isGateOpen = status.r2Open;
        if (status.r2Deadline) {
          const deadline = new Date(status.r2Deadline).getTime();
          if (Date.now() >= deadline) isGateOpen = false;
        }

        setIsOpen(isGateOpen);
      } catch (err) {
        console.error("Failed to check submission:", err);
      } finally {
        setLoading(false);
      }
    };
    checkSubmission();
  }, [team, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoLink || !bannerLink) {
      toast.error("Both links are required");
      return;
    }

    setSubmitting(true);
    try {
      await submitRound(team.teamId, 2, bannerLink, logoLink);
      toast.success("Round 2 Submission Successful!");
      setHasSubmitted(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!team) return null;

  return (
    <div className="relative min-h-screen">
      <StarField />
      <Navbar />
      <div className="relative z-10 pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-12">
              <motion.span
                className="text-xs font-mono text-accent tracking-[0.3em] uppercase"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                Round 2
              </motion.span>
              <h2 className="font-display text-4xl md:text-5xl font-black cosmic-gradient-text mt-2 mb-4">
                Brand Identity Design
              </h2>
              <p className="font-mono text-muted-foreground">
                Submit your brand logo and promotional banner links.
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : hasSubmitted ? (
               <motion.div
                 className="glass-panel p-8 md:p-12 text-center border-primary/20 space-y-4"
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
               >
                 <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-2" />
                 <h3 className="font-display text-2xl font-bold text-foreground">Submission Received!</h3>
                 <p className="font-mono text-muted-foreground">
                   Your team's design assets have been securely logged in the database. 
                   Only one submission is allowed per round.
                 </p>
               </motion.div>
            ) : !isOpen ? (
               <motion.div
                 className="glass-panel p-8 md:p-12 text-center border-destructive/20 space-y-4"
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
               >
                 <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-2" />
                 <h3 className="font-display text-2xl font-bold text-foreground">Submissions Closed</h3>
                 <p className="font-mono text-muted-foreground">
                   Round 2 logic gates are currently locked by mission control.
                 </p>
               </motion.div>
            ) : (
              <motion.div
                className="glass-panel p-6 md:p-8 border border-white/5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-mono text-foreground flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-primary" /> Brand Logo Link
                    </label>
                    <Input
                      placeholder="e.g. Figma link, Drive link to logo"
                      type="url"
                      required
                      value={logoLink}
                      onChange={(e) => setLogoLink(e.target.value)}
                      className="bg-white/5 border-white/10 text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-mono text-foreground flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-secondary" /> Promotional Banner Link
                    </label>
                    <Input
                      placeholder="e.g. Figma link, Drive link to banner"
                      type="url"
                      required
                      value={bannerLink}
                      onChange={(e) => setBannerLink(e.target.value)}
                      className="bg-white/5 border-white/10 text-foreground"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 mt-4 cosmic-gradient font-display text-lg tracking-wide hover:scale-[1.02] transition-transform"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary-foreground" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" /> Submit Design
                      </>
                    )}
                  </Button>
                  <p className="text-center font-mono text-[10px] text-muted-foreground/60 mt-2">
                    Note: You can only submit once. Make sure your links are accessible.
                  </p>
                </form>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Round2Submission;
