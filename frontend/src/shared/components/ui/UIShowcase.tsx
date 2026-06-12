import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PremiumText,
  PremiumTitle,
  PremiumGlassCard,
  NeuralNode,
  NeuralLink,
  HighContrastBadge,
  PremiumButton,
  PremiumInput,
  PremiumTextArea,
  PremiumSwitch,
  PremiumSlider,
  PremiumProgress,
  PremiumTerminal,
  PremiumMetric,
  PremiumDropdown
} from './design-system-primitives';
import {
  Cpu,
  ShieldCheck,
  Zap,
  Globe,
  Layers,
  RefreshCw,
  EyeOff,
  Eye,
  Settings,
  Database,
  Info
} from 'lucide-react';
import { AquaticBackground } from './aquatic-background';

const UIShowcase: React.FC = () => {
  // ---------------------------------------------------------------------------
  // 1. STATE INITIALIZATION
  // ---------------------------------------------------------------------------

  // Form input states
  const [operatorName, setOperatorName] = useState('ANON_SYNAPSE');
  const [synapticSeed, setSynapticSeed] = useState('Cognitive retention index standard. Synapse threshold set to optimal.');
  const [targetLocation, setTargetLocation] = useState('STAY_MESH_EAST');
  const [isOverclocked, setIsOverclocked] = useState(false);
  const [fieldIntensity, setHolographicIntensity] = useState(65);

  // Interactive Neural Map nodes state
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>('node-core');

  // Live progress simulation state
  const [memoryRetainment, setMemoryRetainment] = useState(72);
  const [isSyncing, setIsSyncing] = useState(false);

  // Terminal logs state
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "STAY SYSTEM COGNITIVE CORE BOOTED SUCCESSFULLY.",
    "[SYSTEM] Version 4.8.2-delta active.",
    "[STAY-MESH] Handshake established with 18 localized peer nodes.",
    "[TWIN-CORE] Identity matrix verified.",
    "[SYS] Type '/help' in the terminal prompt below to explore capabilities."
  ]);
  const [terminalLatency, setTerminalLatency] = useState('3.2ms');
  const [isLiveStreaming, setIsLiveStreamActive] = useState(false);

  // Background environment elements
  const [bgGridActive, setBgGridActive] = useState(true);

  // ---------------------------------------------------------------------------
  // 2. TIMERS & SIMULATIONS
  // ---------------------------------------------------------------------------

  // Simulate memory fluctuation based on slider intensity and overclock state
  useEffect(() => {
    const timer = setInterval(() => {
      setMemoryRetainment((prev) => {
        const factor = isOverclocked ? 1.5 : 0.5;
        const drift = (Math.random() - 0.45) * factor;
        const baseTarget = fieldIntensity; // gravitate towards field intensity slider
        const diff = baseTarget - prev;
        const adjustment = diff * 0.05 + drift;
        return Math.min(Math.max(Math.round(prev + adjustment), 0), 100);
      });
    }, 1500);

    return () => clearInterval(timer);
  }, [isOverclocked, fieldIntensity]);

  // Simulate automated streaming of cognitive events in terminal
  useEffect(() => {
    if (!isLiveStreaming) return;

    const mockSensoryEvents = [
      () => `[STAY-MESH] Peer sync ping sent. Nodes responding in ${ (Math.random() * 2 + 1).toFixed(1) }ms.`,
      () => `[TWIN-GRAPH] Cognitive retention index delta shifted by ${ (Math.random() * 0.1 - 0.04).toFixed(3) } units.`,
      () => `[SYSTEM] Heat signature stable. Core CPU temperature at ${ Math.floor(Math.random() * 10 + 42) }°C.`,
      () => `[ZK-TRUST] Proof of identity verified off-chain with network consensus.`,
      () => `[GEOLOCATION] Mapped connection to nodes in [Region: Lat ${ (Math.random() * 20 + 35).toFixed(4) }, Lng ${ (Math.random() * -30 - 75).toFixed(4) }].`,
      () => `[TWIN-CORE] Garbage collection swept 4 unused cognitive pathways.`
    ];

    // Speed of log stream depends on overclock and slider
    const intervalSpeed = Math.max(10000 - (fieldIntensity * 70) - (isOverclocked ? 3000 : 0), 2000);

    const streamTimer = setInterval(() => {
      const randomEvent = mockSensoryEvents[Math.floor(Math.random() * mockSensoryEvents.length)]();
      setTerminalLogs(prev => {
        const next = [...prev, randomEvent];
        return next.slice(-40); // cap to last 40 logs
      });
      // Slightly fluctuate terminal latency indicator
      setTerminalLatency(`${ (Math.random() * 1.5 + (isOverclocked ? 1.2 : 2.5)).toFixed(1) }ms`);
    }, intervalSpeed);

    return () => clearInterval(streamTimer);
  }, [isLiveStreaming, fieldIntensity, isOverclocked]);

  // ---------------------------------------------------------------------------
  // 3. HANDLERS
  // ---------------------------------------------------------------------------

  // Custom command processor inside Terminal Component
  const handleTerminalCommand = (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    const cleanCmd = cmd.trim();

    setTerminalLogs(prev => [...prev, `> ${cleanCmd}`]);

    setTimeout(() => {
      if (trimmed === '/help' || trimmed === 'help') {
        setTerminalLogs(prev => [
          ...prev,
          "[SYS] AVAILABLE SYSTEM COMMANDS:",
          "  /sync       - Force a dynamic Zero-Knowledge identity consensus handshake.",
          "  /overclock  - Toggle Overclocking state on/off.",
          "  /tune <num> - Manually set Holographic Intensity percentage.",
          "  /status     - Output local telemetry parameters.",
          "  /crash      - Simulate a high-fidelity system error trace.",
          "  /clear      - Flush terminal logs."
        ]);
      } else if (trimmed === '/sync' || trimmed === 'sync') {
        setIsSyncing(true);
        setTerminalLogs(prev => [...prev, "[ZK-TRUST] Initializing Zero-Knowledge peer consensus handshake..."]);

        setTimeout(() => {
          setTerminalLogs(prev => [
            ...prev,
            "[ZK-TRUST] Merkle tree validated off-chain.",
            "[ZK-TRUST] Consensus reached. 100% of peers verify identity hash. Key encrypted."
          ]);
          setIsSyncing(false);
          setMemoryRetainment(prev => Math.min(prev + 12, 100));
        }, 1200);
      } else if (trimmed === '/overclock' || trimmed === 'overclock') {
        setIsOverclocked(prev => {
          const next = !prev;
          setTerminalLogs(l => [
            ...l,
            next
              ? "[SYSTEM] Core overclock ENGAGED. Synaptic frequency boosted."
              : "[SYSTEM] Core overclock RELEASED. Returning to safe power profiles."
          ]);
          return next;
        });
      } else if (trimmed.startsWith('/tune ') || trimmed.startsWith('tune ')) {
        const parts = trimmed.split(' ');
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num >= 0 && num <= 100) {
          setHolographicIntensity(num);
          setTerminalLogs(prev => [...prev, `[SYSTEM] Holographic field intensity successfully tuned to ${num}%.`]);
        } else {
          setTerminalLogs(prev => [...prev, "[ERR] Tune argument invalid. Use a number between 0 and 100. e.g. /tune 80"]);
        }
      } else if (trimmed === '/status' || trimmed === 'status') {
        setTerminalLogs(prev => [
          ...prev,
          `[SYSTEM] OPERATOR MONIKER: ${operatorName.toUpperCase()}`,
          `[SYSTEM] OVERCLOCK STATE: ${isOverclocked ? "ACTIVE" : "STANDBY"}`,
          `[SYSTEM] MESH GATEWAY: ${targetLocation}`,
          `[SYSTEM] TELEMETRY RATE: ${fieldIntensity}%`,
          `[SYSTEM] COGNITIVE FLOW RATIO: ${memoryRetainment}%`
        ]);
      } else if (trimmed === '/crash' || trimmed === 'crash') {
        setTerminalLogs(prev => [
          ...prev,
          "[ERR] FATAL_SYNAPSE_DESYNC: Sub-threshold brainwave pattern detected.",
          "[ERR] Stack trace in progress...",
          "[ERR]   at StayMeshGateway.sync (stay-mesh.tsx:824:14)",
          "[ERR]   at CognitiveRetentionEngine.evaluate (retention-core.js:401:9)",
          "[ERR]   at process.tick (node:internal/process/task_queues:95:5)",
          "[SYSTEM] Error isolation active. System recovering automatically..."
        ]);
      } else if (trimmed === '/clear' || trimmed === 'clear') {
        setTerminalLogs([]);
      } else {
        setTerminalLogs(prev => [
          ...prev,
          `[USER-SEED] Seed string registered: "${cleanCmd}"`,
          `[SYS] Command unknown. Inscribe '/help' to list valid command keys.`
        ]);
      }
    }, 150);
  };

  const forceSync = () => {
    handleTerminalCommand('/sync');
  };

  // Node coordination details inside Neural Connections Graph
  // Based on parent scale relative coords
  const nodes = [
    {
      id: 'node-core',
      label: 'Core Synthesizer',
      badge: 'SYNTH_V01',
      tagline: 'Gathers raw cognitive signals and coordinates local profile representations.',
      color: '#2563eb',
      accentColor: '#2563eb',
      icon: <Cpu className="w-6 h-6" />,
      coords: { x: 70, y: 120 }
    },
    {
      id: 'node-graph',
      label: 'Cognitive Graph',
      badge: 'MESH_ACTIVE',
      tagline: 'Processes long-term retention maps and local vector memories.',
      color: '#14b8a6',
      accentColor: '#14b8a6',
      icon: <Layers className="w-6 h-6" />,
      coords: { x: 280, y: 55 }
    },
    {
      id: 'node-zkp',
      label: 'ZK-Mesh consensus',
      badge: 'TRUST_ZKP',
      tagline: 'Handles zero-knowledge identity validations off-chain secure vaults.',
      color: '#f97316',
      accentColor: '#f97316',
      icon: <ShieldCheck className="w-6 h-6" />,
      coords: { x: 490, y: 120 }
    }
  ];

  const locationOptions = [
    { value: 'STAY_MESH_EAST', label: 'Stay Mesh - North America East', icon: <Globe className="w-4 h-4 text-sky-400" /> },
    { value: 'STAY_MESH_WEST', label: 'Stay Mesh - North America West', icon: <Globe className="w-4 h-4 text-teal-400" /> },
    { value: 'STAY_MESH_EUR', label: 'Stay Mesh - Europe Central', icon: <Globe className="w-4 h-4 text-amber-400" /> },
    { value: 'STAY_MESH_APAC', label: 'Stay Mesh - Asia Pacific South', icon: <Globe className="w-4 h-4 text-blue-400" /> }
  ];

  // ---------------------------------------------------------------------------
  // 4. RENDERING PRESENTATION
  // ---------------------------------------------------------------------------

  return (
    <AquaticBackground
      className="py-10 sm:py-12 px-4 sm:px-6 lg:px-8 overflow-x-hidden selection:bg-sky-500/20 selection:text-sky-300"
      showGrid={bgGridActive}
      option="A"
    >

      <div className="max-w-7xl mx-auto relative z-10 space-y-12">

        {/* ---------------------------------------------------------------------
            HEADER SECTION
        --------------------------------------------------------------------- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-sky-500/10 pb-8 gap-6">
          <div className="text-left space-y-3 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <HighContrastBadge glowColor="primary" pulse={true}>
                Stay system
              </HighContrastBadge>
              <span className="text-xs font-mono opacity-70 uppercase tracking-wide">Customer 001: Habte profile delivery</span>
            </div>

            <PremiumTitle tag="h1" variant="gradient">
              Stay Design System
            </PremiumTitle>

            <PremiumText variant="vibrant" size="base" className="text-foreground/80 font-sans">
              Stay is the foundation. This page is the delivery harness for the first customer profile: Habte's sovereign twin, invite gate, focus reader, and mesh cockpit primitives working together before the production backend is connected.
            </PremiumText>
          </div>

          {/* Quick Cockpit controls */}
          <div className="flex flex-wrap gap-3 items-center self-start md:self-end">
            <PremiumButton
              variant="glass"
              size="sm"
              onClick={() => setBgGridActive(!bgGridActive)}
              icon={bgGridActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            >
              Grid {bgGridActive ? "active" : "muted"}
            </PremiumButton>

            <PremiumButton
              variant="glass"
              size="sm"
              onClick={forceSync}
              disabled={isSyncing}
              glow={false}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />}
            >
              {isSyncing ? "Syncing mesh..." : "Sync mesh"}
            </PremiumButton>
          </div>
        </div>

        {/* ---------------------------------------------------------------------
            GRID MATRIX LAYOUT
        --------------------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT AREA: INTERACTIVE CONTROLS & TEST FORM - (7/12 cols) */}
          <div className="lg:col-span-7 space-y-8">

            {/* COMPONENT BOX 1: HIGH-FIDELITY COCKPIT FORM */}
            <PremiumGlassCard enable3D={false} className="w-full">
              <div className="space-y-6 text-left">
                <div className="flex items-center justify-between border-b border-border/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_8px_#2563eb]" />
                    <PremiumTitle tag="h3" variant="solid">
                      Form primitives
                    </PremiumTitle>
                  </div>
                  <HighContrastBadge glowColor="none">Secure form</HighContrastBadge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <PremiumInput
                    label="Profile label"
                    badge="Alias"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    placeholder="Enter profile label..."
                  />

                  <PremiumDropdown
                    label="Mesh region"
                    options={locationOptions}
                    value={targetLocation}
                    onChange={(val) => {
                      setTargetLocation(val);
                      setTerminalLogs(prev => [
                        ...prev,
                        `[STAY-MESH] Target region re-routed to: ${val}`
                      ]);
                    }}
                  />
                </div>

                <PremiumTextArea
                  label="Session note"
                  badge="Context"
                  value={synapticSeed}
                  onChange={(e) => setSynapticSeed(e.target.value)}
                  placeholder="Write the context this surface should remember..."
                  rows={3}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-border/10">
                  <PremiumSwitch
                    label="Live simulation"
                    badge="Streams sample events"
                    checked={isOverclocked}
                    onChange={(checked) => {
                      setIsOverclocked(checked);
                      setTerminalLogs(prev => [
                        ...prev,
                        checked
                          ? "[SYSTEM] Core overclock ENGAGED. Synaptic frequency boosted."
                          : "[SYSTEM] Core overclock RELEASED. Returning to safe power profiles."
                      ]);
                    }}
                    glowColor="#2563eb"
                  />

                  <PremiumSlider
                    label="Visual intensity"
                    badge="Display"
                    value={fieldIntensity}
                    onChange={(val) => setHolographicIntensity(val)}
                    min={10}
                    max={100}
                    unit="%"
                    glowColor="#14b8a6"
                  />
                </div>
              </div>
            </PremiumGlassCard>

            {/* COMPONENT BOX 2: NEURAL CONNECTION GRAPH */}
            <PremiumGlassCard enable3D={false} className="w-full">
              <div className="space-y-6 text-left">
                <div className="flex items-center justify-between border-b border-border/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-[0_0_8px_#14b8a6]" />
                    <PremiumTitle tag="h3" variant="solid">
                      Connection primitives
                    </PremiumTitle>
                  </div>
                  <HighContrastBadge glowColor="secondary">Graph</HighContrastBadge>
                </div>

                <PremiumText variant="body" size="sm" className="text-foreground/80">
                  Interactive profile nodes. Click any neural capsule to anchor focus and emit local test parameters. Hover paths to light up flowing vector packets of cognitive information.
                </PremiumText>

                {/* Fixed aspect viewport for perfectly aligned, responsive vector link paths */}
                <div className="relative h-[290px] w-full border border-border/20 rounded-xl bg-black/45 overflow-hidden flex items-center justify-center p-4">

                  {/* Subtle technical background grid inside the widget */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.01)_1px,_transparent_1px)] bg-[size:16px_12px] opacity-40" />

                  {/* Centered coordinate scaled sandbox container */}
                  <div className="relative w-[560px] h-[240px] shrink-0 transform scale-[0.8] sm:scale-100 transition-transform duration-500">

                    {/* SVG Connector Layer */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                      {/* Node Core (2563eb) to Node Graph (14b8a6) */}
                      <NeuralLink
                        from={nodes[0].coords}
                        to={nodes[1].coords}
                        accentColor="#2563eb"
                        isHovered={hoveredNode === 'node-core' || hoveredNode === 'node-graph'}
                        isSelected={selectedNode === 'node-core' || selectedNode === 'node-graph'}
                      />

                      {/* Node Graph (14b8a6) to Node ZKP (f97316) */}
                      <NeuralLink
                        from={nodes[1].coords}
                        to={nodes[2].coords}
                        accentColor="#14b8a6"
                        isHovered={hoveredNode === 'node-graph' || hoveredNode === 'node-zkp'}
                        isSelected={selectedNode === 'node-graph' || selectedNode === 'node-zkp'}
                      />

                      {/* Alternate diagonal underlying link Core (2563eb) to ZKP (f97316) */}
                      <NeuralLink
                        from={nodes[0].coords}
                        to={nodes[2].coords}
                        accentColor="#f97316"
                        isHovered={hoveredNode === 'node-core' || hoveredNode === 'node-zkp'}
                        isSelected={selectedNode === 'node-core' || selectedNode === 'node-zkp'}
                      />
                    </svg>

                    {/* Node Components Overlay */}
                    {nodes.map((node, index) => {
                      return (
                        <div
                          key={node.id}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                          style={{ left: node.coords.x, top: node.coords.y }}
                        >
                          <NeuralNode
                            id={node.id}
                            label={node.label}
                            badge={node.badge}
                            tagline={node.tagline}
                            icon={node.icon}
                            color={node.color}
                            accentColor={node.accentColor}
                            index={index}
                            isHovered={hoveredNode === node.id}
                            isSelected={selectedNode === node.id}
                            onClick={() => {
                              setSelectedNode(node.id);
                              setTerminalLogs(prev => [
                                ...prev,
                                `[TWIN-GRAPH] Selected focus vector anchor: ${node.label.toUpperCase()}`,
                                `[TWIN-GRAPH] Emitting telemetry coordinates to local memory graph.`
                              ]);
                              if (node.id === 'node-zkp') {
                                handleTerminalCommand('/sync');
                              }
                            }}
                            onMouseEnter={() => setHoveredNode(node.id)}
                            onMouseLeave={() => setHoveredNode(null)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Adaptive detailed description panel based on active selected node */}
                <AnimatePresence mode="wait">
                  {selectedNode && (
                    <motion.div
                      key={selectedNode}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="p-4 rounded-xl border bg-black/30 text-left flex gap-4"
                      style={{ borderColor: `${nodes.find(n => n.id === selectedNode)?.color}15` }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border mt-0.5"
                        style={{
                          color: nodes.find(n => n.id === selectedNode)?.color,
                          borderColor: `${nodes.find(n => n.id === selectedNode)?.color}35`,
                          backgroundColor: `${nodes.find(n => n.id === selectedNode)?.color}08`
                        }}
                      >
                        {nodes.find(n => n.id === selectedNode)?.icon}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-mono font-bold text-xs uppercase tracking-wider text-foreground">
                            {nodes.find(n => n.id === selectedNode)?.label}
                          </h5>
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.2 border rounded font-black tracking-widest leading-none"
                            style={{
                              color: nodes.find(n => n.id === selectedNode)?.color,
                              borderColor: `${nodes.find(n => n.id === selectedNode)?.color}30`
                            }}
                          >
                            {nodes.find(n => n.id === selectedNode)?.badge}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed font-sans">
                          {nodes.find(n => n.id === selectedNode)?.tagline} Let's expand this cognitive node path to verify full-stack encryption and hardware-level isolation.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </PremiumGlassCard>

          </div>

          {/* RIGHT AREA: REAL-TIME RECONSTRUCTION SLATE - (5/12 cols) */}
          <div className="lg:col-span-5 space-y-8">

            {/* DYNAMIC REACTIVE CERTIFICATE PANEL: 3D CARD EXCELLENCE */}
            <div className="space-y-2 text-left">
              <span className="text-[10px] font-mono opacity-40 uppercase tracking-widest pl-1">
                // ACTIVE SYNTHESIS MATRIX VIEWPORT
              </span>

              <PremiumGlassCard
                enable3D={true}
                className="w-full cursor-grab active:cursor-grabbing"
                glowColor={isOverclocked ? '#2563eb' : '#14b8a6'}
                innerClassName="p-8 justify-between min-h-[460px]"
              >
                {/* Visual Glass Accent Lines */}
                <div className="absolute top-0 right-12 w-20 h-[1.5px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <div className="absolute bottom-12 left-0 w-[1.5px] h-20 bg-gradient-to-b from-transparent via-accent/30 to-transparent" />

                {/* Subdued Background Logo Stamp */}
                <div className="absolute right-[-10%] bottom-[-5%] text-foreground/5 pointer-events-none scale-150 z-0">
                  <Database className="w-48 h-48" />
                </div>

                <div className="space-y-6 relative z-10 text-left">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <HighContrastBadge glowColor={isOverclocked ? 'primary' : 'secondary'} pulse={isOverclocked}>
                        {isOverclocked ? "OVERCLOCK_ACTIVE" : "STANDBY_SYNC"}
                      </HighContrastBadge>
                      <h4 className="text-base font-mono font-extrabold tracking-widest uppercase text-foreground mt-2">
                        SOVEREIGN_TWIN_V02
                      </h4>
                    </div>

                    <div
                      className={`w-10 h-10 rounded-full border border-border/30 flex items-center justify-center bg-background/50 relative ${isOverclocked ? 'animate-pulse' : ''}`}
                      style={{
                        color: isOverclocked ? '#2563eb' : '#14b8a6',
                        boxShadow: `0 0 15px ${isOverclocked ? '#2563eb' : '#14b8a6'}20`
                      }}
                    >
                      {isOverclocked ? <Zap className="w-5 h-5 fill-sky-500/20" /> : <ShieldCheck className="w-5 h-5" />}
                    </div>
                  </div>

                  {/* Reactive variables compiled from inputs */}
                  <div className="space-y-4 pt-4 border-t border-border/10 font-mono text-xs">

                    <div className="flex justify-between items-center py-1">
                      <span className="opacity-45">_MONIKER:</span>
                      <span className="font-bold text-foreground tracking-widest bg-foreground/5 rounded px-2 py-0.5">
                        {operatorName ? operatorName.toUpperCase() : "ANONYMOUS"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="opacity-45">_GATEWAY:</span>
                      <span className="font-semibold text-foreground bg-foreground/5 rounded px-2 py-0.5">
                        {targetLocation}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="opacity-45">_FIDELITY:</span>
                      <span className="font-bold text-teal-400">
                        {fieldIntensity}% LUMINESCENCE
                      </span>
                    </div>

                    <div className="space-y-2 pt-2 text-left font-sans">
                      <span className="font-mono text-[10px] opacity-45 block">// INSCRIBED BASILINES:</span>
                      <PremiumText variant="editorial" className="text-xs text-foreground/90 pl-3 border-l-2 border-primary/30 py-1 bg-white/[0.01] dark:bg-black/10 rounded-r min-h-[40px]">
                        "{synapticSeed || "No active baseline thought pattern registered yet..."}"
                      </PremiumText>
                    </div>

                  </div>
                </div>

                <div className="space-y-4 pt-6 mt-8 border-t border-border/10 relative z-10">
                  <PremiumProgress
                    value={memoryRetainment}
                    label="Cognitive Retention Index Ratio"
                    badge={isOverclocked ? "OVERCLOCK_DRIFT" : "DYNAMIC_DRIFT"}
                    glowColor={isOverclocked ? '#2563eb' : '#10b981'}
                  />

                  <div className="flex items-center justify-between text-[9px] font-mono opacity-40">
                    <span>SECTOR_SIG: SHA-256//924A_C</span>
                    <span>COGNITIVE RETENTION STABLE</span>
                  </div>
                </div>
              </PremiumGlassCard>
            </div>

            {/* LIVE FEEDBACK TELEMETRY LOG VIEWPORT */}
            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-mono opacity-40 uppercase tracking-widest">
                  // COGNITIVE LOG ENGINE FEED
                </span>
                <button
                  onClick={() => setIsLiveStreamActive(!isLiveStreaming)}
                  className={`text-[9.5px] font-mono px-2 py-0.5 border rounded-full transition-all duration-300 ${
                    isLiveStreaming
                      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                      : 'text-muted-foreground border-border/30 hover:border-foreground/30 bg-background/50'
                  }`}
                >
                  {isLiveStreaming ? "Streaming: Active" : "Streaming: Suspended"}
                </button>
              </div>

              <PremiumTerminal
                logs={terminalLogs}
                onCommand={handleTerminalCommand}
                latency={terminalLatency}
                title="STAY_COGNITIVE_TERMINAL_DECK"
                disabled={isSyncing}
              />
            </div>

          </div>

        </div>

        {/* ---------------------------------------------------------------------
            LOWER AREA: TELEMETRY STATS & PRIMITIVE MANUAL REFERENCE
        --------------------------------------------------------------------- */}
        <div className="space-y-6 pt-10 border-t border-border/10 text-left">

          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-500" />
            <PremiumTitle tag="h2" variant="solid">
              System metrics
            </PremiumTitle>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <PremiumMetric
              label="Synaptic Speed"
              value={`${(2.8 * (fieldIntensity / 50) * (isOverclocked ? 2.1 : 1.0)).toFixed(2)} GHz`}
              badge="CLOCK_HZ"
              trend={{ direction: isOverclocked ? 'up' : 'down', amount: isOverclocked ? '+110%' : '-1.4%' }}
              glowColor="#2563eb"
            />

            <PremiumMetric
              label="ZK Consensus Trust"
              value={isSyncing ? "CALCULATING" : "100.0%"}
              badge="ZKP_MESH"
              trend={isSyncing ? undefined : { direction: 'up', amount: 'STABLE' }}
              glowColor="#14b8a6"
            />

            <PremiumMetric
              label="Synapse Count"
              value={operatorName ? operatorName.length * 112 : 1240}
              badge="NEURAL_CELL"
              trend={{ direction: 'up', amount: `${operatorName ? operatorName.length : 0} nodes` }}
              glowColor="#f97316"
            />

            <PremiumMetric
              label="Field Volatility"
              value={`${Math.round(100 - fieldIntensity + (isOverclocked ? 25 : 5))}%`}
              badge="VOLATILITY_PCT"
              trend={{ direction: isOverclocked ? 'up' : 'down', amount: isOverclocked ? '+25%' : 'STABLE' }}
              glowColor="#0f766e"
            />
          </div>

          {/* Quick Technical Tip Card */}
          <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/5 flex items-start gap-3 max-w-4xl">
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1 font-sans text-xs sm:text-sm text-foreground/80 leading-relaxed">
              <span className="font-mono font-bold text-xs uppercase tracking-wider text-blue-400 block mb-0.5">Integration Guidelines // No Placeholders</span>
              All 16 primitives are styled via a centralized design system using standard <span className="font-mono bg-white/5 px-1 py-0.5 rounded">index.css</span> and framer-motion. There are absolutely no faint slate colors or standard washed out slates, matching optimal high-contrast compliance for Stay's immersive retainment goals. Developers can copy, paste, and wire these primitives into profiles, learning cockpit channels, or system consoles.
            </div>
          </div>

        </div>

      </div>
    </AquaticBackground>
  );
};

export default UIShowcase;
