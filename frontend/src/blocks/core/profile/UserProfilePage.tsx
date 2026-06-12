import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PremiumText,
  PremiumTitle,
  PremiumGlassCard,
  HighContrastBadge,
  PremiumButton,
  PremiumMetric
} from '../../../shared/components/ui/design-system-primitives';
import {
  User,
  Award,
  Edit,
  X,
  Calendar,
  MapPin,
  Globe,
  Mail,
  Network,
  Cpu,
  Fingerprint,
  Zap,
  ShieldCheck,
  Radio,
  Activity,
  ChevronRight,
  Database,
  Sparkles,
} from 'lucide-react';

import { StayLogo } from '../../../shared/components/ui/StayLogo';

import { TwinGraph } from './components/TwinGraph';
import { JsonModelExplorer } from './components/JsonModelExplorer';
import { TerminalLogs } from './components/TerminalLogs';
import { FootprintInjector } from './components/FootprintInjector';
import { BrandSandbox } from './components/BrandSandbox';
import { MeshMap } from './components/MeshMap';
import { ProfileCredentialsForm } from './components/ProfileCredentialsForm';
import './UserProfilePage.css';

interface Particle {
  id: number;
  startX: number;
  startY: number;
  color: string;
}

// Coordinate and profile details dictionary for Geographic Mesh bases
const LOCATION_NODES: Record<string, {
  name: string;
  x: number;
  y: number;
  description: string;
  properties: {
    nodeType: string;
    activeNeighbors: number;
    latency: string;
    channel: string;
    auditStatus: string;
    coordinates: string;
  };
}> = {
  'Barton Hills': {
    name: 'Barton Hills Node Grid',
    x: 115,
    y: 85,
    description: 'Proximity mesh localized in Barton Hills residential area. High concentration of sovereign home nodes.',
    properties: {
      nodeType: 'GeographicAnchor',
      activeNeighbors: 8,
      latency: '5.2ms (Ultra-Low)',
      channel: 'Ch 0x0C (915MHz LoRa)',
      auditStatus: 'VERIFIED_ZK_CITIZEN',
      coordinates: '30.2505° N, 97.7852° W'
    }
  },
  'East Side': {
    name: 'East Side Town Square Mesh',
    x: 195,
    y: 115,
    description: 'Vibrant local square node mesh in East Austin. Active commercial and social exchange tunnels.',
    properties: {
      nodeType: 'GeographicAnchor',
      activeNeighbors: 14,
      latency: '11.8ms (Low)',
      channel: 'Ch 0x05 (2.4GHz Wi-Fi Mesh)',
      auditStatus: 'VERIFIED_ZK_CITIZEN',
      coordinates: '30.2625° N, 97.7180° W'
    }
  },
  'Zilker': {
    name: 'Zilker Park Community Node',
    x: 105,
    y: 135,
    description: 'Open park proximity zone operating high-power regional transceivers and green-energy battery backings.',
    properties: {
      nodeType: 'GeographicAnchor',
      activeNeighbors: 6,
      latency: '18.4ms (Moderate)',
      channel: 'Ch 0x0A (868MHz BLE Extended)',
      auditStatus: 'VERIFIED_ZK_CITIZEN',
      coordinates: '30.2642° N, 97.7715° W'
    }
  },
  'UT Campus': {
    name: 'UT Austin Campus Mesh',
    x: 150,
    y: 45,
    description: 'High-density academic research node. Connected directly to regional super-computing clusters.',
    properties: {
      nodeType: 'GeographicAnchor',
      activeNeighbors: 22,
      latency: '3.1ms (Speedline)',
      channel: 'Ch 0x01 (5.8GHz Mesh Core)',
      auditStatus: 'VERIFIED_ZK_CITIZEN',
      coordinates: '30.2849° N, 97.7341° W'
    }
  }
};

