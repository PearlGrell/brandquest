import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Trophy, Gamepad2, QrCode, AlertCircle, BookOpen, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getEventStatus } from "@/lib/apiClient";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [eventStarted, setEventStarted] = useState(true);
  const [checkingEvent, setCheckingEvent] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem("celestio_session");
    if (session) {
      setIsLoggedIn(true);
      try {
        const data = JSON.parse(session);
        const name = data.teamName || data.name || (data.team && (data.team.teamName || data.team.name)) || "";
        setTeamName(name);
      } catch { setTeamName(""); }
    } else {
      setIsLoggedIn(false);
    }
  }, [location]);

  useEffect(() => {
    const checkEvent = async () => {
      try {
        const data = await getEventStatus();
        setEventStarted(data.isStarted);
      } catch (err) {
        console.error("Failed to check event status:", err);
        setEventStarted(false);
      } finally {
        setCheckingEvent(false);
      }
    };

    if (isLoggedIn) {
      checkEvent();
      const interval = setInterval(checkEvent, 5000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const logout = () => {
    localStorage.removeItem("celestio_session");
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
          ? "glass-panel-strong rounded-none border-t-0 border-x-0 shadow-[0_4px_30px_hsl(312_100%_63%/0.08)]"
          : "bg-transparent border-b border-transparent"
        }`}
    >
      <div className="container h-16 mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <motion.img
            src="/celestio.png"
            alt="Celestio"
            className="h-36 w-auto object-contain mt-2"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          />
        </Link>

        <div className="flex items-center gap-2">
          {isLoggedIn && (
            <>
              <Link
                to="/game"
                className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono font-medium transition-all duration-300 hover:bg-primary/10 hover:text-primary ${location.pathname === "/game" ? "text-primary bg-primary/10" : "text-muted-foreground"
                  }`}
              >
                <Gamepad2 className="w-4 h-4" />
                Play
              </Link>
              <Link
                to="/rounds"
                className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono font-medium transition-all duration-300 hover:bg-primary/10 hover:text-primary ${location.pathname === "/rounds" ? "text-primary bg-primary/10" : "text-muted-foreground"
                  }`}
              >
                <QrCode className="w-4 h-4" />
                Rounds
              </Link>
              <Link
                to="/leaderboard"
                className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono font-medium transition-all duration-300 hover:bg-primary/10 hover:text-primary ${location.pathname === "/leaderboard" ? "text-primary bg-primary/10" : "text-muted-foreground"
                  }`}
              >
                <Trophy className="w-4 h-4" />
                Leaderboard
              </Link>
            </>
          )}

          <Link
            to="/about"
            className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono font-medium transition-all duration-300 hover:bg-secondary/10 hover:text-secondary ${location.pathname === "/about" ? "text-secondary bg-secondary/10" : "text-muted-foreground"
              }`}
          >
            <BookOpen className="w-4 h-4" />
            About
          </Link>

          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg glass-panel text-sm font-mono text-accent hover:bg-accent/10 transition-all"
              >
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse-glow" />
                <span className="truncate max-w-[100px]">{teamName}</span>
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-6 py-2.5 rounded-xl font-mono text-sm font-semibold cosmic-gradient text-primary-foreground neon-glow transition-all duration-300 hover:scale-105"
            >
              Login
            </Link>
          )}

          {/* Mobile Menu */}
          <div className="flex sm:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 text-muted-foreground hover:text-primary transition-all duration-300">
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="glass-panel-strong border-l border-white/10 w-[280px] p-0 overflow-hidden">
                <div className="flex flex-col h-full bg-deep-space/95 backdrop-blur-2xl">
                  <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                      <img src="/celestio.png" alt="Celestio" className="h-10 w-auto object-contain" />
                    </Link>
                  </div>

                  <nav className="flex-1 px-4 py-8 space-y-4">
                    {isLoggedIn && (
                      <>
                        <Link
                          to="/game"
                          className={`flex items-center gap-4 px-4 py-3 rounded-xl text-lg font-mono font-medium transition-all duration-300 ${location.pathname === "/game" ? "text-primary bg-primary/10 border-r-2 border-primary" : "text-muted-foreground hover:bg-white/5"
                            }`}
                        >
                          <Gamepad2 className="w-5 h-5" />
                          Play
                        </Link>
                        <Link
                          to="/rounds"
                          className={`flex items-center gap-4 px-4 py-3 rounded-xl text-lg font-mono font-medium transition-all duration-300 ${location.pathname === "/rounds" ? "text-primary bg-primary/10 border-r-2 border-primary" : "text-muted-foreground hover:bg-white/5"
                            }`}
                        >
                          <QrCode className="w-5 h-5" />
                          Rounds
                        </Link>
                        <Link
                          to="/leaderboard"
                          className={`flex items-center gap-4 px-4 py-3 rounded-xl text-lg font-mono font-medium transition-all duration-300 ${location.pathname === "/leaderboard" ? "text-primary bg-primary/10 border-r-2 border-primary" : "text-muted-foreground hover:bg-white/5"
                            }`}
                        >
                          <Trophy className="w-5 h-5" />
                          Leaderboard
                        </Link>
                      </>
                    )}
                    <Link
                      to="/about"
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl text-lg font-mono font-medium transition-all duration-300 ${location.pathname === "/about" ? "text-secondary bg-secondary/10 border-r-2 border-secondary" : "text-muted-foreground hover:bg-white/5"
                        }`}
                    >
                      <BookOpen className="w-5 h-5" />
                      About
                    </Link>
                  </nav>

                  <div className="p-6 mt-auto border-t border-white/5 space-y-4">
                    {isLoggedIn ? (
                      <>
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-3 px-4 py-3 rounded-xl glass-panel text-accent"
                        >
                          <div className="w-2 h-2 rounded-full bg-accent animate-pulse-glow" />
                          <span className="font-mono truncate">{teamName}</span>
                        </Link>
                        <button
                          onClick={logout}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all font-mono"
                        >
                          <LogOut className="w-5 h-5" />
                          Logout
                        </button>
                      </>
                    ) : (
                      <Link
                        to="/login"
                        className="flex items-center justify-center py-4 rounded-xl font-mono text-lg font-bold cosmic-gradient text-primary-foreground neon-glow"
                      >
                        Login
                      </Link>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
