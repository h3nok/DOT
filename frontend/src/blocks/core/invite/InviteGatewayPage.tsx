import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Terminal as TerminalIcon,
  Radio,
  Volume2,
  VolumeX,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  BionicReadingToggle,
  BrainwaveVisualizer,
  DecryptingText,
  FocusedParagraphReader,
  useSoundscapeController,
  type SoundscapeType,
} from "../../../attention-os";
import {
  PremiumGlassCard,
  PremiumTitle,
  PremiumText,
  PremiumButton,
  PremiumInput,
  PremiumTextArea,
  HighContrastBadge,
} from "../../../shared/components/ui/design-system-primitives";

// =========================================================================
// MAIN PORTAL CONTAINER
// =========================================================================
export const InviteGatewayPage: React.FC = () => {
  const navigate = useNavigate();

  // Theme context and state references
  const [bionicMode, setBionicMode] = useState<boolean>(true);
  const [activeParagraph, setActiveParagraph] = useState<number | null>(null);

  const { soundType, volume, setVolume, setSoundscape } =
    useSoundscapeController(0.5);

  // Decryption / key input states
  const [accessKey, setAccessKey] = useState<string>("");
  const [isCipherHovered, setIsCipherHovered] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationLogs, setValidationLogs] = useState<string[]>([]);
  const [validationSuccess, setValidationSuccess] = useState<boolean | null>(
    null,
  );
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // Sliding queue application drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [formData, setFormState] = useState({
    pseudonym: "",
    meshEmail: "",
    focusSphere: "virtualization",
    missionAlignment: "",
  });
  const [isSubmittingForm, setIsSubmittingForm] = useState<boolean>(false);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [generatedTicket, setGeneratedTicket] = useState({
    id: "",
    coordinate: 0,
  });

  // Manifesto Paragraph Content Data
  const manifestoParagraphs = useMemo(
    () => [
      {
        title: "I. The Sovereign Imperative",
        markdown:
          "We believe human consciousness is the ultimate frontier of sovereign ownership. In an era where centralized corporate servers commoditize your private thoughts, memories, and habits, the act of reclaiming your digital footprints is a core declaration of mental independence.",
      },
      {
        title: "II. The Local Mesh Node",
        markdown:
          "Stay is not an external network service; it is a private mechanical extension of your mind. Your digital twin operates inside an isolated, zero-knowledge container utilizing highly localized neural processing networks. It learns in absolute silence, computes with total privacy, and transfers data only upon cryptographic signing.",
      },
      {
        title: "III. Trust Proximity Nodes",
        markdown:
          "The future of authentic collaboration is physical-digital proximity. By linking sovereign nodes directly over encrypted peer-to-peer mesh protocols, we completely bypass central panopticons and rebuild community security and architectural trust from the ground up.",
      },
      {
        title: "IV. The Invitation Model",
        markdown:
          "Access is a stewardship, not a casual subscription. This mesh is invitation-only because genuine trust does not scale. We accept only those committed to architectural privacy, sovereign computing, and active cognitive stewardship of their physical environments.",
      },
    ],
    [],
  );

  // Sync scroll on validation scroller
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [validationLogs]);

  // Handle soundscape toggle
  const handleSoundscapeChange = async (type: SoundscapeType) => {
    await setSoundscape(type);
  };

  // Handle volume updates
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
  };

  // Simulated Cryptographic Validation Sequences
  const triggerValidation = (key: string) => {
    if (!key.trim()) return;

    setIsValidating(true);
    setValidationLogs([]);
    setValidationSuccess(null);

    const logSteps = [
      {
        delay: 100,
        msg: "⚡ [BOOT] BOOTSTRAPPING COGNITIVE CRYPTOGRAPHIC DECRYPTOR...",
      },
      {
        delay: 450,
        msg: "⚙️ [INFO] INGESTING ENTRY KEY SPECIFICATION TOKENS...",
      },
      {
        delay: 900,
        msg: "🛡️ [WAIT] CHALLENGING DECENTRALIZED CITIZEN BLOCK ATTESTATION...",
      },
      {
        delay: 1350,
        msg: "🌌 [COMP] RESOLVING SEED PARITY WITH SOVEREIGN REEF MESH...",
      },
      {
        delay: 1800,
        msg: `🔑 [ANAL] CHECKING ATTESTATION VALIDITY: [${key.toUpperCase()}]`,
      },
    ];

    // Build immediate logs
    logSteps.forEach((step) => {
      setTimeout(() => {
        setValidationLogs((prev) => [...prev, step.msg]);
      }, step.delay);
    });

    const finalCheckingDelay = 2200;
    setTimeout(() => {
      const sanitizedKey = key.trim().toUpperCase();
      const isAuthorized =
        sanitizedKey === "STAY-CORE-0X01" ||
        sanitizedKey === "STAY-ACCESS-2026";

      if (isAuthorized) {
        setValidationLogs((prev) => [
          ...prev,
          "✅ [PASS] SHA-256 PARITY VERIFIED. DECRYPTION SIGNATURE APPLIED.",
          "✨ [SUCCESS] VALID CREDENTIAL IDENTIFIED. MATCH CONFIRMED UNDER CENTRAL REEF CORE.",
          "🚀 [SYS] ROUTING CITIZEN TO COCKPIT ORCHESTRATION CONSOLE...",
        ]);
        setValidationSuccess(true);
        localStorage.setItem("stay_invited", "true");

        // Graceful redirect delay
        setTimeout(() => {
          navigate("/");
        }, 2200);
      } else {
        setValidationLogs((prev) => [
          ...prev,
          "❌ [FAIL] CRYPTOGRAPHIC MISMATCH DETECTED. SEED NOT RECOGNIZED.",
          "⚠️ [WARN] SECURITY SHIELD ACTIVATED. ATTESTATION FORBIDDEN ON PORTAL NODE 0x01.",
          "💡 [SYS] VERIFY CODES OR INITIATE THE WAITING QUEUE ENROLLMENT DRAWER.",
        ]);
        setValidationSuccess(false);
        setIsValidating(false);
      }
    }, finalCheckingDelay);
  };

  // Form Queue Submit handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.pseudonym ||
      !formData.meshEmail ||
      !formData.missionAlignment
    )
      return;

    setIsSubmittingForm(true);

    setTimeout(() => {
      const id =
        "STAY-QUE-" +
        Math.random().toString(36).substring(2, 8).toUpperCase() +
        Math.random().toString(36).substring(2, 6).toUpperCase();
      const coord = Math.floor(Math.random() * 200) + 2104; // Random premium-tier wait list number

      setGeneratedTicket({ id, coordinate: coord });
      setIsSubmittingForm(false);
      setFormSubmitted(true);
    }, 2000);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 md:p-8 relative bg-gradient-to-b from-background to-background/95 overflow-hidden select-none">
      {/* Absolute Tech Notched Background Grid Lines */}
      <div className="absolute inset-0 digital-grid opacity-[0.03] pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/2 dark:bg-primary/5 blur-[120px] pointer-events-none z-0" />

      <div className="container mx-auto max-w-6xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* =========================================================================
            LEFT COLUMN: THE SOVEREIGN MANIFESTO FOCUS WRAPPER (7 COLS)
            ========================================================================= */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <PremiumGlassCard
            className="h-full flex flex-col justify-between"
            innerClassName="p-6 md:p-8 flex flex-col justify-between gap-6"
          >
            {/* Manifesto Header Deck */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <HighContrastBadge glowColor="primary" className="font-mono">
                  _// MESH_ONBOARD_PORTAL_v2.0
                </HighContrastBadge>

                <BionicReadingToggle
                  enabled={bionicMode}
                  onToggle={() => setBionicMode(!bionicMode)}
                />
              </div>

              <PremiumTitle
                tag="h1"
                variant="gradient"
                className="text-3xl md:text-4xl"
                withLine
              >
                The Stay Manifesto
              </PremiumTitle>
              <PremiumText
                variant="vibrant"
                size="base"
                className="opacity-95 leading-relaxed font-serif italic text-muted-foreground"
              >
                Welcome to Stay. This is an invitation-only mesh architecture.
                Tap or hover over any section below to focus your cognitive
                reading field.
              </PremiumText>
            </div>

            <FocusedParagraphReader
              paragraphs={manifestoParagraphs}
              activeIndex={activeParagraph}
              bionicMode={bionicMode}
              onActiveIndexChange={setActiveParagraph}
            />

            {/* Sensory Soundscape Controller Deck */}
            <div className="space-y-3 pt-4 border-t border-border/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-primary animate-pulse" />
                  <span className="font-mono text-xs font-extrabold uppercase tracking-wider">
                    Cognitive Binaural Audio Soundscape
                  </span>
                </div>

                {/* Brainwave Category Buttons */}
                <div className="flex flex-wrap gap-1">
                  {(["alpha", "gamma", "ocean", "off"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => handleSoundscapeChange(type)}
                      className={`px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-widest rounded transition-all active:scale-95 ${
                        soundType === type
                          ? "bg-primary/20 text-primary border border-primary/40"
                          : "bg-secondary/15 text-muted-foreground hover:text-foreground border border-border/30 hover:bg-secondary/30"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time SVG Frequency graph & Volume Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-8">
                  <BrainwaveVisualizer type={soundType} volume={volume} />
                </div>

                {/* Volume Slider */}
                <div className="sm:col-span-4 flex items-center gap-2">
                  {volume === 0 ? (
                    <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={handleVolumeChange}
                    disabled={soundType === "off"}
                    className="w-full h-1 bg-secondary/30 rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Volume slider to adjust the carrier waves and binaural sweep."
                  />
                  <span className="font-mono text-[9px] min-w-[24px] text-right font-bold text-muted-foreground">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </PremiumGlassCard>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: THE CRYPTOGRAPHIC KEY ENTRY CONSOLE (5 COLS)
            ========================================================================= */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <PremiumGlassCard
            enable3D={true}
            className="h-full flex flex-col justify-between"
            innerClassName="p-6 md:p-8 flex flex-col justify-between gap-6"
          >
            {/* Header branding */}
            <div className="text-center space-y-3.5 pb-2 border-b border-border/30">
              <div className="mx-auto w-12 h-12 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center relative group-hover:border-primary/50 transition-colors">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-primary block">
                  🛡️ CREDENTIAL GATEWAY
                </span>
                <PremiumTitle tag="h2" variant="solid" className="text-xl">
                  Mesh Gateway
                </PremiumTitle>
              </div>
            </div>

            {/* Cryptographic Access Field and logs scroller */}
            <div className="space-y-4 flex-grow flex flex-col justify-center">
              <div className="space-y-2">
                <div className="flex items-center justify-between font-mono text-[9px] text-muted-foreground font-bold">
                  <span>stay@mesh-core:~$ input_key</span>
                  <span className="text-primary tracking-widest animate-pulse">
                    ● REEF_SECURE_CHANNEL
                  </span>
                </div>

                {/* Input Container */}
                <div
                  className="relative"
                  onMouseEnter={() => setIsCipherHovered(true)}
                  onMouseLeave={() => setIsCipherHovered(false)}
                >
                  <PremiumInput
                    placeholder="ENTER COGNITIVE KEY..."
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    disabled={isValidating || validationSuccess === true}
                    className="font-mono text-center tracking-widest uppercase placeholder:text-muted-foreground/30 border-primary/25 focus:border-primary bg-black/10 text-sm md:text-base py-3"
                    onKeyDown={(e) =>
                      e.key === "Enter" && triggerValidation(accessKey)
                    }
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none font-mono text-[9px] text-primary/40">
                    [ENT]
                  </div>
                </div>
              </div>

              {/* Dynamic Decrypting Instruction Label */}
              <div className="text-center">
                <PremiumText
                  variant="vibrant"
                  size="xs"
                  className="text-muted-foreground/80 leading-relaxed max-w-[280px] mx-auto"
                >
                  <DecryptingText
                    text="Enter code STAY-CORE-0x01 or STAY-ACCESS-2026 to decrypt and unlock credentials."
                    active={isCipherHovered}
                  />
                </PremiumText>
              </div>

              {/* Animated Decryption Terminal Logs Stream */}
              <div className="h-44 relative bg-black/35 rounded-xl border border-white/5 p-3 font-mono text-[10px] leading-relaxed overflow-hidden flex flex-col justify-between">
                <div className="overflow-y-auto max-h-full flex-grow space-y-1.5 custom-scrollbar text-left select-text">
                  {validationLogs.length === 0 ? (
                    <div className="text-muted-foreground/45 italic flex flex-col items-center justify-center h-full gap-2">
                      <TerminalIcon className="w-5 h-5 opacity-40 animate-pulse text-primary" />
                      <p className="text-[9px]">
                        TERMINAL STANDBY: INPUT COGNITIVE CREDENTIAL
                      </p>
                    </div>
                  ) : (
                    validationLogs.map((log, i) => {
                      let colorClass = "text-muted-foreground";
                      if (log.includes("✅") || log.includes("✨"))
                        colorClass =
                          "text-emerald-400 font-extrabold shadow-[0_0_10px_rgba(52,211,153,0.1)]";
                      if (log.includes("❌") || log.includes("⚠️"))
                        colorClass = "text-sky-400 font-extrabold";
                      if (log.includes("⚡") || log.includes("⚙️"))
                        colorClass = "text-primary font-semibold";
                      return (
                        <p
                          key={i}
                          className={`${colorClass} whitespace-pre-wrap font-mono`}
                        >
                          {log}
                        </p>
                      );
                    })
                  )}
                  <div ref={terminalBottomRef} />
                </div>
                {isValidating && (
                  <div className="h-1 bg-gradient-to-r from-primary/10 via-primary to-accent/10 rounded-full animate-pulse mt-2" />
                )}
              </div>
            </div>

            {/* Bottom Actions and Invitation Drawer launch */}
            <div className="space-y-3.5 pt-2">
              <PremiumButton
                onClick={() => triggerValidation(accessKey)}
                disabled={
                  isValidating ||
                  !accessKey.trim() ||
                  validationSuccess === true
                }
                className="w-full py-2.5 font-mono text-xs font-bold uppercase tracking-widest hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]"
              >
                {isValidating
                  ? "COMPUTING DECRYPTION..."
                  : "AUTHENTICATE CORE ENTRY"}
              </PremiumButton>

              <div className="text-center font-mono">
                <span className="text-[10px] text-muted-foreground">
                  Don't possess an active access key?{" "}
                </span>
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="text-[10px] text-primary font-extrabold hover:underline tracking-wide underline-offset-2 active:scale-95 transition-transform"
                >
                  REQUEST ACCESS KEY
                </button>
              </div>
            </div>
          </PremiumGlassCard>
        </div>
      </div>

      {/* =========================================================================
          SLIDING SOVEREIGN WAITING LIST DRAWER (ANIME-PRESENCE MODAL)
          ========================================================================= */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Dark glass background backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-background/60 backdrop-blur-md z-40 cursor-pointer"
            />

            {/* Sliding Drawer Container */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="fixed bottom-0 inset-x-0 h-[88vh] md:h-[75vh] max-w-4xl mx-auto rounded-t-3xl p-[1px] bg-gradient-to-b from-primary/30 via-border/50 to-transparent shadow-[0_-30px_60px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
            >
              <div className="w-full h-full bg-card/95 backdrop-blur-3xl backdrop-saturate-[1.6] rounded-t-[23px] flex flex-col justify-between p-6 md:p-8 relative">
                {/* Micro tech notches */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-muted rounded-full opacity-60" />
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="absolute top-5 right-5 w-8 h-8 rounded-full border border-border/40 hover:border-primary/40 bg-secondary/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Drawer Body - If not submitted, show form. If submitted, show success ticket */}
                {!formSubmitted ? (
                  <form
                    onSubmit={handleFormSubmit}
                    className="flex-grow flex flex-col justify-between gap-6 md:gap-8 max-w-2xl mx-auto w-full pt-4"
                  >
                    {/* Drawer Title Block */}
                    <div className="text-center space-y-2">
                      <HighContrastBadge
                        glowColor="primary"
                        className="font-mono inline-block"
                      >
                        📍 WAITLIST REGISTRATION PORTAL
                      </HighContrastBadge>
                      <PremiumTitle
                        tag="h2"
                        variant="gradient"
                        className="text-2xl md:text-3xl"
                      >
                        Request Mesh Entrance
                      </PremiumTitle>
                      <PremiumText
                        variant="vibrant"
                        size="sm"
                        className="text-muted-foreground leading-relaxed"
                      >
                        Stay is built systematically to foster focus, structural
                        privacy, and local mesh cooperation. Apply below with
                        your alignment details to obtain waitlist placement.
                      </PremiumText>
                    </div>

                    {/* Input Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Pseudonym field */}
                      <div className="space-y-1.5 text-left">
                        <label className="font-mono text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">
                          Nom de guerre / Pseudonym
                        </label>
                        <PremiumInput
                          placeholder="e.g. CORE_CITIZEN_9"
                          value={formData.pseudonym}
                          onChange={(e) =>
                            setFormState((prev) => ({
                              ...prev,
                              pseudonym: e.target.value,
                            }))
                          }
                          required
                          className="bg-black/10 focus:border-primary border-primary/20"
                        />
                      </div>

                      {/* Mesh node endpoint */}
                      <div className="space-y-1.5 text-left">
                        <label className="font-mono text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">
                          Mesh node address / Email
                        </label>
                        <PremiumInput
                          type="email"
                          placeholder="e.g. node@mesh-core.com"
                          value={formData.meshEmail}
                          onChange={(e) =>
                            setFormState((prev) => ({
                              ...prev,
                              meshEmail: e.target.value,
                            }))
                          }
                          required
                          className="bg-black/10 focus:border-primary border-primary/20"
                        />
                      </div>

                      {/* Primary Alignment sphere selection */}
                      <div className="space-y-1.5 text-left md:col-span-2">
                        <label className="font-mono text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">
                          Primary Cognitive / Development Sphere
                        </label>
                        <select
                          value={formData.focusSphere}
                          onChange={(e) =>
                            setFormState((prev) => ({
                              ...prev,
                              focusSphere: e.target.value,
                            }))
                          }
                          className="w-full bg-black/15 text-foreground font-mono text-xs rounded-xl border border-primary/20 p-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40 transition-colors uppercase cursor-pointer"
                        >
                          <option value="virtualization">
                            0x01: Secure Virtualization & VMs
                          </option>
                          <option value="mesh-networks">
                            0x02: Peer-to-Peer Mesh Hardware
                          </option>
                          <option value="ai-cognitive">
                            0x03: Decentralized Digital Twins / AI
                          </option>
                          <option value="human-steward">
                            0x04: Local Ecosystem Stewardship & Design
                          </option>
                        </select>
                      </div>

                      {/* Intent Manifest statements */}
                      <div className="space-y-1.5 text-left md:col-span-2">
                        <label className="font-mono text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">
                          Mission Alignment / Statement of Intent
                        </label>
                        <PremiumTextArea
                          placeholder="Detail why you wish to align with the Stay Mesh infrastructure. What is your vision of computational sovereignty?"
                          value={formData.missionAlignment}
                          onChange={(e) =>
                            setFormState((prev) => ({
                              ...prev,
                              missionAlignment: e.target.value,
                            }))
                          }
                          required
                          rows={3}
                          className="bg-black/10 focus:border-primary border-primary/20"
                        />
                      </div>
                    </div>

                    {/* Submitting Actions */}
                    <div className="pt-2">
                      <PremiumButton
                        type="submit"
                        disabled={isSubmittingForm}
                        className="w-full py-3 font-mono text-xs font-bold uppercase tracking-widest hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]"
                      >
                        {isSubmittingForm
                          ? "CALCULATING ENROLLMENT ENTROPY..."
                          : "TRANSMIT WAITING LIST SPECIFICATION"}
                      </PremiumButton>
                    </div>
                  </form>
                ) : (
                  // Success queue ticket representation
                  <div className="flex-grow flex flex-col justify-between max-w-lg mx-auto w-full pt-4 gap-6 text-center">
                    <div className="space-y-3">
                      <div className="mx-auto w-12 h-12 rounded-full border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      </div>
                      <HighContrastBadge
                        glowColor="primary"
                        className="font-mono inline-block"
                      >
                        🛰️ ATTESTATION SUCCESSFUL
                      </HighContrastBadge>
                      <PremiumTitle
                        tag="h2"
                        variant="solid"
                        className="text-2xl"
                      >
                        Waiting Ticket Minted
                      </PremiumTitle>
                      <PremiumText
                        variant="vibrant"
                        size="sm"
                        className="text-muted-foreground leading-relaxed"
                      >
                        Your application has been received, verified for
                        alignment, and queued onto Stay Mesh Node 0x01. Save
                        your holographic waiting block below.
                      </PremiumText>
                    </div>

                    {/* Holographic Waitlist Ticket Visual Node */}
                    <div className="relative rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 font-mono text-left space-y-4 shadow-[0_0_20px_rgba(16,185,129,0.1)] overflow-hidden select-text">
                      {/* Watermark scan line */}
                      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-scan z-0 opacity-40 pointer-events-none" />

                      <div className="flex justify-between items-center border-b border-emerald-500/10 pb-3">
                        <span className="text-[9px] uppercase tracking-widest font-extrabold text-emerald-400">
                          STAY SOVEREIGN TICKET
                        </span>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          QUEUE ACTIVE
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-[10px]">
                        <div>
                          <p className="text-[8.5px] text-muted-foreground uppercase tracking-wider font-extrabold">
                            APPLICANT
                          </p>
                          <p className="font-bold text-foreground mt-0.5">
                            {formData.pseudonym.toUpperCase()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8.5px] text-muted-foreground uppercase tracking-wider font-extrabold">
                            NODE ENDPOINT
                          </p>
                          <p className="font-bold text-foreground mt-0.5 truncate">
                            {formData.meshEmail.toUpperCase()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8.5px] text-muted-foreground uppercase tracking-wider font-extrabold">
                            ALIGNMENT SPHERE
                          </p>
                          <p className="font-bold text-foreground mt-0.5 uppercase">
                            {formData.focusSphere}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8.5px] text-muted-foreground uppercase tracking-wider font-extrabold">
                            QUEUE COORDINATE
                          </p>
                          <p className="font-bold text-emerald-400 mt-0.5 font-mono text-xs">
                            #{generatedTicket.coordinate}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-emerald-500/10 pt-3">
                        <p className="text-[8.5px] text-muted-foreground uppercase tracking-wider font-extrabold">
                          TICKET CRYPTO HASH
                        </p>
                        <p className="font-mono text-[9.5px] font-bold text-foreground/80 mt-0.5 break-all">
                          {generatedTicket.id}
                        </p>
                      </div>
                    </div>

                    {/* Ticket Drawer Close Action */}
                    <div className="pt-2">
                      <PremiumButton
                        onClick={() => setIsDrawerOpen(false)}
                        className="w-full py-3 font-mono text-xs font-bold uppercase tracking-widest hover:shadow-[0_0_15px_rgba(52,211,153,0.2)]"
                      >
                        ACKNOWLEDGEMENT & CORE STANDBY
                      </PremiumButton>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InviteGatewayPage;
