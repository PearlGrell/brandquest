import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import StarField from "@/components/StarField";
import Navbar from "@/components/Navbar";
import { QrCode, Check, Trophy, Sparkles, MapPin, Camera, CameraOff, Loader, AlertCircle, Users } from "lucide-react";
import { scanQRCode, getQRScans, getEventStatus } from "@/lib/apiClient";
import QrScanner from "qr-scanner";

interface ScanHistory {
  stageNumber: number;
  randomDigit: string;
  clue: string;
  scannedAt: string;
  nextStage?: {
    stageNumber: number;
    stageName: string;
  };
}

const QR_STAGES = 5;
const UNLOCK_MESSAGE = "Round 1: QR Scans";

const QRScanner = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scans, setScans] = useState<ScanHistory[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [teamId, setTeamId] = useState("");
  const [brandName, setBrandName] = useState("");
  const [completionTime, setCompletionTime] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<"granted" | "denied" | "pending">("pending");
  const [lastScannedClue, setLastScannedClue] = useState<{ nextClue: string; discoveredLocation: string | null } | null>(null);
  const [eventStarted, setEventStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const lastScannedRef = useRef<string>("");
  const scanCooldownRef = useRef<NodeJS.Timeout | null>(null);


  const loadScans = useCallback(async (tid: string) => {
    try {
      const data = await getQRScans(tid) as { scans: ScanHistory[]; completion?: { brandName: string; completedAt: string } };
      setScans(data.scans || []);
      if (data.completion) {
        setBrandName(data.completion.brandName);
        setCompletionTime(data.completion.completedAt);
      } else {
        const savedClue = localStorage.getItem(`last_clue_${tid}`);
        if (savedClue) {
          setLastScannedClue(JSON.parse(savedClue));
        }
      }
    } catch (err) {
      console.error("Failed to load scans:", err);
    }
  }, []);

  useEffect(() => {
    const session = localStorage.getItem("celestio_session");
    if (!session) {
      navigate("/login");
    } else {
      setIsLoggedIn(true);
      const data = JSON.parse(session);

      const tid = data.teamId || (data.team && (data.team.teamId || data.team.id)) || "";
      setTeamId(tid);
      loadScans(tid);


      const checkEvent = async () => {
        try {
          const data = await getEventStatus();
          setEventStarted(data.isStarted);
        } catch (err) {
          console.error("Failed to check event status:", err);
        } finally {
          setLoading(false);
        }
      };

      checkEvent();
    }
  }, [navigate, loadScans]);


  const processQRScan = useCallback(
    async (stageNumber: number) => {
      setError("");
      try {
        const response = await scanQRCode(teamId, stageNumber);
        const { scan, brandName: finalBrand } = response as unknown as { 
          scan: { stageNumber: number; randomDigit: string | null; clue: string; nextClue: string; locationName: string | null; brandName?: string }; 
          brandName?: string 
        };

        const newScan: ScanHistory = {
          stageNumber: scan.stageNumber,
          randomDigit: scan.randomDigit || "-",
          clue: scan.clue,
          scannedAt: new Date().toISOString(),
        };

        setScans((prev) => [...prev, newScan]);
        const newClue = {
          nextClue: scan.nextClue,
          discoveredLocation: scan.locationName,
        };
        setLastScannedClue(newClue);
        localStorage.setItem(`last_clue_${teamId}`, JSON.stringify(newClue));

        if (scan.brandName) {
           setBrandName(scan.brandName);
           setCompletionTime(new Date().toLocaleTimeString());
        }

        const successMsg = stageNumber === 0
          ? "✨ Starting Point scanned! Follow the clue to your first challenge."
          : `✨ Stage ${stageNumber} unlocked! ${scan.randomDigit ? `Random digit: ${scan.randomDigit}` : ""}`;

        setSuccess(successMsg);
        setTimeout(() => setSuccess(""), 5000);

        if (scans.length >= QR_STAGES - 1) {
          loadScans(teamId);
        }
      } catch (err) {
        const error = err as Error;
        setError(error.message);
      }
    },
    [teamId, scans.length, loadScans]
  );


  const handleQRDetected = useCallback(
    (result: QrScanner.ScanResult) => {
      const qrData = result.data;


      if (lastScannedRef.current === qrData && scanCooldownRef.current) {
        return;
      }

      lastScannedRef.current = qrData;


      if (scanCooldownRef.current) clearTimeout(scanCooldownRef.current);
      scanCooldownRef.current = setTimeout(() => {
        lastScannedRef.current = "";
      }, 2000);



      // Smart ID extraction
      let stageNumber = parseInt(qrData);

      // Handle full URLs like ...?stage=1
      if (isNaN(stageNumber) && qrData.includes("stage=")) {
        const urlObj = new URL(qrData.startsWith('http') ? qrData : `http://dummy.com/${qrData}`);
        stageNumber = parseInt(urlObj.searchParams.get("stage") || "");
      }

      // Fallback for old colon-based IDs
      if (isNaN(stageNumber) && qrData.includes(":")) {
        const parts = qrData.split(":");
        stageNumber = parseInt(parts[parts.length - 1]);
      }

      if (isNaN(stageNumber) || stageNumber < 0 || stageNumber > 4) {
        setError(`Invalid Identifier. Expected stage 0-4 or a valid URL. Received: ${qrData}`);
        return;
      }



      if (scans.some((s) => s.stageNumber === stageNumber)) {
        setError(`Stage ${stageNumber} already scanned!`);
        return;
      }

      processQRScan(stageNumber);
    },
    [scans, processQRScan]
  );


  useEffect(() => {
    if (!isCameraActive || !videoRef.current) return;

    const initScanner = async () => {
      try {
        setIsScanning(true);
        QrScanner.hasCamera().then((hasCamera) => {
          if (!hasCamera) {
            setError("No camera available on this device");
            setCameraPermission("denied");
            setIsScanning(false);
            return;
          }
        });

        if (!scannerRef.current) {
          scannerRef.current = new QrScanner(
            videoRef.current!,
            handleQRDetected,
            {
              onDecodeError: () => {

              },
              preferredCamera: "environment",
              maxScansPerSecond: 5,
            }
          );
        }

        await scannerRef.current.start();
        setCameraPermission("granted");
        setIsScanning(false);
      } catch (err) {
        const error = err as Error & { name: string; message: string };
        console.error("Camera error:", error);
        if (error.name === "NotAllowedError") {
          setError("Camera permission denied. Please allow camera access.");
          setCameraPermission("denied");
        } else if (error.name === "NotFoundError") {
          setError("No camera found on this device.");
          setCameraPermission("denied");
        } else {
          setError(`Camera error: ${error.message}`);
        }
        setIsScanning(false);
      }
    };

    initScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
      }
    };
  }, [isCameraActive, handleQRDetected]);

  const toggleCamera = async () => {
    if (isCameraActive) {
      setIsCameraActive(false);
    } else {
      setIsScanning(true);
      setIsCameraActive(true);
    }
  };

  const resetScans = () => {
    if (teamId) {
      localStorage.removeItem(`qr_scans_${teamId}`);
      localStorage.removeItem(`qr_brand_${teamId}`);
      localStorage.removeItem(`last_clue_${teamId}`);
    }
    setScans([]);
    setBrandName("");
    setCompletionTime("");
    setSuccess("");
    setError("");
    setLastScannedClue(null);
    setIsCameraActive(false);
  };

  if (!isLoggedIn) return null;

  if (!teamId) {
    return (
      <div className="relative min-h-screen">
        <StarField />
        <Navbar />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md"
          >
            <div className="w-20 h-20 bg-secondary/10 border border-secondary/20 rounded-full flex items-center justify-center mx-auto mb-8 relative">
              <Users className="w-10 h-10 text-secondary" />
              <div className="absolute inset-0 bg-secondary/20 blur-xl animate-pulse" />
            </div>
            <h2 className="font-display text-3xl font-black cosmic-gradient-text mb-4">Team Allotment Pending</h2>
            <p className="font-mono text-muted-foreground/70 text-sm mb-10 leading-relaxed">
              The QR scan requires a team configuration. As a soloist, you must wait for a coordinator to assign you to a team or match you with other participants.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-3 border border-secondary/30 rounded-xl font-display text-sm font-bold text-secondary hover:bg-secondary/10 transition-all uppercase tracking-widest"
            >
              Return to Dashboard
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
        <div className="container mx-auto max-w-2xl">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              className="flex justify-center mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
            >
              <QrCode className="w-12 h-12 text-primary" />
            </motion.div>
            <h2 className="font-display text-3xl md:text-4xl font-black cosmic-gradient-text mb-2">
              {UNLOCK_MESSAGE}
            </h2>
            <p className="font-mono text-muted-foreground/70 text-sm">
              Scan QR codes at event locations to collect random digits
            </p>
          </motion.div>

          {/* Progress tracker - Stages 0-4 */}
          <motion.div
            className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {[0, 1, 2, 3, 4].map((stageNum) => {
              const scan = scans.find((s) => s.stageNumber === stageNum);
              const isAssignedNext = scans.length > 0 && !scan &&
                scans[scans.length - 1].nextStage?.stageNumber === stageNum;

              const stageName = stageNum === 0 ? "Starting Point" : `Stage ${stageNum}`;
              return (
                <div
                  key={stageNum}
                  className={`p-3 rounded-2xl border transition-all text-center relative ${scan
                    ? "border-primary/50 bg-primary/10"
                    : isAssignedNext
                      ? "border-accent/50 bg-accent/10 animate-pulse ring-1 ring-accent/30"
                      : "border-border/30 bg-muted/5 opacity-50"
                    }`}
                >
                  <div className="font-display font-bold text-xs mb-1">{stageName}</div>
                  <p className="font-mono text-lg font-black">
                    {scan ? scan.randomDigit : "?"}
                  </p>
                  {scan && <Check className="w-4 h-4 text-primary mt-1 mx-auto" />}
                  {isAssignedNext && <MapPin className="w-4 h-4 text-accent mt-1 mx-auto" />}
                </div>
              );
            })}
          </motion.div>

          {/* Last Scanned Clue & Next Location */}
          {lastScannedClue && (
            <motion.div
              className="p-6 rounded-2xl border border-accent/30 bg-accent/5 mb-10"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Discovered Location */}
              {lastScannedClue.discoveredLocation && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Check className="w-5 h-5 text-primary" />
                    <h3 className="font-display font-bold text-lg">Location Discovered</h3>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="font-display text-xl font-bold cosmic-gradient-text uppercase tracking-tight">
                      {lastScannedClue.discoveredLocation}
                    </p>
                  </div>
                </div>
              )}

              {/* Next Clue */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-accent" />
                  <h3 className="font-display font-bold text-lg">Your Next Clue</h3>
                </div>
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                  <p className="font-mono text-sm text-muted-foreground/70 italic">
                    "{lastScannedClue.nextClue}"
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Completion Card */}
          {scans.length === QR_STAGES && (
            <motion.div
              className="p-8 rounded-2xl cosmic-gradient/10 border border-primary/30 mb-10 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring" }}
            >
              <motion.div
                className="inline-block mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-8 h-8 text-primary" />
              </motion.div>
              <h3 className="font-display text-2xl font-black mb-3">Round 1 Complete!</h3>
              <p className="font-mono text-muted-foreground/70 mb-4">
                Your collected digits: <span className="text-primary font-bold">{scans.filter(s => s.stageNumber !== 0).map((s) => s.randomDigit).join("")}</span>
              </p>
              <div className="bg-muted/10 p-4 rounded-xl border border-accent/20 mb-6">
                <p className="text-sm text-muted-foreground/60 mb-1">Assigned Brand Name</p>
                <p className={`font-display text-3xl font-black ${brandName ? 'cosmic-gradient-text' : 'text-muted-foreground'}`}>
                  {brandName || "NO BRAND ASSIGNED"}
                </p>
                {!brandName && <p className="text-[10px] uppercase text-destructive mt-2">Error: Brand Pool Empty!</p>}
              </div>
              <p className="font-mono text-sm text-muted-foreground/50">
                Completed at: {completionTime || new Date().toLocaleTimeString()}
              </p>
            </motion.div>
          )}

          {/* Camera Feed */}
          {scans.length < QR_STAGES && (
            <div className="space-y-8">
              {!eventStarted && !loading && (
                <motion.div
                  className="p-8 rounded-2xl border border-destructive/30 bg-destructive/5"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0" />
                    <div>
                      <h3 className="font-display font-bold text-lg text-destructive">Event Not Started</h3>
                      <p className="font-mono text-sm text-destructive/70 mt-1">
                        The event hasn't started yet. QR scanning will be available once the event begins.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.div
                className="rounded-2xl border border-accent/20 bg-muted/5 backdrop-blur-sm overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {/* Camera Permission & Setup */}
                {!isCameraActive ? (
                  <div className="p-8 text-center">
                    <div className="flex justify-center mb-6">
                      <Camera className="w-16 h-16 text-accent opacity-50" />
                    </div>
                    <h3 className="font-display text-xl font-bold mb-3">Ready to Scan?</h3>
                    {loading ? (
                      <p className="font-mono text-sm text-muted-foreground/70 mb-6">
                        Checking if event has started...
                      </p>
                    ) : !eventStarted ? (
                      <p className="font-mono text-sm text-destructive mb-6">
                        Event has not started yet. Scanning will be available soon.
                      </p>
                    ) : (
                      <p className="font-mono text-sm text-muted-foreground/70 mb-6">
                        Point your camera at a QR code to scan and unlock the next stage
                      </p>
                    )}
                    <button
                      onClick={toggleCamera}
                      disabled={!eventStarted || loading}
                      className={`inline-block px-8 py-3 rounded-lg font-display font-bold text-primary-foreground hover:scale-105 transition-transform ${eventStarted && !loading
                        ? "cosmic-gradient cursor-pointer"
                        : "bg-muted/50 text-muted-foreground cursor-not-allowed"
                        }`}
                    >
                      <Camera className="w-5 h-5 inline mr-2" />
                      {loading ? "Loading..." : eventStarted ? "Start Camera" : "Waiting for Event"}
                    </button>
                    {cameraPermission === "denied" && (
                      <p className="font-mono text-sm text-destructive mt-4">
                        Camera access denied. Please enable camera permissions and try again.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    {/* Video Stream */}
                    <video
                      ref={videoRef}
                      className="w-full aspect-video bg-black"
                      playsInline
                    />

                    {/* Scanning Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-64 h-64 border-4 border-primary rounded-lg bg-transparent animate-pulse"></div>
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent"></div>
                    </div>

                    {/* Scanner Status */}
                    <div className="absolute top-4 left-4 right-4 bg-black/60 backdrop-blur-sm p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-primary font-mono text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                        {isScanning ? "Initializing camera..." : "Scanning..."}
                      </div>
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={toggleCamera}
                      className="absolute bottom-4 right-4 p-3 rounded-full bg-black/60 backdrop-blur-sm text-destructive hover:bg-destructive hover:text-white transition-all"
                    >
                      <CameraOff className="w-6 h-6" />
                    </button>
                  </div>
                )}

                {/* Status Messages */}
                {error && (
                  <motion.div
                    className="p-4 bg-destructive/10 border-t border-destructive/30 text-destructive text-sm font-mono"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    className="p-4 bg-primary/10 border-t border-primary/30 text-primary text-sm font-mono"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {success}
                  </motion.div>
                )}
              </motion.div>
            </div>
          )}

          {/* Info */}
          <motion.div
            className="mt-10 p-6 rounded-2xl border border-accent/10 bg-accent/5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="font-display font-bold mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" />
              How It Works
            </h3>
            <ul className="space-y-2 text-sm font-mono text-muted-foreground/70">
              <li>✨ Start at the starting point to receive your first clue</li>
              <li>✨ Follow clues to locations 1-4 in your assigned sequence</li>
              <li>✨ Scan each QR code to unlock your random digits</li>
              <li>✨ Complete all 5 stages to reveal your brand name</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