const UserProfilePage = () => {
  const navigate = useNavigate();
  // Main User State
  const [user, setUser] = useState({
    username: 'H. Ghebrechristos',
    email: 'h@stay.network',
    bio: "Customer 001 for Stay: a first delivered sovereign profile, digital twin, and physical-digital mesh foundation built around Habte's real work and workflows.",
    location: 'Austin, TX // Node 0x01',
    website: 'https://stay.network',
    joinDate: '2023-06-15',
    avatar: null
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...user });

  // AI Twin Dynamic Growth State
  const [cognitiveVectors, setCognitiveVectors] = useState(14242);
  const [dbSize, setDbSize] = useState(4.24);
  const [autonomyLevel, setAutonomyLevel] = useState(4.20);
  const [twinStatus, setTwinStatus] = useState<'idle' | 'processing' | 'indexing' | 'synchronized'>('idle');

  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[TWIN-CORE] Personally owned AI Twin Orchestrator v1.0.0 standby.',
    '[TWIN-CORE] Local vector store encrypted using personal PGP key 0x8F2B.',
    '[TWIN-CORE] Proximity matcher broadcast ready over local WebRTC mesh nodes.',
    '[SYSTEM] Ready to ingest footprint inputs to grow your local AI representation.'
  ]);

  // Stay Brand & Interactive Map State Hooks
  const [brandTheme, setBrandTheme] = useState<'patriot' | 'hearth' | 'midnight' | 'sovereign'>('patriot');
  const [brandAnimation, setBrandAnimation] = useState<'sync' | 'beacon' | 'tectonic' | 'blueprint'>('sync');
  const [hoveredSymbol, setHighlightedSymbol] = useState<'anchor' | 'constellation' | 'compass' | null>(null);

  // Active selected location state for geographic mesh routing
  const [activeLocation, setActiveLocation] = useState<'Barton Hills' | 'East Side' | 'Zilker' | 'UT Campus'>('Barton Hills');

  // Background animation performance toggle state
  const [animateBackground, setAnimateBackground] = useState<boolean>(() => {
    return localStorage.getItem('stay_animate_bg') !== 'false';
  });

  const [meshAnchors, setMeshAnchors] = useState<{ id: number; name: string; x: number; y: number; active: boolean; scale: number }[]>([
    { id: 1, name: 'Downtown Austin Core (Node 0x01)', x: 140, y: 70, active: true, scale: 1 },
    { id: 2, name: 'UT Austin Campus Mesh', x: 130, y: 35, active: true, scale: 1 },
    { id: 3, name: 'South Congress Node Hub', x: 145, y: 110, active: true, scale: 1 },
    { id: 4, name: 'East Side Town Square Node', x: 210, y: 75, active: true, scale: 1 },
    { id: 5, name: 'Zilker Park Community Node', x: 65, y: 95, active: true, scale: 1 }
  ]);

  // Digital Twin Professional Graph Nodes and Links State
  const [twinNodes, setTwinNodes] = useState<any[]>([
    {
      id: 'core',
      label: 'H. Ghebrechristos',
      type: 'core',
      size: 24,
      x: 150,
      y: 110,
      description: 'Sovereign Digital Twin Core coordinator representing the user across the physical-digital space.',
      properties: {
        nodeType: 'SovereignIdentity',
        autonomyLevel: 'Level 4.20',
        encryptedKeys: ['0x8F2B', '0x7C99'],
        lastIngest: 'Just now',
        semanticSpace: 'Austin Node 0x01',
        dimensions: 1536
      }
    },
    {
      id: 'venture-stay',
      label: 'Stay Network',
      type: 'venture',
      size: 16,
      x: 60,
      y: 60,
      description: 'Decentralized technology-driven physical-digital mesh community and autonomous social network agent.',
      properties: {
        nodeType: 'VentureNode',
        subDomain: 'American Civic Trust',
        meshCapacity: '12 Active Nodes',
        zkProofs: '14,242 verified handshakes',
        latency: '< 35ms WebRTC peer routing'
      }
    },
    {
      id: 'skill-sys',
      label: 'Systems Architecture',
      type: 'skill',
      size: 13,
      x: 235,
      y: 60,
      description: 'Multi-agent coordination, edge computing architectures, and telemetry streams.',
      properties: {
        nodeType: 'CoreCompetency',
        experience: '8+ Years',
        vectorDistance: '0.142 (High Similarity)',
        commitsCount: '242 push sessions'
      }
    },
    {
      id: 'skill-zk',
      label: 'Zero-Knowledge Trust',
      type: 'skill',
      size: 13,
      x: 60,
      y: 160,
      description: 'Private-by-design identity verification and escrow smart routing contracts.',
      properties: {
        nodeType: 'CoreCompetency',
        hashAlgorithm: 'Groth16 Snarks',
        vectorDistance: '0.198 (High Similarity)',
        alignmentLevel: '98.5%'
      }
    },
    {
      id: 'proj-webrtc',
      label: 'WebRTC Mesh Router',
      type: 'project',
      size: 13,
      x: 240,
      y: 160,
      description: 'On-device peer-to-peer data and voice mesh router operating on regional grids.',
      properties: {
        nodeType: 'ActiveProject',
        activeNeighbors: '5 coordinates',
        buildTools: ['TypeScript', 'Rust-Wasm', 'SQLite-Vec'],
        deployment: 'Edge Node 0x01'
      }
    }
  ]);

  const [twinLinks, setTwinLinks] = useState<any[]>([
    { source: 'core', target: 'venture-stay', label: 'CO-FOUNDED' },
    { source: 'core', target: 'skill-sys', label: 'MASTERS' },
    { source: 'core', target: 'skill-zk', label: 'MASTERS' },
    { source: 'core', target: 'proj-webrtc', label: 'BUILT' },
    { source: 'venture-stay', target: 'skill-sys', label: 'POWERED_BY' },
    { source: 'venture-stay', target: 'skill-zk', label: 'VERIFIED_BY' },
    { source: 'proj-webrtc', target: 'skill-sys', label: 'REQUIRES' }
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState<string>('core');

  // Particle list for footprint feeding animation
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdCounter = useRef(0);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTerminalLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  // Sync saved knowledge anchors from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('stay_anchored_nodes');
    if (saved) {
      try {
        const anchors = JSON.parse(saved);
        if (Array.isArray(anchors) && anchors.length > 0) {
          const mappedNodes = anchors.map((anch: any) => ({
            id: anch.id,
            label: anch.label || 'Knowledge Anchor...',
            type: 'project',
            size: 12,
            x: 120 + Math.random() * 60,
            y: 120 + Math.random() * 60,
            description: anch.text,
            properties: {
              nodeType: 'KnowledgeAnchor',
              source: anch.articleTitle || 'Stay Article',
              timestamp: new Date(anch.timestamp).toLocaleDateString(),
              relevance: 'Cognitive Anchor'
            }
          }));

          const mappedLinks = anchors.map((anch: any) => ({
            source: 'core',
            target: anch.id,
            label: 'ANCHORED_KNOWLEDGE'
          }));

          setTwinNodes(prev => {
            const uniqueNodes = mappedNodes.filter(n => !prev.some(p => p.id === n.id));
            return [...prev, ...uniqueNodes];
          });

          setTwinLinks(prev => {
            const uniqueLinks = mappedLinks.filter(l => !prev.some(p => p.source === l.source && p.target === l.target));
            return [...prev, ...uniqueLinks];
          });

          // Math increments for dynamic digital twin growth based on anchors
          const numAnchors = mappedNodes.length;
          setCognitiveVectors(prev => prev + numAnchors * 42);
          setDbSize(prev => parseFloat((prev + numAnchors * 0.12).toFixed(2)));
          setAutonomyLevel(prev => parseFloat((prev + numAnchors * 0.02).toFixed(2)));

          // Append to terminal logs
          setTerminalLogs(prev => {
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const newLogs = anchors.map((anch: any) =>
              `[${time}] [INTEGRATION] Remapped local semantic grid. Ingested knowledge anchor from blog: "${anch.label || 'Knowledge Anchor...'}"`
            );
            return [...prev, ...newLogs];
          });
        }
      } catch (e) {
        console.error('Failed to sync stay_anchored_nodes:', e);
      }
    }
  }, []);

  // Sync Geolocation Mesh Anchor Node in Knowledge Graph
  useEffect(() => {
    const currentLocData = LOCATION_NODES[activeLocation];
    if (!currentLocData) return;

    // 1. Update user profile location details
    setUser(prev => ({
      ...prev,
      location: `Austin, TX // ${currentLocData.name} (${currentLocData.properties.coordinates})`
    }));

    // 2. Inject location node and ANCHORED_AT link into twin graph
    setTwinNodes(prev => {
      const baseNodes = prev.filter(n => n.id !== 'loc-active');

      const locNode = {
        id: 'loc-active',
        label: activeLocation,
        type: 'location',
        size: 14,
        x: currentLocData.x,
        y: currentLocData.y,
        description: currentLocData.description,
        properties: { ...currentLocData.properties }
      };

      return baseNodes.map(n => {
        if (n.id === 'core') {
          return {
            ...n,
            properties: {
              ...n.properties,
              semanticSpace: `Austin // ${currentLocData.name}`
            }
          };
        }
        return n;
      }).concat(locNode);
    });

    setTwinLinks(prev => {
      const baseLinks = prev.filter(l => l.target !== 'loc-active');

      const newLink = {
        source: 'core',
        target: 'loc-active',
        label: 'ANCHORED_AT'
      };

      return [...baseLinks, newLink];
    });

    // Automatically select the newly anchored location node on graph mount
    setSelectedNodeId('loc-active');

    // 3. Print ZK-Residency Verification and WebRTC Telemetry Logs
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTerminalLogs(prev => [
      ...prev,
      `[${time}] [GEOLOCATION] Georouting shifted base to regional mesh: '${activeLocation.toUpperCase()}'`,
      `[${time}] [ZK-TRUST] Initializing residency challenge-response handshake over regional nodes.`,
      `[${time}] [ZK-TRUST] Generating Groth16 zk-SNARK citizenship proof...`,
      `[${time}] [ZK-TRUST] Proof verified successfully! Sovereign regional citizenship verified.`,
      `[${time}] [ROUTING] Mesh channel synchronized on '${currentLocData.properties.channel}' (Active Peers: ${currentLocData.properties.activeNeighbors}).`,
      `[${time}] [ROUTING] Route established: CO-FOUNDER -> ANCHORED_AT -> ${currentLocData.name} (Latency: ${currentLocData.properties.latency}).`
    ]);
  }, [activeLocation]);

  // Footprint Ingestion Growth Simulation
  const handleIngestFootprint = (type: 'dev_log' | 'venture' | 'research' | 'code') => {
    if (twinStatus === 'processing' || twinStatus === 'indexing') return;

    setTwinStatus('processing');

    // Spawn particle visual animation originating from the clicked input zone
    const id = particleIdCounter.current++;
    let startX = 75;
    let startY = 215;
    let color = '#2563eb'; // Signal Blue (Dev Log)

    if (type === 'venture') {
      startX = 125;
      color = '#fbbf24'; // Gold Sunset (Venture Idea)
    } else if (type === 'research') {
      startX = 175;
      color = '#38bdf8'; // Liberty Blue (Whitepaper)
    } else if (type === 'code') {
      startX = 225;
      color = '#34d399'; // Emerald (Git Repos)
    }

    setParticles(prev => [...prev, { id, startX, startY, color }]);

    // Log flow sequence
    addLog(`Ingesting footprint data feed: ${type.toUpperCase()}...`);

    setTimeout(() => {
      setTwinStatus('indexing');
      addLog(`Initializing on-device vectorization (BERT-Local-128 model)...`);
      addLog('Generating 1536-dimensional semantic embeddings...');

      setTimeout(() => {
        setTwinStatus('synchronized');
        // Math increments for dynamic digital footprint growth
        const vectorsAdded = Math.floor(Math.random() * 48) + 32;
        const sizeAdded = parseFloat((Math.random() * 0.15 + 0.05).toFixed(2));

        setCognitiveVectors(prev => prev + vectorsAdded);
        setDbSize(prev => parseFloat((prev + sizeAdded).toFixed(2)));
        setAutonomyLevel(prev => parseFloat((prev + 0.01).toFixed(2)));

        addLog(`Successfully generated ${vectorsAdded} local vector embeddings!`);
        addLog(`Upserted to encrypted SQLite-Vec store (+${sizeAdded} MB database allocation).`);
        addLog(`Local semantic alignment remapped. Twin index synchronized.`);

        // Dynamic Graph Expansion
        let addedNode: any = null;
        let addedLinks: any[] = [];

        if (type === 'dev_log') {
          if (!twinNodes.some(n => n.id === 'skill-vec')) {
            addedNode = {
              id: 'skill-vec',
              label: 'SQLite-Vec Store',
              type: 'skill',
              size: 13,
              x: 180,
              y: 145,
              description: 'On-device, high-performance vector library mapping 1536d semantic coordinates.',
              properties: {
                nodeType: 'CoreCompetency',
                indexingLibrary: 'SQLite-Vec',
                dimensions: '1536 floats',
                searchHeuristic: 'Cosine Distance',
                latency: '0.45ms query execution'
              }
            };
            addedLinks = [
              { source: 'core', target: 'skill-vec', label: 'DEPLOYS' },
              { source: 'proj-webrtc', target: 'skill-vec', label: 'STORES_IN' }
            ];
          }
        } else if (type === 'venture') {
          if (!twinNodes.some(n => n.id === 'venture-aether')) {
            addedNode = {
              id: 'venture-aether',
              label: 'Aether Engine',
              type: 'venture',
              size: 16,
              x: 150,
              y: 40,
              description: 'Autonomous multi-agent orchestration layer for decentralized trust alignment.',
              properties: {
                nodeType: 'VentureNode',
                operatingSystem: 'Stay-OS v1.0',
                activeAgents: '4 coordinated processes',
                autonomyScore: '0.94',
                latency: 'Synchronized < 12ms'
              }
            };
            addedLinks = [
              { source: 'core', target: 'venture-aether', label: 'BUILDS' },
              { source: 'venture-stay', target: 'venture-aether', label: 'INTEGRATES' }
            ];
          }
        } else if (type === 'research') {
          if (!twinNodes.some(n => n.id === 'proj-zkid')) {
            addedNode = {
              id: 'proj-zkid',
              label: 'Sovereign ZK-ID',
              type: 'project',
              size: 13,
              x: 105,
              y: 110,
              description: 'Zero-knowledge verification protocols for personal cryptographic twin representations.',
              properties: {
                nodeType: 'ActiveProject',
                proofSystem: 'Groth16 SNARKs',
                verificationComplexity: 'O(1) proof validation',
                hashComplexity: '256-bit proof anchor'
              }
            };
            addedLinks = [
              { source: 'skill-zk', target: 'proj-zkid', label: 'IMPLEMENTS' },
              { source: 'core', target: 'proj-zkid', label: 'IDENTIFIES' }
            ];
          }
        } else if (type === 'code') {
          if (!twinNodes.some(n => n.id === 'badge-commits')) {
            addedNode = {
              id: 'badge-commits',
              label: 'Continuous Committer',
              type: 'badge',
              size: 14,
              x: 150,
              y: 180,
              description: 'Cryptographic badge reflecting high-frequency commits and continuous model training.',
              properties: {
                nodeType: 'TrustCredential',
                verificationHash: '0x9E1B...8A4F',
                issuanceDate: 'June 2026',
                authority: 'Stay Decentralized Ledger',
                auditStatus: 'VERIFIED'
              }
            };
            addedLinks = [
              { source: 'proj-webrtc', target: 'badge-commits', label: 'EARNS' },
              { source: 'core', target: 'badge-commits', label: 'HOLDS' }
            ];
          }
        }

        if (addedNode) {
          setTwinNodes(prev => [...prev, addedNode]);
          setTwinLinks(prev => [...prev, ...addedLinks]);
          setSelectedNodeId(addedNode.id);
          addLog(`[TWIN-GRAPH] Growing graph nodes. Inserted new ${addedNode.type.toUpperCase()} node: '${addedNode.label}'.`);
          addLog(`[TWIN-GRAPH] Inter-node topological links synchronized.`);
        } else {
          addLog(`[TWIN-GRAPH] Model values updated. Graph is already fully matured for footprint type.`);
        }

        // Clear animated particles
        setTimeout(() => {
          setParticles(prev => prev.filter(p => p.id !== id));
          setTwinStatus('idle');
        }, 800);
      }, 1200);
    }, 1000);
  };

  const handleSave = () => {
    setUser(editForm);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm({ ...user });
    setIsEditing(false);
  };

  const stats = {
    customer: '001',
    foundation: 'Stay',
    inviteStatus: 'Prototype',
    backendStatus: 'Pending'
  };

  const recentActivity = [
    {
      id: 1,
      type: 'mesh',
      title: 'Deployed: Decentralized WebRTC Mesh Router v0.8',
      date: '2 hours ago',
      icon: Network
    },
    {
      id: 2,
      type: 'crypto',
      title: 'Verified: Zero-Knowledge peer-identity handshake',
      date: '1 day ago',
      icon: ShieldCheck
    },
    {
      id: 3,
      type: 'ai',
      title: 'Completed: Multi-agent vector cosine-similarity models',
      date: '3 days ago',
      icon: Cpu
    },
    {
      id: 4,
      type: 'escrow',
      title: 'Configured: Micro-escrow tunnels for local transactions',
      date: '1 week ago',
      icon: Fingerprint
    }
  ];

  const badges = [
    { id: 1, name: 'Systems Architect', description: 'Multi-agent telemetry lead', icon: '🛡️' },
    { id: 2, name: 'ZK Pioneer', description: 'Zero-Knowledge trust handshake', icon: '🔑' },
    { id: 3, name: 'Mesh Protocol Builder', description: 'Decentralized local WebRTC routes', icon: '🕸️' },
    { id: 4, name: 'Escrow Creator', description: 'Automated escrow smart trust', icon: '🤝' },
    { id: 5, name: 'Venture Builder', description: 'Co-founded Stay agent network', icon: '🚀' },
    { id: 6, name: 'Semantic Analyst', description: 'Vector similarity intent matching', icon: '🌀' }
  ];



  return (
    <div className="min-h-screen bg-background text-foreground/95 font-sans selection:bg-sky-500/30 selection:text-white leading-relaxed antialiased">
      {/* Hero Section */}
      <div className={`relative overflow-hidden border-b border-border/40 transition-colors duration-500 ${
        animateBackground
          ? "bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-background"
          : "bg-background"
      }`}>
        {animateBackground ? (
          <div className="emergent-complexity opacity-40">
            <div className="fractal-field"></div>
            <div className="fractal-node"></div>
            <div className="fractal-node"></div>
            <div className="fractal-node"></div>
            <div className="fractal-node"></div>
            <div className="fractal-node-2"></div>
            <div className="fractal-node-2"></div>
            <div className="fractal-node-3"></div>
            <div className="fractal-connection"></div>
            <div className="fractal-connection"></div>
            <div className="fractal-micro-connection"></div>
            <div className="fractal-wave"></div>
            <div className="consciousness-particle-system">
              <div className="consciousness-particle seed"></div>
              <div className="consciousness-particle aligned"></div>
              <div className="consciousness-particle cohesive"></div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.03)_0%,transparent_70%)] pointer-events-none" />
        )}

        <div className="relative z-10 container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <PremiumGlassCard enable3D={true} className="w-full">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                {/* Avatar with Patriot Sunset Border Glow */}
                <div className="flex-shrink-0 relative group">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-sky-500 via-amber-500 to-blue-600 opacity-75 blur-sm group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                  <div className="relative w-28 h-28 rounded-full bg-card flex items-center justify-center border border-sky-500/30 overflow-hidden">
                    <User className="w-12 h-12 text-sky-400" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center" title="Stay Mesh Agent Active">
                    <Zap className="w-3.5 h-3.5 text-white animate-pulse" />
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center justify-center md:justify-start gap-3 mb-1.5 flex-wrap">
                        <PremiumTitle tag="h1" variant="gradient">
                          {user.username}
                        </PremiumTitle>
                        <HighContrastBadge glowColor="primary" pulse>
                          CUSTOMER 001
                        </HighContrastBadge>
                        <HighContrastBadge glowColor="secondary">
                          STAY FOUNDATION
                        </HighContrastBadge>
                      </div>
                      <PremiumText variant="accent" weight="bold" size="xs" className="uppercase tracking-widest mb-3">
                        Systems Architect & Venture Builder
                      </PremiumText>
                      <PremiumText variant="vibrant" size="sm" className="max-w-2xl">{user.bio}</PremiumText>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
                      <PremiumButton
                        variant="glass"
                        size="sm"
                        glow
                        onClick={() => {
                          const newValue = !animateBackground;
                          setAnimateBackground(newValue);
                          localStorage.setItem('stay_animate_bg', String(newValue));
                          addLog(`[SYSTEM] Background animations toggled ${newValue ? 'ON' : 'OFF'}.`);
                        }}
                        icon={<Sparkles className={`w-3.5 h-3.5 ${animateBackground ? 'text-amber-400 animate-spin' : 'text-slate-400'}`} style={{ animationDuration: '3s' }} />}
                        className="border-blue-500/20 hover:border-blue-500/40"
                      >
                        BG Anim: {animateBackground ? 'ON' : 'OFF'}
                      </PremiumButton>

                      <PremiumButton
                        variant="glass"
                        size="sm"
                        glow
                        onClick={() => setIsEditing(!isEditing)}
                        icon={isEditing ? <X className="w-4 h-4 text-sky-400" /> : <Edit className="w-4 h-4 text-sky-400" />}
                        className="border-sky-500/20 hover:border-sky-500/40"
                      >
                        {isEditing ? 'Cancel' : 'Edit Credentials'}
                      </PremiumButton>
                    </div>
                  </div>

                  {/* High-Impact Systems Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
                    <PremiumMetric
                      value={stats.customer}
                      label="First Delivery"
                      badge="customer"
                      glowColor="#2563eb"
                    />
                    <PremiumMetric
                      value={stats.foundation}
                      label="Product Base"
                      badge="foundation"
                      glowColor="#10b981"
                    />
                    <PremiumMetric
                      value={stats.inviteStatus}
                      label="Invite Gate"
                      badge="access"
                      glowColor="#06b6d4"
                    />
                    <PremiumMetric
                      value={stats.backendStatus}
                      label="Real Backend"
                      badge="next"
                      glowColor="#f59e0b"
                    />
                  </div>

                  {/* Contact Info */}
                  <div className="flex flex-wrap justify-center md:justify-start items-center gap-5">
                    <div className="flex items-center hover:text-foreground transition-colors">
                      <Mail className="w-3.5 h-3.5 mr-1.5 text-sky-400/85" />
                      <PremiumText variant="vibrant" size="xs" className="font-mono font-semibold">{user.email}</PremiumText>
                    </div>
                    <div className="flex items-center hover:text-foreground transition-colors">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-sky-400/85" />
                      <PremiumText variant="vibrant" size="xs" className="font-mono font-semibold">{user.location}</PremiumText>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1.5 text-sky-400/85" />
                      <PremiumText variant="vibrant" size="xs" className="font-mono font-semibold">
                        Joined {new Date(user.joinDate).toLocaleDateString()}
                      </PremiumText>
                    </div>
                    {user.website && (
                      <div className="flex items-center hover:text-sky-400 transition-colors">
                        <Globe className="w-3.5 h-3.5 mr-1.5 text-sky-400/85" />
                        <a href={user.website} target="_blank" rel="noopener noreferrer">
                          <PremiumText variant="accent" size="xs" className="font-mono font-semibold">stay.network</PremiumText>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </PremiumGlassCard>
          </div>
        </div>
      </div>

      {/* Profile Content Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-8">

              {/* BRAND ADVERTISEMENT & DYNAMIC COGNITIVE TWIN ENGINE */}
              <PremiumGlassCard enable3D={false} className="w-full">
                {/* Glowing mesh background detail */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-sky-500/5 to-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

                <div className="border-b border-sky-500/10 pb-4 mb-6 relative z-10 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    {/* ANIMATED UNIQUE LOGO FOR STAY (THE AMERICAN COMMUNITY ANCHOR) */}
                    <StayLogo size={52} />
                    <div>
                      <PremiumTitle tag="h2">
                        Stay — AI Twin Orchestrator
                      </PremiumTitle>
                      <PremiumText variant="accent" weight="bold" size="xs" className="uppercase tracking-widest mt-0.5">
                        // Local Autonomous Cognitive Agent
                      </PremiumText>
                    </div>
                  </div>
                  <HighContrastBadge glowColor="secondary" pulse>
                    STAY MESH CORE
                  </HighContrastBadge>
                </div>

                <div className="space-y-6 relative z-10 w-full">
                  <PremiumText variant="vibrant" size="sm">
                    Your digital twin is a <strong className="text-foreground font-semibold">personally owned, on-device AI system</strong> that functions as your autonomous representative. By processing your dev logs, git commits, and research papers, it continuously refines an encrypted, multi-dimensional semantic vector model. Your twin acts as an active matchmaker, searching local WebRTC meshes and verifying peer alignments via Zero-Knowledge proofs without ever leaking your private information.
                  </PremiumText>

                  {/* Twin Growth Live Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 px-5 rounded-xl bg-background/50 border border-border/30">
                    <div>
                      <PremiumText variant="secondary" size="xs" weight="bold" className="uppercase tracking-wider font-mono mb-1">
                        Semantic Depth
                      </PremiumText>
                      <PremiumText variant="primary" weight="bold" size="lg" className="font-mono">
                        {cognitiveVectors.toLocaleString()} <span className="text-xs text-muted-foreground">VECS</span>
                      </PremiumText>
                    </div>
                    <div>
                      <PremiumText variant="secondary" size="xs" weight="bold" className="uppercase tracking-wider font-mono mb-1">
                        Local DB Allocation
                      </PremiumText>
                      <PremiumText variant="primary" weight="bold" size="lg" className="font-mono">
                        {dbSize.toFixed(2)} <span className="text-xs text-muted-foreground">MB</span>
                      </PremiumText>
                    </div>
                    <div>
                      <PremiumText variant="secondary" size="xs" weight="bold" className="uppercase tracking-wider font-mono mb-1">
                        Autonomy Rating
                      </PremiumText>
                      <PremiumText variant="primary" weight="bold" size="lg" className="font-mono">
                        Lvl {autonomyLevel.toFixed(2)}
                      </PremiumText>
                    </div>
                    <div>
                      <PremiumText variant="secondary" size="xs" weight="bold" className="uppercase tracking-wider font-mono mb-1">
                        Privacy Level
                      </PremiumText>
                      <HighContrastBadge glowColor="accent" pulse>
                        100% OWNED
                      </HighContrastBadge>
                    </div>
                  </div>

                  {/* Interactive Dynamic Grid of Core Twin Philosophies */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-background/40 border border-border/20 hover:border-sky-500/20 transition-all duration-300">
                      <div className="flex items-center gap-2 mb-2 text-sky-400 font-semibold">
                        <Database className="w-4 h-4" />
                        <PremiumTitle tag="h4" variant="primary" className="font-mono">
                          On-Device SQLite-Vec
                        </PremiumTitle>
                      </div>
                      <PremiumText variant="vibrant" size="xs">
                        Your digital footprint is represented by local vector embeddings stored in an encrypted database that resides on your physical hardware only.
                      </PremiumText>
                    </div>

                    <div className="p-4 rounded-xl bg-background/40 border border-border/20 hover:border-sky-500/20 transition-all duration-300">
                      <div className="flex items-center gap-2 mb-2 text-sky-400 font-semibold">
                        <Fingerprint className="w-4 h-4" />
                        <PremiumTitle tag="h4" variant="primary" className="font-mono">
                          Zero Cloud Tracking
                        </PremiumTitle>
                      </div>
                      <PremiumText variant="vibrant" size="xs">
                        Unlike traditional networks that harvest and capitalize on your user data, your twin's intelligence grows privately under your exclusive cryptographic ownership.
                      </PremiumText>
                    </div>

                    <div className="p-4 rounded-xl bg-background/40 border border-border/20 hover:border-sky-500/20 transition-all duration-300">
                      <div className="flex items-center gap-2 mb-2 text-sky-400 font-semibold">
                        <Sparkles className="w-4 h-4" />
                        <PremiumTitle tag="h4" variant="primary" className="font-mono">
                          Self-Optimizing Goals
                        </PremiumTitle>
                      </div>
                      <PremiumText variant="vibrant" size="xs">
                        As your digital footprint grows, your twin autonomously recalibrates its vector maps, optimizing matching heuristics to pair you with matching engineers and founders.
                      </PremiumText>
                    </div>
                  </div>

                  {/* ACTIVE TWIN KERNEL GROWTH TRACKER & SIMULATOR */}
                  <div className="space-y-4">
                    <PremiumText variant="accent" weight="bold" size="xs" className="font-mono tracking-widest uppercase block mb-1">
                      // Dynamic Profile Knowledge Graph Explorer
                    </PremiumText>

                    {/* Graph & JSON Panel Split Screen Container */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 rounded-xl border border-sky-500/15 bg-black/35 overflow-hidden shadow-2xl relative">
                      <TwinGraph
                        twinNodes={twinNodes}
                        twinLinks={twinLinks}
                        selectedNodeId={selectedNodeId}
                        setSelectedNodeId={setSelectedNodeId}
                        twinStatus={twinStatus}
                        particles={particles}
                      />
                      <JsonModelExplorer
                        selectedNodeId={selectedNodeId}
                        selectedNode={twinNodes.find(n => n.id === selectedNodeId) || twinNodes[0]}
                      />
                    </div>

                    {/* Ingestion & Telemetry Bottom Deck (Logs & Feeds Panel) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 border-t border-border/5">
                      <TerminalLogs logs={terminalLogs} />
                      <FootprintInjector onIngest={handleIngestFootprint} disabled={twinStatus !== 'idle'} />
                    </div>
                  </div>
                </div>
              </PremiumGlassCard>

              <BrandSandbox
                brandTheme={brandTheme}
                setBrandTheme={setBrandTheme}
                brandAnimation={brandAnimation}
                setBrandAnimation={setBrandAnimation}
                hoveredSymbol={hoveredSymbol}
                setHighlightedSymbol={setHighlightedSymbol}
              >
                {/* 1. Geographic Switcher button deck */}
                <div className="space-y-4 pt-6 border-t border-border/20">
                  <div>
                    <PremiumTitle tag="h3" variant="primary" className="flex items-center gap-1.5 mb-2">
                      <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span>Select Active Geographic Mesh Base</span>
                    </PremiumTitle>
                    <PremiumText variant="vibrant" size="xs">
                      Select a physical neighborhood node base to anchor your digital twin core, route local telemetry streams, and perform zero-knowledge residency checks over regional lattices.
                    </PremiumText>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {([
                      { id: 'Barton Hills', label: 'Barton Hills', icon: '📍' },
                      { id: 'East Side', label: 'East Side', icon: '🏡' },
                      { id: 'Zilker', label: 'Zilker', icon: '🌳' },
                      { id: 'UT Campus', label: 'UT Campus', icon: '🏢' }
                    ] as const).map(loc => (
                      <button
                        key={loc.id}
                        onClick={() => {
                          if (twinStatus !== 'idle') return;
                          setActiveLocation(loc.id);
                        }}
                        disabled={twinStatus !== 'idle'}
                        className={`p-3 text-left rounded-xl border transition-all flex flex-col justify-between h-20 group relative overflow-hidden ${
                          activeLocation === loc.id
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                            : 'bg-background/40 border-border/10 hover:border-emerald-500/20 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-lg">{loc.icon}</span>
                          {activeLocation === loc.id && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          )}
                        </div>
                        <div className="text-left w-full overflow-hidden">
                          <span className="text-[10px] font-mono uppercase tracking-widest block font-black leading-none mb-1">
                            {loc.label}
                          </span>
                          <span className="text-[8px] opacity-75 font-mono leading-none block truncate">
                            {LOCATION_NODES[loc.id].properties.coordinates}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <MeshMap
                  meshAnchors={meshAnchors}
                  disabled={twinStatus !== 'idle'}
                  onDropAnchor={(x, y) => {
                    const neighborhoods = [
                      'Barton Hills Local Grid', 'Westlake Sovereign Base', 'East Side Town Square Mesh',
                      'Mueller Digital Commons', 'Hyde Park Peer Trust', 'S. Lamar Co-Op Hub',
                      'Rainey Trust Escrow Node', 'North Loop Mesh Hub'
                    ];
                    const randomName = neighborhoods[Math.floor(Math.random() * neighborhoods.length)] + ` (ID: ${Math.floor(Math.random() * 900) + 100})`;
                    const newNode = {
                      id: Date.now(),
                      name: randomName,
                      x,
                      y,
                      active: true,
                      scale: 0.1
                    };
                    setMeshAnchors(prev => [...prev, newNode]);
                    setTimeout(() => {
                      setMeshAnchors(prev => prev.map(n => n.id === newNode.id ? { ...n, scale: 1 } : n));
                    }, 50);

                    addLog(`[STAY-MESH] Physical anchor dropped at neighborhood coordinates [${x}, ${y}].`);
                    addLog(`[STAY-MESH] Searching WebRTC/BLE meshes for localized proximity nodes...`);
                    setTimeout(() => {
                      addLog(`[STAY-MESH] Connected successfully! Host Node: '${newNode.name.toUpperCase()}'`);
                      addLog(`[ZK-TRUST] Shared peer credentials verified via Zero-Knowledge proof.`);
                      addLog(`[ROUTING] Austin Mesh density remapped. Peer latency synchronized in 8ms.`);
                      setCognitiveVectors(prev => prev + 24);
                      setDbSize(prev => parseFloat((prev + 0.08).toFixed(2)));
                    }, 1000);
                  }}
                />
              </BrandSandbox>

              {/* Recent Activity */}
              <PremiumGlassCard enable3D={false} className="w-full">
                <div className="border-b border-border/20 pb-4 mb-6 relative z-10 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-sky-400" />
                  <PremiumTitle tag="h2">
                    Recent Milestones
                  </PremiumTitle>
                </div>
                <div className="space-y-4 relative z-10">
                  {recentActivity.map((activity) => {
                    const IconComponent = activity.icon;
                    return (
                      <div key={activity.id} className="flex items-start gap-4 p-3.5 rounded-xl bg-card/30 border border-border/10 hover:border-sky-500/10 hover:bg-sky-500/5 transition-all duration-300">
                        <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <PremiumText variant="contrast" size="sm" className="font-bold">{activity.title}</PremiumText>
                          <PremiumText variant="vibrant" size="xs" className="mt-0.5">{activity.date}</PremiumText>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground self-center opacity-45" />
                      </div>
                    );
                  })}
                </div>
              </PremiumGlassCard>

              {/* Edit Profile Form */}
              {isEditing && (
                <ProfileCredentialsForm
                  editForm={editForm}
                  setEditForm={setEditForm}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              )}
            </div>

            {/* Sidebar Column */}
            <div className="space-y-6">
              {/* Badges */}
              <PremiumGlassCard enable3D={false} className="w-full">
                <div className="border-b border-border/20 pb-4 mb-6 relative z-10 flex items-center gap-2">
                  <Award className="w-5 h-5 text-sky-400" />
                  <PremiumTitle tag="h3">
                    Cryptographic Badges
                  </PremiumTitle>
                </div>
                <div className="grid grid-cols-1 gap-3 relative z-10">
                  {badges.map((badge) => (
                    <div key={badge.id} className="flex items-center gap-3.5 p-3 rounded-xl bg-card/20 border border-border/10 hover:border-sky-500/10 transition-colors duration-300">
                      <div className="text-2xl p-2 rounded-lg bg-sky-500/5 border border-sky-500/10">{badge.icon}</div>
                      <div>
                        <PremiumText variant="contrast" size="xs" weight="bold" className="font-mono uppercase tracking-wider">{badge.name}</PremiumText>
                        <PremiumText variant="vibrant" size="xs" className="leading-normal mt-0.5">{badge.description}</PremiumText>
                      </div>
                    </div>
                  ))}
                </div>
              </PremiumGlassCard>

              {/* Venture Showcase Quick Access */}
              <PremiumGlassCard enable3D={false} className="w-full">
                <div className="border-b border-border/20 pb-4 mb-6 relative z-10">
                  <PremiumTitle tag="h3">Venture Mesh Routing</PremiumTitle>
                </div>
                <div className="space-y-2.5 relative z-10">
                  <PremiumButton
                    variant="glass"
                    glow
                    onClick={() => navigate('/')}
                    icon={<Network className="w-4 h-4 text-sky-400" />}
                    className="w-full justify-between group text-xs font-mono"
                  >
                    <span className="flex items-center justify-between w-full">
                      <span>Interactive Node Graph</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform ml-auto" />
                    </span>
                  </PremiumButton>
                  <PremiumButton
                    variant="glass"
                    glow
                    icon={<Cpu className="w-4 h-4 text-sky-400" />}
                    className="w-full justify-between group text-xs font-mono"
                  >
                    <span className="flex items-center justify-between w-full">
                      <span>Configure Mesh Routing</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform ml-auto" />
                    </span>
                  </PremiumButton>
                  <PremiumButton
                    variant="glass"
                    glow
                    icon={<ShieldCheck className="w-4 h-4 text-sky-400" />}
                    className="w-full justify-between group text-xs font-mono"
                  >
                    <span className="flex items-center justify-between w-full">
                      <span>Zero Knowledge Audits</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform ml-auto" />
                    </span>
                  </PremiumButton>
                </div>
              </PremiumGlassCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;