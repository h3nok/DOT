export type NodeKind =
  | 'nexus' | 'hub' | 'service' | 'runtime'
  | 'endpoint' | 'deployment' | 'model'
  | 'ingestion' | 'vectordb' | 'query' | 'probe'
  | 'request' | 'snapshot';

export type NodeState = 'idle' | 'active' | 'deploying' | 'failed' | 'success';

export interface NodeAttrs {
  id: string;
  kind: NodeKind;
  label: string;
  streamId: string; // cluster ID (Louvain community equivalent)
  state: NodeState;
  health: number; // 0..1 smoothed
  period?: string;
  role?: string;
  tagline?: string;
  // Computed values (by algorithms)
  centrality: number; // PageRank (0..1) -> determines size
  betweenness: number; // Bottleneck score (0..1) -> drives glowing aura
  blastRadius: number; // Number of downstream nodes affected
  community: number; // Louvain cluster ID
  // Spatial seeding and physical properties
  x?: number;
  y?: number;
  mass?: number;
  pinned?: boolean;
}

export type EdgeKind = 'data' | 'control' | 'dependency' | 'temporal';

export interface EdgeAttrs {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
  flow: number; // 0..1 throughput (dash speed)
  latencyMs: number;
  saturated: boolean;
}

export interface GraphData {
  nodes: NodeAttrs[];
  edges: EdgeAttrs[];
}

/**
 * Performant PageRank calculation over the graph topology.
 * Drives node visual sizes dynamically.
 */
export function computePageRank(
  nodes: NodeAttrs[],
  edges: EdgeAttrs[],
  iterations: number = 20,
  damping: number = 0.85
): Record<string, number> {
  const ranks: Record<string, number> = {};
  const nodeIds = nodes.map((n) => n.id);
  const n = nodeIds.length;

  if (n === 0) return ranks;

  // Initialize uniform rank
  nodeIds.forEach((id) => {
    ranks[id] = 1 / n;
  });

  // Calculate out-degrees
  const outDegrees: Record<string, number> = {};
  nodeIds.forEach((id) => {
    outDegrees[id] = 0;
  });
  edges.forEach((edge) => {
    if (outDegrees[edge.source] !== undefined) {
      outDegrees[edge.source]++;
    }
  });

  // Power iterations
  for (let iter = 0; iter < iterations; iter++) {
    const nextRanks: Record<string, number> = {};
    nodeIds.forEach((id) => {
      nextRanks[id] = (1 - damping) / n;
    });

    let dangleSum = 0;
    nodeIds.forEach((id) => {
      if (outDegrees[id] === 0) {
        dangleSum += ranks[id];
      }
    });

    edges.forEach((edge) => {
      const sourceDeg = outDegrees[edge.source];
      if (sourceDeg > 0) {
        nextRanks[edge.target] += (damping * ranks[edge.source]) / sourceDeg;
      }
    });

    // Distribute dangling sum
    nodeIds.forEach((id) => {
      nextRanks[id] += (damping * dangleSum) / n;
    });

    // Copy to ranks
    nodeIds.forEach((id) => {
      ranks[id] = nextRanks[id];
    });
  }

  // Normalize to 0..1 range
  let maxRank = Math.max(...Object.values(ranks));
  if (maxRank === 0) maxRank = 1;
  nodeIds.forEach((id) => {
    ranks[id] = ranks[id] / maxRank;
  });

  return ranks;
}

/**
 * Calculates Brandes-style Betweenness Centrality for choke-point visualization.
 */
