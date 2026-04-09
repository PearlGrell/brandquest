import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import StarField from "@/components/StarField";
import Navbar from "@/components/Navbar";
import { LogIn, AlertCircle, Rocket, ArrowRight } from "lucide-react";
import { loginTeam } from "@/lib/apiClient";
import AuthHelp from "@/components/AuthHelp";

const Login = () => {
  const [loginMode, setLoginMode] = useState<"team" | "solo">("team");
  const [teamIdInput, setTeamIdInput] = useState("");
  const [rollInput, setRollInput] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await loginTeam(
        loginMode === "team" ? teamIdInput.trim() : null,
        password,
        loginMode === "solo" ? rollInput.trim() : null
      );
      localStorage.setItem("celestio_session", JSON.stringify(response.session));
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <StarField />
      <Navbar />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 40% 40% at 50% 45%, hsl(312 100% 63% / 0.05) 0%, transparent 70%)"
        }} />

        <motion.div className="w-full max-w-md relative" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex justify-center mb-8">
            <Rocket className="w-10 h-10 text-primary" />
          </div>

          <h2 className="font-display text-3xl font-black cosmic-gradient-text text-center mb-2">Mission Control</h2>
          <p className="text-center font-mono text-muted-foreground/70 text-xs mb-8 uppercase tracking-widest">
            {loginMode === "team" ? "Enter Team ID & Password" : "Enter Roll Number & Password"}
          </p>

          <div className="flex bg-white/5 p-1 rounded-2xl max-w-[240px] mx-auto mb-8 border border-white/10">
            <button onClick={() => setLoginMode("team")} className={`flex-1 py-2 rounded-xl transition-all font-display text-xs font-bold ${loginMode === "team" ? "bg-primary text-primary-foreground shadow-lg" : "text-white/80 hover:text-white"}`}>Team</button>
            <button onClick={() => setLoginMode("solo")} className={`flex-1 py-2 rounded-xl transition-all font-display text-xs font-bold ${loginMode === "solo" ? "bg-primary text-primary-foreground shadow-lg" : "text-white/80 hover:text-white"}`}>Solo</button>
          </div>

          {error && (
            <motion.div className="flex items-center gap-3 text-destructive text-sm font-mono mb-6 border-l-2 border-destructive/50 pl-4 py-2 bg-destructive/5" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative mt-2">
              <input
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3.5 font-mono text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all uppercase placeholder:italic placeholder:text-white/30 peer"
                placeholder={loginMode === "team" ? "CEL-XXXXX" : "2024UG1234"}
                value={loginMode === "team" ? teamIdInput : rollInput}
                onChange={(e) => loginMode === "team" ? setTeamIdInput(e.target.value.toUpperCase()) : setRollInput(e.target.value.toUpperCase())}
                disabled={loading}
                required
              />
              <label className="absolute -top-2.5 left-3 px-1 text-[10px] font-mono tracking-wider uppercase bg-[hsl(260,100%,4%)] text-white/80 peer-focus:text-primary transition-colors pointer-events-none rounded-sm">
                {loginMode === "team" ? "Team ID" : "Roll Number"}
              </label>
            </div>

            <div className="relative mt-2">
              <input
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3.5 font-mono text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all placeholder:text-white/30 peer"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <label className="absolute -top-2.5 left-3 px-1 text-[10px] font-mono tracking-wider uppercase bg-[hsl(260,100%,4%)] text-white/80 peer-focus:text-primary transition-colors pointer-events-none rounded-sm">
                Key Access
              </label>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full py-4 cosmic-gradient rounded-xl font-display text-lg font-bold text-primary-foreground flex items-center justify-center gap-3 relative overflow-hidden group shadow-[0_0_20px_rgba(var(--primary),0.2)]"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <span className="absolute inset-0 neon-glow rounded-xl" />
              <span className="relative z-10">{loading ? "Synchronizing..." : "Initialize Access"}</span>
              {!loading && <ArrowRight className="w-4 h-4 relative z-10" />}
            </motion.button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-border/20" />
            <span className="text-[10px] font-mono text-muted-foreground/30 uppercase tracking-widest">Awaiting Command</span>
            <div className="flex-1 h-px bg-border/20" />
          </div>

          <Link to="/register" className="w-full flex items-center justify-center gap-2 py-3 text-xs font-mono text-muted-foreground hover:text-primary transition-all">
            Join the Quest <span className="text-primary font-bold">Register Now</span>
          </Link>
        </motion.div>
      </div>
      <AuthHelp />
    </div>
  );
};

export default Login;
