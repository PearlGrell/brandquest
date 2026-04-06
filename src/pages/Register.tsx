import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import StarField from "@/components/StarField";
import Navbar from "@/components/Navbar";
import { UserPlus, Trash2, Sparkles, AlertCircle, Copy, Check, Gamepad2, ArrowRight, User } from "lucide-react";
import { registerTeam, addParticipant, getEventStatus } from "@/lib/apiClient";

interface Member {
  name: string;
  rollNumber: string;
  year: string;
}

const generateTeamId = () => "CEL-" + Math.random().toString(36).substring(2, 7).toUpperCase();

const FloatingInput = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="relative group">
    <input
      {...props}
      className="w-full bg-transparent border-b border-border/30 px-1 py-3 font-mono text-sm text-foreground placeholder:text-transparent focus:placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/60 transition-all duration-300 peer"
    />
    <label className="absolute left-1 top-3 text-sm font-mono text-muted-foreground/50 transition-all duration-300 peer-focus:-top-2 peer-focus:text-[10px] peer-focus:text-primary peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-[10px] pointer-events-none">
      {label}
    </label>
  </div>
);

const FloatingSelect = ({ label, children, ...props }: { label: string; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="relative">
    <select
      {...props}
      className="w-full bg-transparent border-b border-border/30 px-1 py-3 font-mono text-sm text-foreground focus:outline-none focus:border-primary/60 transition-all duration-300 appearance-none cursor-pointer"
    >
      {children}
    </select>
    <label className="absolute left-1 -top-2 text-[10px] font-mono text-muted-foreground/50 pointer-events-none">
      {label}
    </label>
  </div>
);

const Register = () => {
  const [isSolo, setIsSolo] = useState(false);
  const [wantsMatchup, setWantsMatchup] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [email, setEmail] = useState("");
  const [members, setMembers] = useState<Member[]>([
    { name: "", rollNumber: "", year: "" },
    { name: "", rollNumber: "", year: "" },
  ]);
  const [errors, setErrors] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<{ id: string; password: string; isSolo: boolean } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationEnded, setRegistrationEnded] = useState(false);

  const gameComplete = localStorage.getItem("celestio_game_complete") === "true";
  const isLoggedIn = !!localStorage.getItem("celestio_session");

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await getEventStatus();
        setRegistrationEnded(status.registrationEnded);
      } catch (err) {
        console.error("Failed to fetch event status:", err);
      }
    };
    checkStatus();
  }, []);

  const addMember = () => {
    if (members.length < 3) setMembers([...members, { name: "", rollNumber: "", year: "" }]);
  };

  const removeMember = (i: number) => {
    if (members.length > 1) setMembers(members.filter((_, idx) => idx !== i));
  };

  const updateMember = (i: number, field: keyof Member, value: string) => {
    const updated = [...members];
    updated[i] = { ...updated[i], [field]: value };
    setMembers(updated);
  };

  const toggleSolo = (val: boolean) => {
    setIsSolo(val);
    if (val) {
      setMembers([{ name: members[0].name, rollNumber: members[0].rollNumber, year: members[0].year }]);
    } else if (members.length < 2) {
      setMembers([...members, { name: "", rollNumber: "", year: "" }]);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const errs: string[] = [];

    const effectiveTeamName = isSolo ? members[0].name : teamName;

    if (!effectiveTeamName.trim()) errs.push(isSolo ? "Full name is required" : "Team name is required");
    if (!email.trim() || !email.includes("@")) errs.push("Valid email required");

    members.forEach((m, i) => {
      if (!m.name.trim()) errs.push(`${isSolo ? "Soloist" : "Member " + (i + 1)}: Name required`);
      if (!m.rollNumber.trim()) errs.push(`${isSolo ? "Soloist" : "Member " + (i + 1)}: Roll number required`);
      if (!m.year) errs.push(`${isSolo ? "Soloist" : "Member " + (i + 1)}: Year required`);
    });

    if (password.length < 4) errs.push("Password must be at least 4 characters");

    if (errs.length > 0) {
      setErrors(errs);
      setIsSubmitting(false);
      return;
    }

    try {
      const id = isSolo ? "" : generateTeamId();

      await registerTeam(id, effectiveTeamName, password, email, isSolo, wantsMatchup, members);

      setResult({ id: isSolo ? members[0].rollNumber.toUpperCase() : id, password, isSolo });
      setErrors([]);
    } catch (err: any) {
      setErrors([err.message || "An unexpected error occurred"]);
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isLoggedIn) {
    return (
      <div className="relative min-h-screen">
        <StarField />
        <Navbar />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
          <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-6 animate-pulse-glow" />
            <h2 className="font-display text-3xl font-black cosmic-gradient-text mb-3">Already Logged In</h2>
            <p className="font-mono text-muted-foreground/70 mb-8">You're already part of a team. Head to the game!</p>
            <Link
              to="/game"
              className="inline-flex items-center gap-3 px-10 py-4 cosmic-gradient rounded-2xl font-display font-bold text-primary-foreground neon-glow hover:scale-105 transition-transform"
            >
              <Gamepad2 className="w-5 h-5" /> Play Now
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }


  if (result) {
    return (
      <div className="relative min-h-screen">
        <StarField />
        <Navbar />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
          <motion.div
            className="text-center max-w-md w-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring" }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-6"
            >
              <Sparkles className="w-14 h-14 text-primary" />
            </motion.div>
            <h2 className="font-display text-3xl font-black cosmic-gradient-text mb-8">Registration Complete!</h2>

            <div className="space-y-6 mb-8">
              <div>
                <p className="font-mono text-muted-foreground/50 text-xs tracking-widest uppercase mb-3">
                  {result.isSolo ? "Your Roll Number" : "Your Team ID"}
                </p>
                <motion.button
                  onClick={() => copyToClipboard(result.id, "id")}
                  className="w-full cosmic-gradient text-primary-foreground font-display text-2xl font-black py-4 px-6 rounded-xl flex items-center justify-center gap-3 relative overflow-hidden group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="absolute inset-0 neon-glow rounded-xl" />
                  <span className="relative z-10">{result.id}</span>
                  {copied === "id" ? <Check className="w-5 h-5 relative z-10" /> : <Copy className="w-5 h-5 opacity-60 relative z-10" />}
                </motion.button>
              </div>
              <div>
                <p className="font-mono text-muted-foreground/50 text-xs tracking-widest uppercase mb-3">Your Secret Key</p>
                <motion.button
                  onClick={() => copyToClipboard(result.password, "pw")}
                  className="w-full border border-secondary/30 text-secondary font-mono text-xl font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 hover:border-secondary/50 transition-all bg-transparent"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {result.password}
                  {copied === "pw" ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5 opacity-60" />}
                </motion.button>
              </div>
            </div>

            <div className="border-l-2 border-accent/40 pl-4 py-2 text-left">
              <p className="text-xs font-mono text-accent">⚠ Save both credentials — you'll need them to login!</p>
            </div>

            <Link to="/login" className="mt-8 inline-flex items-center gap-2 text-primary hover:underline font-mono text-sm">
              Proceed to Login <ArrowRight className="w-4 h-4" />
            </Link>
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
        <div className="container mx-auto max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Solo/Team Toggle */}
            <div className="flex bg-white/5 p-1 rounded-2xl max-w-[240px] mx-auto mb-10 border border-white/10">
              <button
                onClick={() => toggleSolo(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all font-display text-sm font-bold ${!isSolo ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"}`}
              >
                <UserPlus className="w-4 h-4" /> Team
              </button>
              <button
                onClick={() => toggleSolo(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all font-display text-sm font-bold ${isSolo ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"}`}
              >
                <User className="w-4 h-4" /> Solo
              </button>
            </div>

            <div className="text-center mb-10">
              <h2 className="font-display text-3xl md:text-4xl font-black cosmic-gradient-text mb-2">
                {isSolo ? "Solo Registration" : "Register Team"}
              </h2>
              <p className="font-mono text-muted-foreground/60 text-sm">
                {isSolo ? "Joining as an individual explorer" : "2–3 members per squad"}
              </p>
              <motion.div
                className="mx-auto mt-4 h-[1px] cosmic-gradient rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "8rem" }}
                transition={{ delay: 0.3, duration: 0.8 }}
              />
            </div>

            {registrationEnded ? (
              <motion.div
                className="flex items-center gap-3 mb-8 border-l-2 border-destructive/50 pl-4 py-3 bg-destructive/5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                <div>
                  <p className="text-sm font-display font-bold text-destructive uppercase tracking-wider">Registration Closed</p>
                  <p className="text-xs font-mono text-muted-foreground mt-1">
                    The registration period for Celestio 3.0 has officially ended. See you at the event!
                  </p>
                </div>
              </motion.div>
            ) : !gameComplete && (
              <motion.div
                className="flex items-center gap-3 mb-8 border-l-2 border-primary/50 pl-4 py-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <AlertCircle className="w-4 h-4 text-primary shrink-0" />
                <p className="text-sm font-mono text-muted-foreground">
                  Complete the <Link to="/game" className="text-primary hover:underline">Cosmic Game</Link> first to unlock registration.
                </p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className={`space-y-10 ${(!gameComplete || registrationEnded) ? "opacity-40 pointer-events-none select-none" : ""}`}>
              {errors.length > 0 && (
                <motion.div
                  className="border-l-2 border-destructive/50 pl-4 py-2 space-y-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {errors.map((e, i) => (
                    <p key={i} className="text-sm text-destructive font-mono flex items-center gap-2">
                      <AlertCircle className="w-3 h-3 shrink-0" /> {e}
                    </p>
                  ))}
                </motion.div>
              )}

              {/* Basic Info - Consolidate for Solo */}
              <div className="space-y-6">
                <h3 className="font-display text-xs tracking-[0.3em] uppercase text-muted-foreground/50">
                  {isSolo ? "Contact Information" : "Team Details"}
                </h3>

                {!isSolo && (
                  <FloatingInput
                    label="Team Name"
                    placeholder=" "
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                  />
                )}

                <FloatingInput
                  label={isSolo ? "Email Address" : "Contact Email"}
                  placeholder=" "
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <FloatingInput
                  label="Secret Access Key"
                  placeholder=" "
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                {(isSolo || members.length < 3) && (
                  <div className="flex items-center gap-3 p-4 glass-panel-strong rounded-xl border border-white/5">
                    <input
                      type="checkbox"
                      id="matchup"
                      checked={wantsMatchup}
                      onChange={(e) => setWantsMatchup(e.target.checked)}
                      className="w-4 h-4 accent-primary"
                    />
                    <label htmlFor="matchup" className="text-xs font-mono text-muted-foreground cursor-pointer">
                      {isSolo ? "I want to be matched with other teams/soloists" : `I want more members (${3 - members.length} more needed)`}
                    </label>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-border/20" />

              {/* Members/Soloist */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xs tracking-[0.3em] uppercase text-muted-foreground/50">
                    {isSolo ? "Personal Details" : (
                      <>Members <span className="text-primary">({members.length}/3)</span></>
                    )}
                  </h3>
                  {!isSolo && members.length < 3 && (
                    <button type="button" onClick={addMember} className="flex items-center gap-1.5 text-xs font-mono text-primary hover:text-primary/80 transition-colors">
                      <UserPlus className="w-3.5 h-3.5" /> Add member
                    </button>
                  )}
                </div>

                {members.map((m, i) => (
                  <motion.div
                    key={i}
                    className="space-y-5 relative"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    {!isSolo && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full border border-primary/30 flex items-center justify-center">
                            <span className="text-[10px] font-display text-primary">{i + 1}</span>
                          </div>
                          <span className="text-xs font-mono text-muted-foreground/60">
                            {i === 0 ? "Team Leader" : `Member ${i + 1}`}
                          </span>
                        </div>
                        {members.length > 2 && (
                          <button type="button" onClick={() => removeMember(i)} className="text-muted-foreground/30 hover:text-destructive transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                    <FloatingInput label="Full Name" placeholder=" " value={m.name} onChange={(e) => updateMember(i, "name", e.target.value)} />
                    <FloatingInput label="Roll Number" placeholder=" " value={m.rollNumber} onChange={(e) => updateMember(i, "rollNumber", e.target.value)} />
                    <FloatingSelect label="Year" value={m.year} onChange={(e) => updateMember(i, "year", e.target.value)}>
                      <option value="">Select Year</option>
                      <option value="1st">1st Year</option>
                      <option value="2nd">2nd Year</option>
                      <option value="3rd">3rd Year</option>
                      <option value="4th">4th Year</option>
                    </FloatingSelect>
                    {!isSolo && i < members.length - 1 && <div className="h-px bg-border/10 mt-2" />}
                  </motion.div>
                ))}
              </div>

              <motion.button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 cosmic-gradient rounded-xl font-display text-lg font-bold text-primary-foreground flex items-center justify-center gap-3 relative overflow-hidden group disabled:opacity-50 disabled:pointer-events-none"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="absolute inset-0 neon-glow rounded-xl" />
                <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                <span className="relative z-10">
                  {isSubmitting ? "Processing..." : "Launch Registration"}
                </span>
                {!isSubmitting && <ArrowRight className="w-4 h-4 relative z-10" />}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Register;