export function computeBetweenness(
  nodes: NodeAttrs[],
  edges: EdgeAttrs[]
): Record<string, number> {
  const betweenness: Record<string, number> = {};
  const nodeIds = nodes.map((n) => n.id);

  nodeIds.forEach((id) => {
    betweenness[id] = 0;
  });

  // Adjacency list
  const adj: Record<string, string[]> = {};
  nodeIds.forEach((id) => {
    adj[id] = [];
  });
  edges.forEach((e) => {
    if (adj[e.source]) adj[e.source].push(e.target);
  });

  // Brandes algorithm
  nodeIds.forEach((s) => {
    const S: string[] = [];
    const P: Record<string, string[]> = {};
    const sigma: Record<string, number> = {};
    const d: Record<string, number> = {};

    nodeIds.forEach((v) => {
      P[v] = [];
      sigma[v] = 0;
      d[v] = -1;
    });

    sigma[s] = 1;
    d[s] = 0;

    const Q: string[] = [s];

    while (Q.length > 0) {
      const v = Q.shift()!;
      S.push(v);

      adj[v].forEach((w) => {
        if (d[w] < 0) {
          Q.push(w);
          d[w] = d[v] + 1;
        }
        if (d[w] === d[v] + 1) {
          sigma[w] += sigma[v];
          P[w].push(v);
        }
      });
    }

    const delta: Record<string, number> = {};
    nodeIds.forEach((v) => {
      delta[v] = 0;
    });

    while (S.length > 0) {
      const w = S.pop()!;
      P[w].forEach((v) => {
        delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
      });
      if (w !== s) {
        betweenness[w] += delta[w];
      }
    }
  });

  // Scale betweenness values to 0..1
  let maxBet = Math.max(...Object.values(betweenness));
  if (maxBet === 0) maxBet = 1;
  nodeIds.forEach((id) => {
    betweenness[id] = betweenness[id] / maxBet;
  });

  return betweenness;
}

/**
 * BFS Traversal to trace downstream failure blast radius.
 */
export function calculateBlastRadius(
  startId: string,
  nodes: NodeAttrs[],
  edges: EdgeAttrs[]
): Set<string> {
  const affected = new Set<string>([startId]);
  const queue = [startId];

  // Adjacency list for dependency edges only
  const adj: Record<string, string[]> = {};
  nodes.forEach((n) => {
    adj[n.id] = [];
  });
  edges.forEach((e) => {
    if (e.kind === 'dependency' && adj[e.source]) {
      adj[e.source].push(e.target);
    }
  });

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = adj[current] || [];
    neighbors.forEach((neighbor) => {
      if (!affected.has(neighbor)) {
        affected.add(neighbor);
        queue.push(neighbor);
      }
    });
  }

  return affected;
}

/**
 * DFS cycle detection to validate custom synapse additions.
 */
export function willCreateCycle(
  sourceId: string,
  targetId: string,
  nodes: NodeAttrs[],
  edges: EdgeAttrs[]
): boolean {
  if (sourceId === targetId) return true;

  const adj: Record<string, string[]> = {};
  nodes.forEach((n) => {
    adj[n.id] = [];
  });
  edges.forEach((e) => {
    if (adj[e.source]) adj[e.source].push(e.target);
  });

  // Insert virtual edge for simulation
  if (adj[sourceId]) {
    adj[sourceId].push(targetId);
  }

  const visited: Record<string, 'white' | 'gray' | 'black'> = {};
  nodes.forEach((n) => {
    visited[n.id] = 'white';
  });

  function dfs(v: string): boolean {
    visited[v] = 'gray';
    const neighbors = adj[v] || [];
    for (const w of neighbors) {
      if (visited[w] === 'gray') {
        return true; // Cycle detected!
      }
      if (visited[w] === 'white') {
        if (dfs(w)) return true;
      }
    }
    visited[v] = 'black';
    return false;
  }

  for (const n of nodes) {
    if (visited[n.id] === 'white') {
      if (dfs(n.id)) return true;
    }
  }

  return false;
}

/**
 * Scaffold default OMNI-NEXUS live graph records.
 */
