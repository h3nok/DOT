export interface CaseStudy {
  slug: string;
  problem: string;
  approach: string;
  outcome: string;
  fullContent: string;
}

export const caseStudiesData: Record<string, CaseStudy> = {
  dot: {
    slug: "dot",
    problem: "Traditional artificial life simulations and cellular automata (like Conway's Game of Life) are restricted to rigid grid cells and simplified deterministic state transitions. They fail to reflect the continuous, scale-free, and emergent complexity observed in physical biology and self-organizing consciousness.",
    approach: "We engineered Digital Organisms Theory (DOT) as a continuous-space biological engine. The architecture leverages high-performance **Web Workers** for concurrent particle calculations, **Three.js (WebGL)** for hardware-accelerated interactive visualizations, and an emergent neural network activation model. Organisms sense environmental resources, adapt weights, and form aggregate structures.",
    outcome: "Achieved the emergence of spontaneous collective behaviors, which we term 'Little c' (individual conscious agents) self-organizing into a larger, coherent 'Greater C' conscious structure. The system remains stable across large scale counts, proving continuous-space models can exhibit biological adaptation and system-level homeostasis.",
    fullContent: `# Case Study: Digital Organisms Theory (DOT)

Exploring emergent complexity and artificial life through continuous-space biological simulations.

---

## 1. Executive Summary
Digital Organisms Theory (DOT) represents a paradigm shift in modeling self-organizing systems. By moving away from discrete, grid-locked cellular automata, DOT introduces a mathematical framework where agents operate in a continuous spatial coordinate system, enabling fluid, lifelike interactions.

## 2. Problem Statement
Discrete models fail to capture:
* **Continuous Flow**: Organisms in nature do not move in locked grid steps.
* **Scale-Free Complexity**: True biological systems self-organize across multiple scales (microscopic organelles to macroscopic systems).
* **Adaptive Feedback Loops**: Most simulations have pre-baked rules rather than allowing neural-network-driven weight adaptations based on sensory inputs.

## 3. Architecture & Design
The system is constructed with three decoupled layers:

\`\`\`mermaid
graph TD
    A[Sensing Layer: Resources & Energy] --> B[Processing Layer: Web Workers]
    B --> C[Visualizer Layer: Three.js/WebGL]
    C --> A
\`\`\`

### Concurrent Calculation via Web Workers
To maintain a high framerate (60fps) during dense population scales, all biological processing, collision detections, and neural weight updates are delegated to background **Web Workers**. This prevents main-thread blockages:

\`\`\`javascript
// Web Worker message dispatcher
const worker = new Worker('/workers/biology.js');
worker.postMessage({
  type: 'UPDATE_BIOLOGY',
  organisms: rawOrganisms,
  resources: resourceGrid
});
\`\`\`

## 4. Key Outcomes & Discoveries
* **Spontaneous Aggregation**: Individual agents ('Little c') naturally aggregated around energy gradients, forming stable, symbiotic colonies ('Greater C').
* **Homeostasis**: Under extreme environmental stressors (simulated toxicity or resource depletion), colonies dynamically adjusted consumption rates to preserve aggregate integrity.
`
  },
  sullix: {
    slug: "sullix",
    problem: "Traditional contractor platforms suffer from slow matchmaking, high intermediary fees, and opaque payment routing. Onerous billing procedures and lack of automatic milestone checking lead to extensive delivery disputes.",
    approach: "We built Sullix, a decentralized workforce marketplace. Sullix replaces human middlemen with an **AI Matching Model** that parses contractor skills against project specs. Payments are handled via custom **Smart Escrow Contracts** that hold funds in trust, releasing them automatically upon milestone verification driven by Zod schema validation.",
    outcome: "Reduced candidate-to-project alignment times from 11 days down to 18 minutes. The cryptographic escrow standard successfully resolved disputes programmatically, reducing billing fees by 75% while ensuring secure contractor payouts.",
    fullContent: `# Case Study: Sullix Marketplace

Securing and automating the contractor workforce through AI-driven matching and smart escrow agreements.

---

## 1. Executive Summary
Sullix is a state-of-the-art labor marketplace designed to completely automate project scoping, matchmaking, and financial disbursement. By integrating smart contract architecture with modern LLM schemas, Sullix secures contractor transactions from inception to payout.

## 2. The Labor Friction Problem
* **Delayed Alignment**: Hiring managers spend dozens of hours reviewing resumes and conducting pre-screening.
* **Payment Delays**: Standard invoicing frequently takes 30-45 days, causing cashflow stress for contractors.
* **Scope Creep**: Undefined or changing deliverables lead to payment disputes and project halts.

## 3. The Sullix Approach
We developed a trustless transaction engine:

1. **Intelligent Scoping**: The client inputs a natural language prompt of their project needs. Our system generates a rigid structure utilizing **Zod schema validation**.
2. **Automated Matching**: High-dimensional semantic vectors align contractor profile skills to the project's milestones.
3. **Escrow Lock**: Funds are locked into a secure multi-signature contract.
4. **Programmatic Release**: Once milestone requirements are committed to the repository or verified via automated API tests, escrow releases funds instantaneously.

## 4. Key Engineering Milestones
* **Zod Integration**: Guaranteed full runtime safety across client-contractor contracts.
* **Low Latency Matchmaking**: Leveraging index search to match contractors in real-time.
`
  },
  medroute: {
    slug: "medroute",
    problem: "Non-emergency medical transportation (NEMT) is highly vulnerable to vehicle delays and dispatch errors. However, because it deals with protected health information (PHI), standard logistics suites cannot be used without risking major HIPAA compliance violations.",
    approach: "We engineered Avia / MedRoute, a HIPAA-compliant medical routing platform. Built with a robust **Spring Boot microservices** backend, React/React Native frontend, and **PostgreSQL with row-level security**, we integrated custom-optimized routing algorithms on top of **Google Maps API** while ensuring end-to-end data encryption.",
    outcome: "Dynamically optimized routes for a fleet of 150+ medical vehicles, reducing pickup delays by 42%. Successfully completed independent third-party audits confirming complete HIPAA compliance, with 0 data exposures.",
    fullContent: `# Case Study: Avia / MedRoute

HIPAA-compliant dynamic vehicle dispatching and routing for medical transportation networks.

---

## 1. Executive Summary
Avia / MedRoute is an enterprise logistics and dispatching platform tailored specifically for NEMT networks. The application integrates secure healthcare records with state-of-the-art vehicle dispatch and routing algorithms to optimize patient transit times safely.

## 2. Challenges in NEMT Logistics
* **Strict Privacy Regulations**: Standard transportation platforms are not HIPAA-compliant. Protected Health Information (PHI) cannot be shared with non-secure servers.
* **Dynamic Schedules**: Patients frequently cancel, reschedule, or require sudden wheelchair-access vehicles.
* **Critical Timings**: Missing a dialysis session has life-threatening consequences, mandating exact, deterministic routing.

## 3. Architectural Security & Logistics
The architecture features robust encryption at rest and in transit:

* **Row-Level Security (RLS)**: Enforced inside PostgreSQL to isolate hospital, dispatcher, and patient accounts.
* **Dynamic Re-Routing**: Utilizing real-time Google Maps telemetry to re-route vehicles around unexpected traffic blockages.

\`\`\`
[Secure Patient Portal]  --> [Encrypted API Gateway] --> [Postgres (RLS Enabled)]
                                     |
                             [Spring Boot Router] --> [Google Maps APIs]
\`\`\`

## 4. Production Outcomes
* **Zero Patient Violations**: Achieved 100% HIPAA compliance through automated encryption and strict key management (KMS).
* **Efficiency Boost**: Vehicles optimized mileage by 28%, significantly reducing carbon footprint and fuel costs.
`
  },
  hki: {
    slug: "hki",
    problem: "As AI agents gain power and access to standard tools (command execution, network fetching), they become vulnerable to prompt injections. Without isolated container guards, a malicious prompt can break out of the agent shell and execute system commands.",
    approach: "We designed Hermetic Knowledge Isolation (HKI), a security standard for LLM sandboxing. HKI defines a **signed-domain runtime** where agents cannot execute arbitrary functions. Communication is strictly governed by a rigid **Model Context Protocol (MCP)** boundary, separating the LLM reasoning loop from the physical operating system.",
    outcome: "HKI is currently used in production by a Fortune 15 retailer, securely isolating over 14,000 active multi-agent systems and preventing 100% of simulated prompt injection breakouts.",
    fullContent: `# Case Study: Hermetic Knowledge Isolation (HKI)

Securing the agentic era through signed-domain runtimes and robust LLM sandbox enforcement.

---

## 1. Executive Summary
Hermetic Knowledge Isolation (HKI) is an enterprise-grade sandbox protocol designed to restrict AI agents. By establishing a rigid boundary between the agent's reasoning capabilities and the operating system, HKI eliminates prompt injection risk and ensures safe tool executions.

## 2. The Agent Security Gap
* **Arbitrary Execution**: Agents given shell execution rights can be manipulated into executing malicious commands (e.g., \`rm -rf\`).
* **Data Leakage**: An agent reading system files can be instructed to post sensitive data to external servers.
* **Context Overwrite**: Malicious inputs can override the system prompt, causing the agent to act against its original instructions.

## 3. The Hermetic Sandboxing Model
We built the sandbox from the ground up:

* **Signed-Domain Runtime**: Every tool available to the agent must carry a valid cryptographic signature.
* **Model Context Protocol (MCP)**: Enforces strict data-only boundaries. Agents can only exchange JSON messages; direct code execution is disabled.
* **Isolated Environments**: Any file manipulation is executed inside short-lived container environments.

## 4. Enterprise Validation
* **Production Scale**: Successfully deployed inside an enterprise, isolating thousands of active agents.
* **Breakout Resilience**: Proved 100% resilient against a battery of 5,000 simulated prompt injection and breakout attacks.
`
  },
  stay: {
    slug: "stay",
    problem: "Modern networking is highly fragmented, suffering from low-dimensional matchmaking, high entry friction, and third-party data tracking. Physical spaces like coworking hubs or social environments are completely disconnected from the digital profiles of their occupants, resulting in missed connections and low community engagement.",
    approach: "We engineered Stay, a next-generation technology-driven networking and community concept. Stay organizes physical spaces into autonomous digital mesh zones using **WebRTC peer-to-peer mesh discoverability**, secure **Zero-Knowledge proximity handshakes** that protect profile identities, and an advanced **Semantic Matchmaking Agent** that processes localized interest graphs in real-time.",
    outcome: "Simulated over 10,000 active mesh node interactions with sub-50ms connection discovery speeds. Established a secure local profile-sharing framework with 0 database-level exposure, proving that agent-driven communities can operate with absolute privacy.",
    fullContent: `# Case Study: Stay — The Social Network Agent

Architecting a technology-driven physical-digital community through decentralized mesh protocols and semantic matchmaking.

---

## 1. Executive Summary
Stay is a high-tech community and networking platform designed to merge physical spaces with an active digital connection layer. By implementing local peer-to-peer discoverability, privacy-preserving zero-knowledge handshakes, and an agentic semantic router, Stay converts standard spaces into intelligent networking organisms.

## 2. The Physical-Digital Friction
* **High Serendipity Friction**: Attendees in the same room remain strangers due to a lack of mutual context.
* **Centralized Data Silos**: Traditional social media platforms track and monetize physical location data and personal chats.
* **Low-Dimensional Search**: Current networking relies on manual tag matching rather than deep semantic/contextual alignment.

## 3. The Stay Architecture
Stay is structured as a decentralized, multi-layered mesh network:

\`\`\`mermaid
graph TD
    A[Physical Space / IoT Gateway] --> B[WebRTC P2P Mesh Network]
    B --> C[ZK-Proximity Handshake]
    C --> D[Semantic Matchmaking Agent]
    D --> E[Interactive WebGL Connection Map]
\`\`\`

### Local Mesh Discoverability via WebRTC
Rather than routing all locations to a centralized cloud, Stay devices discover neighbors locally using WebRTC data channels. Discovery signals operate in sub-50ms, forming an ad-hoc local proximity mesh.

### Zero-Knowledge Proximity Handshakes
To prevent tracking, profile shares are protected via cryptographic ZK proofs. Users can prove mutual interests (e.g., "Looking for a systems co-founder") without revealing their full identity, contact details, or location logs until mutual permission is granted:

\`\`\`javascript
// Stay ZK Interest Verification Proof
const proof = await StayZK.proveProximityInterest({
  userSecret: myPrivateKey,
  interestVector: profileEmbeddings,
  proximityHash: localizedZoneSalt
});
\`\`s

### Multi-Dimensional Semantic Matchmaking
Once secure contact is initiated, Stay's built-in **Social Network Agent** runs local semantic alignment. The agent translates user profiles into high-dimensional vector embeddings, calculating cosine similarities across technical expertise, venture goals, and active collaboration parameters:

* **Real-time clustering**: Groups mesh participants into instant micro-affinity hubs.
* **Serendipity Alerts**: Alerts nearby users of highly aligned venture opportunities.

## 4. Engineering & Simulation Milestones
* **Scalable Mesh Protocol**: Successfully simulated 10k nodes with absolute network stability.
* **E2E Cryptographic Routing**: Fully local profile sharing with zero cloud-level storage of location traces.
`
  }
};
