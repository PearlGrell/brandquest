import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import StarField from "@/components/StarField";
import Navbar from "@/components/Navbar";
import { Shield, Users, UserPlus, Search, Loader2, AlertCircle, Check, ArrowRight, Download, Plus, Zap, Timer, Power, RefreshCw, Radio, MapPin, List, Settings, Eye } from "lucide-react";
import { getAdminData, adminSeedSoloist, adminCreateTeam, adminExportData, getEventConfig, updateEventConfig, getEventCounters } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QRCodeSVG } from "qrcode.react";

interface AdminParticipant {
  id: string;
  name: string;
  rollNumber: string;
}

interface AdminTeam {
  id: string;
  name: string;
  isSolo: boolean;
  participants: AdminParticipant[];
}

interface QRStage {
  stageNumber: number;
  location: string;
  clue: string | string[];
}

const ADMIN_PASSWORD = "CELESTIO26BRANDQUEST";

const Admin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const password = searchParams.get("password");

  const [loading, setLoading] = useState(true);
  const [soloists, setSoloists] = useState<AdminParticipant[]>([]);
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [stats, setStats] = useState({ teams: 0, participants: 0 });
  const [selectedSoloist, setSelectedSoloist] = useState<string | null>(null);
  const [seeding, setSeeding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);


  const [isStarted, setIsStarted] = useState(false);
  const [regEnded, setRegEnded] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [currentRound, setCurrentRound] = useState(1);
  const [qrStages, setQrStages] = useState<QRStage[]>([]);
  const [updatingConfig, setUpdatingConfig] = useState<string | null>(null);


  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamPass, setNewTeamPass] = useState("12345678");
  const [creating, setCreating] = useState(false);
  const [soloSearch, setSoloSearch] = useState("");
  const [teamSearch, setTeamSearch] = useState("");

  const isAuth = password === ADMIN_PASSWORD;

  useEffect(() => {
    if (!isAuth) {
      const timer = setTimeout(() => navigate("/"), 3000);
      return () => clearTimeout(timer);
    }
    loadData();
    loadConfig();
  }, [isAuth, navigate]);

  const loadConfig = async () => {
    try {
      const config = await getEventConfig(ADMIN_PASSWORD);
      const map = new Map(config.map((c) => [c.key, c.value]));
      setIsStarted(map.get("isStarted") === "true");
      setRegEnded(map.get("registrationEnded") === "true");
      setDeadline((map.get("registrationDeadline") || "") as string);
      setCurrentRound(parseInt((map.get("currentRound") as string) || "1"));

      const stages: QRStage[] = [];
      for (let i = 1; i <= 5; i++) {
        const val = map.get(`qr_stage_${i}`) as string;
        if (val) {
          try {
            stages.push(JSON.parse(val));
          } catch (e) {
            console.error(`Failed to parse qr_stage_${i}:`, e);
          }
        }
      }
      setQrStages(stages);
    } catch (err) {
      console.error("Config load error:", err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [data, counts] = await Promise.all([
        getAdminData(ADMIN_PASSWORD),
        getEventCounters()
      ]);
      setSoloists(data.soloists || []);
      setTeams(data.teamsWithSpace || []);
      setStats(counts);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async (key: string, value: string) => {
    try {
      setUpdatingConfig(key);
      await updateEventConfig(key, value, ADMIN_PASSWORD);
      toast({ title: "Config Updated", description: `${key} is now ${value}` });
      loadConfig();
    } catch (err) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingConfig(null);
    }
  };

  const handleUpdateQRStage = async (stage: QRStage) => {
    try {
      setUpdatingConfig(`qr_stage_${stage.stageNumber}`);
      const value = JSON.stringify(stage);
      await updateEventConfig(`qr_stage_${stage.stageNumber}`, value, ADMIN_PASSWORD);
      toast({ title: "Stage Updated", description: `Location ${stage.stageNumber} synced.` });
      loadConfig();
    } catch (err) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingConfig(null);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName || !newTeamPass) return;
    try {
      setCreating(true);
      await adminCreateTeam(newTeamName, newTeamPass, ADMIN_PASSWORD);
      setNewTeamName("");
      setNewTeamPass("12345678");
      toast({ title: "Team Created", description: "Placeholder team is ready for seeding." });
      loadData();
    } catch (err) {
      toast({ title: "Creation Failed", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await adminExportData(ADMIN_PASSWORD);
      const csvRows = [];
      csvRows.push("Team ID,Team Name,Source,Member Name,Roll Number,Email");

      data.teams.forEach((t) => {
        const source = t.isAdminCreated ? "Admin" : "Participant";
        if (t.participants.length === 0) {
          csvRows.push(`${t.id},${t.name},${source},EMPTY,N/A,N/A`);
        } else {
          t.participants.forEach((p) => {
            csvRows.push(`${t.id},${t.name},${source},"${p.name}",${p.rollNumber},${p.email}`);
          });
        }
      });

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.setAttribute("hidden", "");
      a.setAttribute("href", url);
      a.setAttribute("download", `Celestio_Allotments_${new Date().toLocaleDateString()}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      toast({ title: "Export Failed", variant: "destructive" });
    }
  };

  const handleAssign = async (targetTeamId: string) => {
    if (!selectedSoloist) return;
    try {
      setSeeding(targetTeamId);
      await adminSeedSoloist(selectedSoloist, targetTeamId, ADMIN_PASSWORD);


      toast({ title: "Assignment Successful", description: "Participant moved to the team." });
      setSelectedSoloist(null);
      loadData();
    } catch (err) {
      toast({ title: "Assignment Failed", description: err.message, variant: "destructive" });
    } finally {
      setSeeding(null);
    }
  };

  if (!isAuth) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <StarField />
        <div className="relative z-10 text-center text-destructive">
          <Shield className="w-16 h-16 mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-display font-bold">Unauthorized Access</h2>
          <p className="font-mono text-sm opacity-50 mt-2">Redirecting to sector zero...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <StarField />
      <Navbar />
      <div className="relative z-10 pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header & Global Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <span className="text-xs font-mono text-primary tracking-[0.3em] uppercase">Control Center</span>
              <h2 className="font-display text-4xl font-black cosmic-gradient-text mt-2">Admin Dashboard</h2>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-accent/20 text-accent rounded-lg text-sm font-mono border border-accent/30 hover:bg-accent/30 transition-all font-bold"
              >
                <Download className="w-4 h-4" /> EXPORT
              </button>
              <button
                onClick={() => { loadData(); loadConfig(); }}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-all"
                title="Force Sync"
              >
                <RefreshCw className={`w-5 h-5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl mb-12 flex h-auto overflow-x-auto no-scrollbar">
              <TabsTrigger value="overview" className="flex-1 py-3 font-display font-bold text-xs uppercase tracking-widest gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <List className="w-4 h-4" /> Overview
              </TabsTrigger>
              <TabsTrigger value="lifecycle" className="flex-1 py-3 font-display font-bold text-xs uppercase tracking-widest gap-2 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
                <Settings className="w-4 h-4" /> Lifecycle
              </TabsTrigger>
              <TabsTrigger value="teams" className="flex-1 py-3 font-display font-bold text-xs uppercase tracking-widest gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <Users className="w-4 h-4" /> Participants
              </TabsTrigger>
              <TabsTrigger value="qr" className="flex-1 py-3 font-display font-bold text-xs uppercase tracking-widest gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <MapPin className="w-4 h-4" /> QR Locs
              </TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="glass-panel p-6 border-white/5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Radio className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-muted-foreground/30 uppercase leading-none mb-1">Participants</div>
                    <div className="text-3xl font-display font-black text-foreground">{stats.participants}</div>
                  </div>
                </div>
                <div className="glass-panel p-6 border-white/5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-muted-foreground/30 uppercase leading-none mb-1">Total Teams</div>
                    <div className="text-3xl font-display font-black text-foreground">{stats.teams}</div>
                  </div>
                </div>
                <div className="glass-panel p-6 border-white/5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-muted-foreground/30 uppercase leading-none mb-1">Status</div>
                    <div className={`text-xl font-display font-black ${isStarted ? 'text-primary' : 'text-muted-foreground/40'}`}>
                      {isStarted ? "LIVE" : "STANDBY"}
                    </div>
                  </div>
                </div>
                <div className="glass-panel p-6 border-white/5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Timer className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-muted-foreground/30 uppercase leading-none mb-1">Current Round</div>
                    <div className="text-3xl font-display font-black text-foreground">{currentRound}</div>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-8 border-white/5 text-center">
                <Check className="w-12 h-12 text-primary/20 mx-auto mb-4" />
                <h3 className="font-display text-xl font-bold mb-2">Systems Nominal</h3>
                <p className="font-mono text-xs text-muted-foreground/50">All event sub-systems are operating within expected parameters.</p>
              </div>
            </TabsContent>

            {/* LIFECYCLE TAB */}
            <TabsContent value="lifecycle">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {/* Start/Stop Toggle */}
                <div className="glass-panel p-6 border-white/5 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-xs font-bold tracking-widest text-muted-foreground/50 uppercase mb-4 flex items-center gap-2">
                      <Power className="w-3 h-3" /> Event Status
                    </h3>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-mono text-foreground">Mission State</span>
                      <span className={`text-[10px] font-mono font-bold uppercase rounded-full px-2 py-0.5 ${isStarted ? 'bg-primary/20 text-primary animate-pulse' : 'bg-muted-foreground/10 text-muted-foreground/40'}`}>
                        {isStarted ? 'Active' : 'Standby'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUpdateConfig("isStarted", isStarted ? "false" : "true")}
                    disabled={updatingConfig === "isStarted"}
                    className={`w-full py-3 rounded-xl font-display font-black text-sm transition-all ${isStarted ? 'border border-destructive/20 text-destructive hover:bg-destructive/10' : 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'}`}
                  >
                    {updatingConfig === "isStarted" ? "UPDATING..." : (isStarted ? "STOP EVENT" : "START EVENT")}
                  </button>
                </div>

                {/* Registration Manual Toggle */}
                <div className="glass-panel p-6 border-white/5 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-xs font-bold tracking-widest text-muted-foreground/50 uppercase mb-4 flex items-center gap-2">
                      <AlertCircle className="w-3 h-3" /> Gate Control
                    </h3>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-mono text-foreground">Registration</span>
                      <span className={`text-[10px] font-mono font-bold uppercase rounded-full px-2 py-0.5 ${!regEnded ? 'bg-secondary/20 text-secondary' : 'bg-destructive/20 text-destructive'}`}>
                        {!regEnded ? 'Open' : 'Closed'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUpdateConfig("registrationEnded", regEnded ? "false" : "true")}
                    disabled={updatingConfig === "registrationEnded"}
                    className={`w-full py-3 rounded-xl font-display font-black text-sm transition-all ${!regEnded ? 'bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20' : 'bg-white/5 text-foreground hover:bg-white/10 border border-white/10'}`}
                  >
                    {updatingConfig === "registrationEnded" ? "UPDATING..." : (!regEnded ? "CLOSE REGISTRATION" : "RE-OPEN GATES")}
                  </button>
                </div>

                {/* Registration Deadline */}
                <div className="glass-panel p-6 border-white/5 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-xs font-bold tracking-widest text-muted-foreground/50 uppercase mb-4 flex items-center gap-2">
                      <Timer className="w-3 h-3" /> Auto-Shutdown
                    </h3>
                    <label className="text-[10px] font-mono text-muted-foreground/30 uppercase ml-1 block mb-2">Deadline</label>
                    <input
                      type="datetime-local"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:border-primary/50 outline-none mb-4"
                    />
                  </div>
                  <button
                    onClick={() => handleUpdateConfig("registrationDeadline", deadline)}
                    disabled={updatingConfig === "registrationDeadline"}
                    className="w-full py-3 bg-white/5 border border-white/10 rounded-xl font-display font-black text-sm text-foreground hover:bg-white/10 transition-all tracking-widest"
                  >
                    {updatingConfig === "registrationDeadline" ? "SYNCING..." : "SYNC DEADLINE"}
                  </button>
                </div>

                {/* Current Round Control */}
                <div className="glass-panel p-6 border-white/5 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-xs font-bold tracking-widest text-muted-foreground/50 uppercase mb-4 flex items-center gap-2">
                      <Zap className="w-3 h-3 text-primary" /> Round Phase
                    </h3>
                    <div className="flex items-center justify-between mb-4">
                      {[1, 2, 3].map(r => (
                        <button
                          key={r}
                          onClick={() => handleUpdateConfig("currentRound", r.toString())}
                          className={`w-8 h-8 rounded-full font-display font-bold text-xs transition-all ${currentRound === r ? 'bg-primary text-primary-foreground shadow-glow' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground/30 text-center uppercase">Active Phase: Round {currentRound}</div>
                </div>
              </div>
            </TabsContent>

            <div className="h-px bg-white/5 mb-12 shadow-[0_0_15px_rgba(255,255,255,0.05)]" />

            {/* PARTICIPANTS TAB */}
            <TabsContent value="teams">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Team Form */}
                <div className="glass-panel p-6 border-white/5 lg:col-span-1 h-fit sticky top-28">
                  <h3 className="font-display text-lg font-bold mb-6 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" /> Create Placeholder Team
                  </h3>
                  <form onSubmit={handleCreateTeam} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-muted-foreground/50 uppercase ml-1">Team Identity</label>
                      <input
                        type="text"
                        placeholder="Team Name"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:border-primary/50 outline-none transition-all"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-muted-foreground/50 uppercase ml-1">Security Key</label>
                      <input
                        type="password"
                        placeholder="Team Password"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:border-primary/50 outline-none transition-all"
                        value={newTeamPass}
                        onChange={(e) => setNewTeamPass(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={creating || !newTeamName || !newTeamPass}
                      className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-display font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                    >
                      {creating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Initiate Team"}
                    </button>
                  </form>
                </div>

                {/* Soloists Column */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="space-y-4 px-2">
                    <h3 className="font-display text-lg font-bold flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-secondary" />
                      Soloists
                      <span className="text-[10px] font-mono bg-secondary/10 text-secondary px-2 py-0.5 rounded-full ml-auto">{soloists.length}</span>
                    </h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                      <input
                        type="text"
                        placeholder="Search soloists..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs font-mono focus:border-secondary/50 outline-none transition-all"
                        value={soloSearch}
                        onChange={(e) => setSoloSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                    {soloists.filter(s => 
                      s.name.toLowerCase().includes(soloSearch.toLowerCase()) || 
                      s.rollNumber.toLowerCase().includes(soloSearch.toLowerCase())
                    ).map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSoloist(selectedSoloist === s.id ? null : s.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${selectedSoloist === s.id
                          ? "bg-secondary/20 border-secondary shadow-[0_0_15px_rgba(var(--secondary),0.1)]"
                          : "bg-white/5 border-white/5 hover:border-white/10"
                          }`}
                      >
                        <div className="font-display font-bold text-sm">{s.name}</div>
                        <div className="text-[10px] font-mono text-muted-foreground/40 mt-1">{s.rollNumber}</div>
                      </button>
                    ))}
                    {soloists.length === 0 && (
                      <div className="text-center py-10 opacity-30">
                        <Check className="w-10 h-10 mx-auto mb-2" />
                        <p className="font-mono text-sm">All soloists assigned</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Target Teams Column */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="space-y-4 px-2">
                    <h3 className="font-display text-lg font-bold flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Target Teams
                      <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-auto">{teams.length}</span>
                    </h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                      <input
                        type="text"
                        placeholder="Search teams..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs font-mono focus:border-primary/50 outline-none transition-all"
                        value={teamSearch}
                        onChange={(e) => setTeamSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                    {teams.filter(t => 
                      t.name.toLowerCase().includes(teamSearch.toLowerCase())
                    ).map(t => (
                      <div
                        key={t.id}
                        className={`p-4 rounded-xl border bg-white/5 border-white/5 flex items-center justify-between transition-all group ${!selectedSoloist ? "opacity-40 grayscale pointer-events-none" : "hover:border-primary/30"
                          }`}
                      >
                        <div className="max-w-[60%]">
                          <div className="font-display font-bold text-sm text-foreground truncate">{t.name}</div>
                          <div className="text-[10px] font-mono text-muted-foreground/40">{t.participants.length}/3 members</div>
                        </div>
                        <button
                          onClick={() => handleAssign(t.id)}
                          disabled={!selectedSoloist || seeding === t.id}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-display font-bold text-[10px] hover:scale-105 transition-all shadow-lg shadow-primary/20"
                        >
                          {seeding === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Assign"}
                        </button>
                      </div>
                    ))}
                    {teams.length === 0 && (
                      <div className="text-center py-10 opacity-30">
                        <AlertCircle className="w-10 h-10 mx-auto mb-2" />
                        <p className="font-mono text-sm">No pool available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            {/* QR LOCATIONS TAB */}
            <TabsContent value="qr">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2, 3, 4, 5].map(num => {
                  const stage = qrStages.find(s => s.stageNumber === num) || { stageNumber: num, location: "", clue: "" };
                  const qrValue = `${window.location.origin}/scan?stage=${num}`;

                  return (
                    <div key={num} className="glass-panel p-6 border-white/5 relative group overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                        <MapPin className="w-12 h-12 text-primary" />
                      </div>

                      <div className="flex items-start gap-6 mb-6">
                        <div className="p-3 bg-white rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                          <QRCodeSVG value={qrValue} size={100} level="H" id={`qr-stage-${num}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-display text-lg font-bold mb-1">Stage {num}</h3>
                          <p className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-widest">QR Verification Point</p>
                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => {
                                const canvas = document.getElementById(`qr-stage-${num}`) as HTMLCanvasElement;
                                if (canvas) {
                                  const svg = canvas;
                                  const svgData = new XMLSerializer().serializeToString(svg);
                                  const canvasElement = document.createElement("canvas");
                                  const ctx = canvasElement.getContext("2d");
                                  const img = new Image();
                                  img.onload = () => {
                                    canvasElement.width = img.width + 40;
                                    canvasElement.height = img.height + 80;
                                    if (ctx) {
                                      ctx.fillStyle = "white";
                                      ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
                                      ctx.drawImage(img, 20, 20);
                                      ctx.fillStyle = "black";
                                      ctx.font = "bold 20px Arial";
                                      ctx.textAlign = "center";
                                      ctx.fillText(`CELESTIO - STAGE ${num}`, canvasElement.width / 2, img.height + 50);
                                      const pngUrl = canvasElement.toDataURL("image/png").replace("image/png", "image/octet-stream");
                                      const downloadLink = document.createElement("a");
                                      downloadLink.href = pngUrl;
                                      downloadLink.download = `Celestio_Stage_${num}.png`;
                                      document.body.appendChild(downloadLink);
                                      downloadLink.click();
                                      document.body.removeChild(downloadLink);
                                    }
                                  };
                                  img.src = "data:image/svg+xml;base64," + btoa(svgData);
                                }
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-mono hover:bg-primary/20 transition-all font-bold"
                            >
                              <Download className="w-3 h-3" /> PNG
                            </button>
                            <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono text-muted-foreground flex items-center gap-1.5">
                              <Eye className="w-3 h-3" /> {qrValue.replace(window.location.origin, '')}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-muted-foreground/50 uppercase ml-1">Physical Location</label>
                          <input
                            type="text"
                            placeholder="e.g., Main Entrance, Library 2F"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono focus:border-primary/50 outline-none"
                            value={stage.location}
                            onChange={(e) => {
                              const newStages = [...qrStages];
                              const idx = newStages.findIndex(s => s.stageNumber === num);
                              if (idx > -1) newStages[idx].location = e.target.value;
                              else newStages.push({ stageNumber: num, location: e.target.value, clue: "" });
                              setQrStages(newStages);
                            }}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-muted-foreground/50 uppercase ml-1">Clue/Description</label>
                          <textarea
                            placeholder="Provide a cryptic clue for the next team..."
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono focus:border-primary/50 outline-none resize-none"
                            value={Array.isArray(stage.clue) ? stage.clue.join('\n') : stage.clue}
                            onChange={(e) => {
                              const newStages = [...qrStages];
                              const idx = newStages.findIndex(s => s.stageNumber === num);
                              const val = e.target.value.includes('\n') ? e.target.value.split('\n') : e.target.value;
                              if (idx > -1) newStages[idx].clue = val;
                              else newStages.push({ stageNumber: num, location: "", clue: val });
                              setQrStages(newStages);
                            }}
                          />
                        </div>
                        <button
                          onClick={() => handleUpdateQRStage(stage)}
                          disabled={updatingConfig === `qr_stage_${num}`}
                          className="w-full py-2 bg-white/5 hover:bg-primary/20 hover:text-primary hover:border-primary/30 border border-white/10 rounded-xl text-[10px] font-display font-bold transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                          {updatingConfig === `qr_stage_${num}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          {updatingConfig === `qr_stage_${num}` ? "Syncing..." : "Save Config"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Admin;