export function createDefaultGraph(): GraphData {
  const nodes: NodeAttrs[] = [
    // L1: Core Agent Orchestrator Node (Center, Pinned)
    {
      id: 'aether',
      kind: 'nexus',
      label: 'HOME',
      streamId: 'core',
      state: 'idle',
      health: 0.98,
      role: 'DOT Orchestrator Engine',
      tagline: 'Infinite topology orchestrator & diagnostic intelligence core.',
      centrality: 1,
      betweenness: 1,
      blastRadius: 0,
      community: 0,
      x: 0,
      y: 0,
      mass: 5,
      pinned: true,
    },
    // Stay Venture Cluster (Angle = 0 degrees)
    {
      id: 'stay',
      kind: 'service',
      label: 'STAY',
      streamId: 'stay_cluster',
      state: 'active',
      health: 0.98,
      role: 'Founder & Lead Architect',
      tagline: 'Technology-driven mesh networking and premium physical-digital community.',
      centrality: 0.85,
      betweenness: 0.65,
      blastRadius: 0,
      community: 1,
      x: 220,
      y: 0,
      mass: 2,
      pinned: true,
    },
    {
      id: 'stay_mesh',
      kind: 'runtime',
      label: 'WebRTC Mesh Routing',
      streamId: 'stay_cluster',
      state: 'active',
      health: 0.99,
      centrality: 0.4,
      betweenness: 0.2,
      blastRadius: 0,
      community: 1,
      x: 315,
      y: -127,
      mass: 1,
    },
    {
      id: 'stay_semantic',
      kind: 'model',
      label: 'Semantic Matcher',
      streamId: 'stay_cluster',
      state: 'idle',
      health: 0.96,
      centrality: 0.4,
      betweenness: 0.1,
      blastRadius: 0,
      community: 1,
      x: 315,
      y: 127,
      mass: 1,
    },
    // Sullix Venture Cluster (Angle = 72 degrees)
    {
      id: 'sullix',
      kind: 'service',
      label: 'SULLIX',
      streamId: 'sullix_cluster',
      state: 'active',
      health: 0.92,
      role: 'Founder',
      tagline: 'AI contractor labor market with crypto escrow pipelines.',
      centrality: 0.8,
      betweenness: 0.5,
      blastRadius: 0,
      community: 2,
      x: 68,
      y: 209,
      mass: 2,
      pinned: true,
    },
    {
      id: 'sullix_escrow',
      kind: 'endpoint',
      label: 'Escrow Synapse',
      streamId: 'sullix_cluster',
      state: 'idle',
      health: 0.97,
      centrality: 0.4,
      betweenness: 0.2,
      blastRadius: 0,
      community: 2,
      x: 219,
      y: 260,
      mass: 1,
    },
    {
      id: 'sullix_matcher',
      kind: 'model',
      label: 'Skills Matching VM',
      streamId: 'sullix_cluster',
      state: 'idle',
      health: 0.9,
      centrality: 0.4,
      betweenness: 0.15,
      blastRadius: 0,
      community: 2,
      x: -24,
      y: 339,
      mass: 1,
    },
    // Avia Venture Cluster (Angle = 144 degrees)
    {
      id: 'medroute',
      kind: 'service',
      label: 'AVIA MEDROUTE',
      streamId: 'medroute_cluster',
      state: 'active',
      health: 0.96,
      role: 'Lead Architect',
      tagline: 'HIPAA-compliant dynamic medical transport dispatch.',
      centrality: 0.8,
      betweenness: 0.5,
      blastRadius: 0,
      community: 3,
      x: -178,
      y: 129,
      mass: 2,
      pinned: true,
    },
    {
      id: 'medroute_ingest',
      kind: 'ingestion',
      label: 'NEMT Live Dispatch',
      streamId: 'medroute_cluster',
      state: 'idle',
      health: 0.93,
      centrality: 0.4,
      betweenness: 0.2,
      blastRadius: 0,
      community: 3,
      x: -180,
      y: 288,
      mass: 1,
    },
    {
      id: 'medroute_vdb',
      kind: 'vectordb',
      label: 'Spatial Route Index',
      streamId: 'medroute_cluster',
      state: 'active',
      health: 0.98,
      centrality: 0.4,
      betweenness: 0.1,
      blastRadius: 0,
      community: 3,
      x: -330,
      y: 82,
      mass: 1,
    },
    // HKI Venture Cluster (Angle = 216 degrees)
    {
      id: 'hki',
      kind: 'service',
      label: 'HKI SECURITY',
      streamId: 'hki_cluster',
      state: 'active',
      health: 0.97,
      role: 'Creator',
      tagline: 'AI agent secure context isolation standard.',
      centrality: 0.8,
      betweenness: 0.6,
      blastRadius: 0,
      community: 4,
      x: -178,
      y: -129,
      mass: 2,
      pinned: true,
    },
    {
      id: 'hki_probe',
      kind: 'probe',
      label: 'Sandbox Isolator Check',
      streamId: 'hki_cluster',
      state: 'active',
      health: 0.99,
      centrality: 0.4,
      betweenness: 0.3,
      blastRadius: 0,
      community: 4,
      x: -330,
      y: -82,
      mass: 1,
    },
    {
      id: 'hki_sandbox',
      kind: 'runtime',
      label: 'Secure gRPC VM',
      streamId: 'hki_cluster',
      state: 'active',
      health: 0.98,
      centrality: 0.4,
      betweenness: 0.2,
      blastRadius: 0,
      community: 4,
      x: -180,
      y: -288,
      mass: 1,
    },
    // Core Content Clusters (Angle = 288 degrees)
    {
      id: 'about',
      kind: 'hub',
      label: 'ABOUT HG',
      streamId: 'content_cluster',
      state: 'active',
      health: 0.99,
      tagline: 'Professional bio, skills metrics, and venture milestones.',
      centrality: 0.7,
      betweenness: 0.4,
      blastRadius: 0,
      community: 5,
      x: 68,
      y: -209,
      mass: 2,
      pinned: true,
    },
    {
      id: 'contact',
      kind: 'endpoint',
      label: 'CONTACT INQUIRY',
      streamId: 'content_cluster',
      state: 'active',
      health: 0.99,
      tagline: 'Direct message routing and enterprise inquiries.',
      centrality: 0.7,
      betweenness: 0.4,
      blastRadius: 0,
      community: 5,
      x: -22,
      y: -319,
      mass: 1,
    },
    {
      id: 'blog',
      kind: 'hub',
      label: 'TECHNICAL BLOG',
      streamId: 'content_cluster',
      state: 'active',
      health: 0.99,
      tagline: 'Deep dive articles on AI systems and runtime security.',
      centrality: 0.7,
      betweenness: 0.3,
      blastRadius: 0,
      community: 5,
      x: 206,
      y: -245,
      mass: 1,
      pinned: true,
    },
  ];

  const edges: EdgeAttrs[] = [
    // Aether Orchestrator Control Edges
    { id: 'ae_stay', source: 'aether', target: 'stay', kind: 'control', flow: 0.6, latencyMs: 20, saturated: false },
    { id: 'ae_sullix', source: 'aether', target: 'sullix', kind: 'control', flow: 0.4, latencyMs: 32, saturated: false },
    { id: 'ae_med', source: 'aether', target: 'medroute', kind: 'control', flow: 0.3, latencyMs: 28, saturated: false },
    { id: 'ae_hki', source: 'aether', target: 'hki', kind: 'control', flow: 0.6, latencyMs: 18, saturated: false },

    // Dependency Links (Venture Clusters)
    { id: 'stay_mesh_dep', source: 'stay', target: 'stay_mesh', kind: 'dependency', flow: 0.8, latencyMs: 14, saturated: false },
    { id: 'stay_sem_dep', source: 'stay_mesh', target: 'stay_semantic', kind: 'dependency', flow: 0.5, latencyMs: 35, saturated: false },

    { id: 'sx_escrow_dep', source: 'sullix', target: 'sullix_escrow', kind: 'dependency', flow: 0.3, latencyMs: 75, saturated: false },
    { id: 'sx_match_dep', source: 'sullix', target: 'sullix_matcher', kind: 'dependency', flow: 0.7, latencyMs: 22, saturated: false },

    { id: 'mr_ingest_dep', source: 'medroute', target: 'medroute_ingest', kind: 'dependency', flow: 0.9, latencyMs: 12, saturated: true },
    { id: 'mr_vdb_dep', source: 'medroute_ingest', target: 'medroute_vdb', kind: 'dependency', flow: 0.6, latencyMs: 19, saturated: false },

    { id: 'hki_probe_dep', source: 'hki', target: 'hki_probe', kind: 'dependency', flow: 0.95, latencyMs: 8, saturated: false },
    { id: 'hki_sand_dep', source: 'hki_probe', target: 'hki_sandbox', kind: 'dependency', flow: 0.8, latencyMs: 11, saturated: false },

    // Content Connections
    { id: 'ae_about', source: 'aether', target: 'about', kind: 'data', flow: 0.2, latencyMs: 45, saturated: false },
    { id: 'ae_contact', source: 'aether', target: 'contact', kind: 'data', flow: 0.2, latencyMs: 48, saturated: false },
    { id: 'ae_blog', source: 'aether', target: 'blog', kind: 'data', flow: 0.2, latencyMs: 50, saturated: false },
  ];

  // Run dynamic centrality computations
  const pr = computePageRank(nodes, edges);
  const bet = computeBetweenness(nodes, edges);

  nodes.forEach((node) => {
    node.centrality = pr[node.id] || 0.1;
    node.betweenness = bet[node.id] || 0.1;
    node.blastRadius = calculateBlastRadius(node.id, nodes, edges).size - 1;
  });

  return { nodes, edges };
}
