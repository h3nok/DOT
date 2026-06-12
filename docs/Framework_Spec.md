# PLEXUS

**A living-interface framework for React & agentic software.**
Status: `SPEC v1.0` · Classification: `Proprietary` · Supersedes the UI sections of *Omni-Nexus v1.0* and *NEXUS Build Plan v2.0*

> **plexus** *(n.)* — an intricate network of interwoven nerves or vessels branching from a central trunk.

Plexus is a React framework for building interfaces where the screen is not a page but a **living graph**: a central core, branching nodes, and synaptic edges that carry live signals. It is purpose-built for agentic software — orchestrators, agent fleets, observability surfaces, digital twins — where the thing being interfaced is itself a graph that executes over time. Plexus ships as a set of composable, headless-first npm packages with an opinionated default skin.

> **Naming note.** A minor state library `PlexusJS` exists; the publishable npm scope is `@plexus-ui/*` (or a coined trunk name) pending clearance. This document uses `@plexus/*` for readability.

---

## Table of contents
1. Thesis — why a new framework
2. The eight laws
3. Core concepts & vocabulary
4. Package architecture
5. Component API — declarative
6. Component API — data-driven
7. Hooks API
8. Interaction system
9. The agentic layer
10. Rendering model
11. State & graph model
12. Design language & tokens
13. Lenses (theming contract)
14. Accessibility
15. SSR / RSC / SEO
16. Performance budgets
17. Distribution & compatibility
18. Recipes
19. Testing
20. Versioning & stability
21. Positioning vs alternatives
22. Roadmap
23. Open questions
- Appendix A: token reference
- Appendix B: data-attribute & keyboard reference

---

## 1. Thesis — why a new framework

Conventional UI frameworks assume a **document**: pages, routes, menus, forms. Component libraries (Radix, MUI, Chakra) make that document beautiful and accessible. Graph libraries (React Flow, Cytoscape, sigma) draw networks but are editors or visualizers, not interface paradigms. **Nothing owns the space where the interface _is_ the graph and the graph is _alive_.**

Agentic software needs exactly that space. An orchestrator routing to agents, a fleet of tools firing in real time, a digital twin of a person or company — these are not lists of pages. They are topologies with state, flow, and gesture. Forcing them into tabs and tables loses the one thing that matters: *seeing the system think.*

Plexus is the missing layer. It provides:
- A **paradigm** — the graph as the primary surface, work done in place, reading as the only navigation.
- A **component system** — headless primitives + an opinionated skin, à la Radix but graph-native.
- An **agentic binding layer** — nodes and edges bind to live telemetry; signals fire; gestures become commands.
- A **design language** — the dark, luminous, glanceable aesthetic these interfaces demand, as tokens.

If React Flow is "a library for node editors," Plexus is **"a framework for living interfaces."**

---

## 2. The eight laws

Every API decision derives from these. They are the framework's constitution.

1. **The graph is the verb layer.** Actions happen *in place*, on nodes. A node is an operating surface, not a link.
2. **Navigation is reserved for reading.** The only thing that escalates beyond the graph is long-form *content*. Everything else resolves where you are.
3. **The body is never lost.** Reading and detail surfaces overlay a still-living graph; the user never loses spatial context.
4. **Algorithms author the visuals.** Size, emphasis, and position are *computed* from graph properties (centrality, flow, recency), not hand-tuned — wherever a metric exists.
5. **Every node shares one anatomy.** Tag, glyph, title, status, summary, bloom. Consistency is what makes N nodes feel like one organism.
6. **Lenses change behavior, not just color.** A theme that only repaints is wasted; lenses re-skin *and* re-motion *and* re-layout.
7. **Headless core, opinionated skin.** Logic, state, and accessibility live apart from appearance. You can rebuild the look without touching the brain.
8. **One frame budget.** 60 fps is a contract. Rendering runs off React's critical path; the hot loop never calls `setState`.

---

## 3. Core concepts & vocabulary

Plexus names its primitives deliberately. The vocabulary *is* the API.

| Concept | Role | Maps to |
|---|---|---|
| **Field** | The infinite plane: camera, pan/zoom, semantic LOD, hit-testing | the canvas |
| **Core** | The central trunk — identity, presence, and the command surface ("the mouth") | the spine / octopus body |
| **Node** | A branching capability surface; an "arm" or "cell" | a service, agent, venture, section |
| **Glyph / Tag / Title / Status / Summary** | The fixed node anatomy | label parts |
| **Bloom** | A node's focus-expanded state: opens an in-place work surface | meso/micro view |
| **Sucker** | A micro-action inside a bloom (the grasping points on an arm) | a button/tool |
| **Deck** | The inline work surface a sucker reveals (compose, run, configure) | the control panel |
| **Edge / Synapse** | A connection; can be static or carry live **Signals** | a relationship/stream |
| **Signal** | A travelling pulse along an edge (a neural firing) | a live event/hop |
| **Reading** | An overlay pane for long-form content (the sole "navigation") | a content view |
| **Command** | The Core's intent surface; routes natural language or gesture to nodes | the prompt |
| **Lens** | A theme that re-skins, re-motions, and re-lays-out | a skin/mode |
| **Camera** | Pan/zoom + altitude (Macro/Meso/Micro) | viewport |
| **Constellation** | A cluster of related nodes (auto via community detection or authored) | a group |

---

## 4. Package architecture

Plexus is a monorepo of small, single-purpose packages. The dependency flow is strictly one-way. **The render adapter and the skin are swappable without touching logic.**

| Package | Responsibility | Depends on |
|---|---|---|
| `@plexus/core` | headless engine: graph store, layout, camera, interaction FSM, a11y model. **Zero DOM, zero styles.** | — |
| `@plexus/react` | React bindings — components & hooks over the headless core | `@plexus/core`, `react` (peer) |
| `@plexus/render-svg` | default render adapter (crisp, SSR-able, ≤ ~300 nodes) | `@plexus/core` |
| `@plexus/render-gl` | WebGL adapter (instanced, 3D "neural ball", 300–5k+ nodes) | `@plexus/core`, `three` (peer) |
| `@plexus/primitives` | low-level visual atoms: `<Glow>`, `<Glass>`, `<SuckerRing>`, `<Halo>`, easings | — |
| `@plexus/skin-nautiloid` | the default design language (dark-gold cosmic) as tokens + styles | tokens only |
| `@plexus/skin-biopulse`, `@plexus/skin-celestial` | alternate lenses | tokens only |
| `@plexus/agentic` | telemetry binding, signal firing, drag-to-mutate, intent routing, observability adapters (OTel/NEXUS) | `@plexus/core` |
| `@plexus/cli` | scaffolds: `portfolio`, `console`, `observatory` templates | — |

```
                       @plexus/skin-*    @plexus/cli
                            │ (tokens)
   app ── @plexus/react ── @plexus/core ── @plexus/render-svg | render-gl
            │                  │
            └── @plexus/agentic ┘     @plexus/primitives (leaf atoms)
```

**Headless-first** means `@plexus/core` exposes the full machine (state, focus, camera, keyboard, ARIA) with no opinion on pixels. `@plexus/react` wires it to components that emit `data-plx-*` attributes and accept render props; a skin styles those attributes. You can ship a wildly different look by writing CSS against the data attributes — no fork required.

---

## 5. Component API — declarative

The authored path: you write the graph as JSX. Ideal for portfolios, consoles, and any graph small enough to hand-place. Compound components share context.

```tsx
import { Plexus, Field, Core, Node, Edge, Reading, Suckers, Sucker, Deck } from '@plexus/react';
import '@plexus/skin-nautiloid/tokens.css';

export default function Portfolio() {
  return (
    <Plexus lens="nautiloid">
      <Field pan zoom lod>
        <Core id="self" title="H. GHEBRECHRISTOS" subtitle="Systems Architect & Venture Builder">
          <Core.Presence source="https://twin.hg.dev/presence" />   {/* IDLE / ACTIVE */}
          <Core.Command placeholder="state your intent…" router={intentRouter} />
        </Core>

        <Node id="avia" kind="venture" tag="HIPAA LOGISTICS" title="AVIA MEDROUTE"
              glyph="compass" summary="Dynamic NEMT patient transport routing dispatch.">
          <Node.Status bind="https://avia.dev/live" />               {/* "ROUTES TODAY · 412" */}
          <Node.Bloom>
            <Suckers>
              <Sucker icon="activity" action="stat:avia.routes">Live dispatch</Sucker>
              <Sucker icon="play"     action="demo:avia">Request demo</Sucker>
              <Sucker icon="file"     reads="case:avia">Case study</Sucker>
              <Sucker icon="mail"     intent="contact:avia">Contact</Sucker>
            </Suckers>
            <Deck slot="stat:avia.routes"><LiveDispatch /></Deck>     {/* inline work */}
          </Node.Bloom>
        </Node>

        <Node id="blog" kind="read" tag="KNOWLEDGE API" title="TECHNICAL BLOG" glyph="book"
              summary="Deep dives on AI systems, sandboxes & agents.">
          <Node.Bloom>
            <Suckers>
              <Sucker icon="list" reads="blog:index">Latest posts</Sucker>
              <Sucker icon="search" action="search:blog">Search</Sucker>
              <Sucker icon="bell" action="subscribe">Subscribe</Sucker>
            </Suckers>
          </Node.Bloom>
        </Node>

        {/* edges may be authored or auto-derived from Core↔Node containment */}
        <Edge from="self" to="avia" kind="synapse" />
        <Edge from="self" to="blog" kind="synapse" />
      </Field>

      <Reading />   {/* portal target for any `reads=` sucker; overlays the living graph */}
    </Plexus>
  );
}
```

### 5.1 Component reference

**`<Plexus>`** — root provider. Owns the store, lens, and portals.
| Prop | Type | Default | Notes |
|---|---|---|---|
| `lens` | `'nautiloid' \| 'biopulse' \| 'celestial' \| LensSpec` | `'nautiloid'` | theme + motion + layout bundle |
| `graph` | `GraphInput` | — | data-driven mode (see §6); omit when authoring with JSX |
| `render` | `'svg' \| 'gl'` | `'svg'` | render adapter; `gl` enables the 3D ball |
| `onIntent` | `(intent: Intent) => void` | — | global intent sink (drag/command) |
| `controlled` | `PlexusState` | — | fully controlled mode |
| `defaultFocus` | `string` | — | id of node bloomed on mount |

**`<Field>`** — the plane. Pan/zoom, semantic LOD, culling.
| Prop | Type | Default |
|---|---|---|
| `pan` / `zoom` | `boolean` | `true` |
| `lod` | `boolean \| LodConfig` | `true` |
| `bounds` | `Rect` | auto |
| `fit` | `'cover' \| 'contain' \| number` | `contain` |

**`<Core>`** — the trunk. Always rendered once. Subcomponents: `<Core.Presence>`, `<Core.Command>`, `<Core.Status>`.
| Prop | Type | Notes |
|---|---|---|
| `id` | `string` | |
| `title`, `subtitle`, `caption` | `string` | identity copy |
| `glyph` | `IconName \| ReactNode` | |
| `pulse` | `'breath' \| 'heartbeat' \| 'none'` | idle life; lens may override |

**`<Node>`** — an arm/cell. Compound: `<Node.Glyph> <Node.Tag> <Node.Title> <Node.Status> <Node.Summary> <Node.Bloom>`.
| Prop | Type | Notes |
|---|---|---|
| `id` | `string` | |
| `kind` | `NodeKind` | drives default glyph/accent & a11y role |
| `tag` | `string` | the bracketed system role |
| `title` | `string` | |
| `glyph` | `IconName \| ReactNode` | |
| `summary` | `string` | one-line description |
| `state` | `NodeState` | `idle \| live \| busy \| alert \| muted` |
| `draggable` | `boolean` | enables drag-as-intent (§8.4) |
| `weight` | `number` | manual size override; otherwise computed |
| `constellation` | `string` | grouping id |

**`<Node.Bloom>`** — the focus-expanded surface. Renders only when the node is focused. Contains `<Suckers>` and `<Deck>`s.

**`<Sucker>`** — a micro-action. Exactly one of `action` / `reads` / `intent` / `onSelect`.
| Prop | Type | Notes |
|---|---|---|
| `icon` | `IconName` | |
| `action` | `string` | reveals the matching `<Deck slot>` inline (work in place) |
| `reads` | `string` | opens the Reading pane (the sole navigation) |
| `intent` | `string` | dispatches an intent to the agentic layer |
| `onSelect` | `() => void` | escape hatch |

**`<Edge>`** — a synapse. Auto-derivable; author when you need explicit topology.
| Prop | Type | Default |
|---|---|---|
| `from`, `to` | `string` | required |
| `kind` | `'synapse' \| 'control' \| 'dependency'` | `synapse` |
| `directed` | `boolean` | `false` |
| `live` | `boolean` | `false` (carries signals) |

**`<Reading>`** — the portal target for `reads=`. A focus-trapped dialog that slides over a dimmed-but-alive graph. Pulls content by key from a `contentSource` or children.

---

## 6. Component API — data-driven

For large or live graphs (observability, fleets), pass data and render props instead of authoring nodes:

```tsx
<Plexus
  render="gl"
  graph={graph}                              // { nodes, edges } — see §11
  lens="celestial"
  renderNode={(n) => <Node {...nodeProps(n)} />}
  renderEdge={(e) => <Edge {...e} live={e.kind === 'data'} />}
/>
```

Data-driven mode delegates layout, culling, and LOD to the engine; you supply only the per-entity render. Switch to the GL adapter and you get the 3D neural ball with instanced rendering automatically (§10).

---

## 7. Hooks API

All hooks read from the nearest `<Plexus>` context. They are the headless surface for custom UIs.

```ts
usePlexus(): PlexusApi
// { focus(id), blur(), zoomTo(id), setLens(l), getNode(id), graph, camera, ... }

useNode(id: string): {
  node: NodeData; state: NodeState;
  focus(): void; setState(s: NodeState): void; activate(action: string): void;
  isFocused: boolean; neighbors: string[];
}

useFocus(): { focused: string | null; focus(id): void; blur(): void }

useCamera(): {
  camera: { x: number; y: number; scale: number; lod: 0|1|2 };
  pan(dx,dy): void; zoom(f, at?): void; zoomTo(id, opts?): void; fit(): void;
}

useReading(): { open(key: string): void; close(): void; current: string | null }

useCommand(): { submit(text: string): Promise<Intent>; router: IntentRouter }

useLens(): { lens: LensName; setLens(l: LensName): void; tokens: TokenMap }

// — agentic (from @plexus/agentic) —
useSignal(): { fire(s: SignalInput): void; onSignal(cb): Unsub }
useTelemetry(binding: TelemetryBinding): void        // binds node/edge to a live source
useIntent(handler: (i: Intent) => IntentResult): void // register drag/command handlers
useGraphRules(): { canConnect(a,b): RuleResult; willCycle(a,b): boolean }
```

Hooks never trigger layout reflows directly; they enqueue work the engine batches per frame.

---

## 8. Interaction system

### 8.1 Pointer FSM
A single pointer state machine disambiguates and unifies mouse/touch/pen:

```
idle ─down─▶ pressing ─move>thresh─▶ { panning | dragging-node }
pressing ─up<thresh─▶ tap → focus(node) | command(core)
panning/dragging ─up─▶ settle → (drop-test for drag-as-intent)
```
- Tap on a node → focus (open bloom). Tap on Core → open Command.
- Drag on Field → pan. Drag on a `draggable` Node → drag-as-intent.
- Pinch / wheel → zoom about the pointer; crossing LOD thresholds triggers semantic transitions.

### 8.2 Bloom lifecycle
Each node runs this machine; the skin animates each transition:

```
dormant → glance(hover) → bloom(focused)
   bloom → acting(sucker engaged → Deck inline)
   bloom → reading(reads= → Reading pane; graph stays alive)
   any   → recoil(dismiss) → dormant
```
Only one node blooms at a time by default (`focusMode="single"`); `"multi"` is available for dashboards. Recoil is triggered by Escape, outside-tap, or focusing another node.

### 8.3 Intent → command
Gestures and Command text never call your API directly. They produce a typed **Intent**, validated by graph rules, then handed to your handler:

```
gesture/command → Intent → useGraphRules().validate → useIntent handler → your effect
```
This indirection makes illegal actions inexpressible (a deploy that would cycle the graph snaps back) and keeps every action testable as pure data.

### 8.4 Drag-as-intent (the conductor gesture)
A `draggable` node dropped onto another emits `{ type:'connect', from, to }`. The agentic layer validates (type compatibility, cycle check) and either commits (synapse links with a validation animation) or rejects (recoil + reason). Example: drag a `model` node onto an `endpoint` → "deploy."

### 8.5 Keyboard & focus
Full keyboard parity (see §14): arrow keys traverse edges, Enter blooms, Tab roves, Escape recoils.

---

## 9. The agentic layer (`@plexus/agentic`)

This is what makes Plexus a framework for *agentic* software rather than a generic graph UI.

### 9.1 Telemetry binding
Bind any node or edge to a live source; its visual state follows the data with no manual wiring:

```tsx
useTelemetry({
  nodeId: 'researcher',
  source: sse('/runs/live'),
  map: (e) => ({ state: e.status === 'error' ? 'alert' : 'live', metric: e.latencyMs }),
});
```
Sources are any `AsyncIterable`/observable: SSE, WebSocket, tRPC subscription, or a polling fetch. Node size/emphasis can be driven by server-computed metrics (centrality, throughput) per Law 4.

### 9.2 Signals (neural firing)
A signal is a pulse that travels an edge, heats it (decaying trail), and flashes the arrival node — the live "thinking" visual:

```ts
const { fire } = useSignal();
fire({ from: 'orchestrator', to: 'researcher', color: 'cyan', durationMs: 600 });
```
Wire a run/hop stream straight to `fire()` and the graph animates real execution. The engine pools signals, coalesces per frame, and caps rate per the perf budget — you just emit.

### 9.3 Command routing
The Core's Command surface accepts natural-language intent and routes it to a node via a pluggable router (keyword, embedding, or an LLM/MCP call):

```ts
const intentRouter: IntentRouter = async (text) => {
  // e.g. call your MCP server's `route_intent` tool
  return { nodeId: 'contact', action: 'compose', prefill: text };
};
```
Submitting fires a signal from Core to the target node and blooms it — the head literally routes attention. This is the "the body talks back" mechanic.

### 9.4 Observatory preset
`@plexus/agentic/observatory` is a batteries-included binding to OpenTelemetry / the NEXUS platform: it maps OTel GenAI spans → nodes/edges, run hops → signals, and incidents → `alert` state with blast-radius highlighting. A full agent-observability surface in a few lines.

---

## 10. Rendering model

### 10.1 Adapters
The engine emits an abstract scene; an adapter paints it. Two ship:

| Adapter | Range | Use |
|---|---|---|
| `render-svg` | ≤ ~300 nodes | crisp, SSR-able, easy glow/glass; the default and the portfolio/console path |
| `render-gl` | 300 – 5k+ | instanced WebGL; the 3D neural ball; one draw call for all nodes/edges/signals |

Both implement one interface, so switching is a prop. Decks, Reading panes, and Command are **always DOM/React overlays** anchored to projected coordinates — text and inputs never live in WebGL.

```ts
interface RenderAdapter {
  mount(el: HTMLElement): void;
  setCamera(c: Camera): void;
  upsertNodes(n: SceneNode[]): void;     // delta only
  upsertEdges(e: SceneEdge[]): void;
  fireSignal(s: Signal): void;
  setLod(l: 0|1|2): void;
  hitTest(x: number, y: number): string | null;
  dispose(): void;
}
```

### 10.2 Layout
Pluggable layout engines run **off the main thread** (Web Worker), writing positions into transferable typed arrays:
- `force` (Barnes–Hut, `O(n log n)`) — organic constellations (default).
- `radial` — Core-centric arms (the portfolio look).
- `layered` (ELK/Sugiyama) — pipelines/DAGs inside an expanded cluster.
- `authored` — fixed positions from JSX.

Stability is enforced (Law mental-map): visible nodes pin, displacement clamps, a short relaxation then freeze on mutation.

### 10.3 Camera & semantic LOD
Three altitudes from one coarsened hierarchy (community detection builds super-nodes):
- **Macro** (`lod 0`) — constellations as super-nodes; no labels/animation.
- **Meso** (`lod 1`) — full nodes, edges, labels, idle motion.
- **Micro** (`lod 2`) — a node blooms; neighbors fade; Decks/Reading active.

`zoomTo(id)` flies the camera and escalates altitude in one gesture.

### 10.4 Performance (the hot loop)
Position and signal updates write typed arrays and request a frame; **React renders only on structural or focus change.** Viewport culling (quadtree/frustum) precedes per-node work. Heavy graph metrics are expected pre-computed (server-side, per the agentic layer). Budget: ≤ 16 ms/frame at 1k nodes — enforced in CI (§16).

---

## 11. State & graph model

### 11.1 The store
`@plexus/core` holds a normalized graph + thin UI state (focus, camera, lens) in an external store with selector subscriptions (structural sharing). Positions live in the layout worker's typed arrays, **not** in React state — this is the separation that makes 60 fps possible.

### 11.2 Controlled / uncontrolled
- **Uncontrolled** (default): Plexus owns focus/camera/lens; you read via hooks.
- **Controlled**: pass `controlled={state}` + `onChange` for full external control (useful for URL-synced focus/camera).

### 11.3 Graph input (data-driven)
```ts
interface NodeData {
  id: string; kind: NodeKind;
  tag?: string; title: string; glyph?: string; summary?: string;
  state?: NodeState; weight?: number; constellation?: string;
  data?: Record<string, unknown>;           // your domain payload
}
interface EdgeData { id: string; from: string; to: string; kind?: EdgeKind; directed?: boolean; live?: boolean; }
interface GraphInput { core: NodeData; nodes: NodeData[]; edges?: EdgeData[]; }
```
Edges are optional; if omitted, the engine derives Core↔Node spokes (radial) or infers from `constellation`.

---

## 12. Design language & tokens

Plexus skins are **token sets**, namespaced `--plx-*`, consumed by the data-attribute styling layer. The default — **Nautiloid** — is the dark, luminous, gold-on-near-black cosmic language.

### 12.1 The node anatomy (the standard that makes it one organism)
Top→bottom, every node renders the same skeleton; the skin styles it:
```
[ TAG ]            ← bracketed system role, mono, tracked, dim accent
  ◦ glyph          ← single line icon in a dark disc
TITLE              ← tracked uppercase, off-white
status • • •       ← one live status line (optional), accent
summary…           ← one muted description line
( bloom )          ← appears on focus: SuckerRing + Decks
```

### 12.2 Token reference (Nautiloid)
```css
:root[data-plx-lens="nautiloid"] {
  /* surface */
  --plx-bg:        #070504;
  --plx-bg-grad:   radial-gradient(120% 90% at 50% 38%, #11100a, #060504 70%);
  --plx-panel:     rgba(20,15,9,0.72);
  --plx-glass-blur: 14px;

  /* accent — gold */
  --plx-accent:        #d4af6a;
  --plx-accent-bright: #f2dcae;
  --plx-accent-dim:    #6b5a38;
  --plx-ring:          rgba(184,149,78,0.45);

  /* state */
  --plx-live:  #d4af6a;
  --plx-busy:  #e6c074;
  --plx-alert: #d98a4a;
  --plx-muted: #4a3f2b;

  /* text */
  --plx-text:    #ece3d2;
  --plx-text-2:  #9c8a63;
  --plx-text-3:  #6b5d40;

  /* node geometry */
  --plx-node-r:        78px;
  --plx-core-r:        126px;
  --plx-node-fill:     radial-gradient(60% 60% at 40% 35%, #15110b, #080604);
  --plx-glow:          0 0 28px rgba(212,175,106,0.25);

  /* motion */
  --plx-breath:   4.2s;
  --plx-bloom-in: 280ms cubic-bezier(.2,.9,.25,1);
  --plx-recoil:   220ms cubic-bezier(.4,0,.2,1);
  --plx-signal:   620ms linear;

  /* type */
  --plx-font-display: "Sora", system-ui, sans-serif;
  --plx-font-mono:    "Space Mono", ui-monospace, monospace;
  --plx-tracking-tag: 0.22em;
  --plx-tracking-title: 0.06em;
}
```

### 12.3 Motion system
A small, named easing vocabulary, all reduced-motion aware (§14): `breath` (idle), `bloomIn`/`recoil` (focus), `signal` (edge flow), `pull` (camera fly), `settle` (layout relax). Skins may retime but not rename them, so motion stays coherent across lenses.

---

## 13. Lenses (theming contract)

A **Lens** is more than a palette. It is a bundle:
```ts
interface LensSpec {
  name: string;
  tokens: Partial<TokenMap>;       // colors, geometry, type
  motion: Partial<MotionMap>;      // retimed easings, idle behavior
  layout?: LayoutName;             // may change arrangement
  field?: { drift?: boolean; starfield?: 'sparse'|'dense'; rings?: boolean };
}
```
The three reference lenses are behaviorally distinct:
- **Nautiloid** — chambered/cephalopod. Still, elegant. Optional spiral arrangement maps career/era chambers outward. (Default.)
- **Celestial** — orbital. Slow gravitational drift of nodes about the Core; denser starfield; decorative constellation rings. The 3D-ball-friendly lens.
- **Bio-Pulse** — organism. Heartbeat cadence on Core and edges; warmer accent; emphasis on signal firing.

Switching lenses is a single call (`useLens().setLens`) and animates tokens via CSS transitions — no remount.

---

## 14. Accessibility

Graph UIs are notoriously inaccessible. Plexus treats a11y as a first-class subsystem in `@plexus/core`, not an afterthought.

- **Roving focus + edge traversal.** Nodes form a roving-tabindex set. Arrow keys move to graph **neighbors** (spatial+topological); `Enter` blooms; `Escape` recoils; `Tab` exits the field. Each node is a `button`/`region` with an `aria-label` composed from tag + title + status.
- **The Outline fallback.** `@plexus/core` derives a linear, nested **Outline** (a tree) from the same model — `<Plexus.Outline />` renders a fully navigable list view. This is the non-spatial path for screen readers *and* the natural home for Law 2's "reading," so it doubles as a sitemap.
- **Reading panes** are focus-trapped dialogs (`role="dialog"`, `aria-modal`), restoring focus to the originating sucker on close.
- **Live signals are silent by default** (no `aria-live` spam). Meaningful state changes (a node entering `alert`) post to a single polite `aria-live` summary region with throttling.
- **Reduced motion.** `prefers-reduced-motion` freezes signal flow and idle breath, replaces blooms with instant cross-fades, and disables Celestial drift — without changing layout or losing information.
- **Contrast & targets.** Skins ship WCAG-AA text pairs and ≥ 44px effective hit targets (the disc, not just the glyph).

---

## 15. SSR / RSC / SEO

Critical for the portfolio/twin use case — these interfaces must be indexable.
- **Server render** the SVG adapter: the full graph (nodes, labels, summaries, edges) ships as static, crawlable markup on first paint; interactivity hydrates progressively.
- **RSC-friendly:** `<Core>`/`<Node>` accept server-rendered children; Reading content can be React Server Components and stream in.
- **Semantic HTML mirror:** the Outline (§14) is emitted in the SSR payload (visually hidden by default), giving crawlers and assistive tech the content graph without JS.
- Works under Next.js App Router and Vite SSR; the GL adapter is client-only and lazy-loaded.

---

## 16. Performance budgets

| Surface | Budget | Gate |
|---|---|---|
| Frame time @ 1k nodes (GL) | ≤ 16 ms p95 | render bench in CI |
| Bloom open → painted | ≤ 120 ms | interaction test |
| Layout settle after mutation | ≤ 600 ms, ≤ 3% nodes move > 40px | layout test |
| Core bundle (`@plexus/core` + `react` binding, gz) | ≤ 38 kB | size-limit gate |
| SVG adapter (gz) | ≤ 18 kB | size-limit gate |
| GL adapter (gz, excl. three peer) | ≤ 24 kB | size-limit gate |
| First contentful graph (SSR) | ≤ 1.2 s | lighthouse CI |

Enforcement: `size-limit`, a synthetic 1k/5k render bench, and a recorded signal stream replay all run on every PR.

---

## 17. Distribution & compatibility

- **ESM-first**, tree-shakeable, `sideEffects:false` (except skin CSS).
- **Peer deps:** `react >=18` (RSC-aware), `three >=0.16x` only for `render-gl`.
- **Frameworks:** Next.js (App + Pages), Vite, Remix, Astro (islands). GL adapter is `dynamic`/lazy.
- **Styling:** skin CSS is plain CSS variables + a small base sheet — no Tailwind/CSS-in-JS lock-in. A Tailwind preset (`@plexus/skin-nautiloid/tailwind`) is optional.
- **Types:** strict, exported; `NodeKind`/`Intent`/`TokenMap` are public contracts.
- **Versioning:** semver; the headless `@plexus/core` API is the stability anchor (see §20).

---

## 18. Recipes

### 18.1 The Digital Twin (octopus portfolio)
Authored declarative graph, radial layout, Nautiloid lens, SVG+SSR for SEO. Core = the person (presence + command); arms = ventures/sections; ventures bloom into live Decks; About/Blog are the only `reads=`. (The HG portfolio.)

### 18.2 The Orchestrator Console
Data-driven, `force` layout, drag-as-intent for deploy, `useGraphRules` for cycle-safe mutations, Bio-Pulse lens. Nodes are agents/tools/models; signals fire on run hops.

### 18.3 The Observatory
`@plexus/agentic/observatory` bound to OTel/NEXUS, GL adapter for scale, Celestial lens, server-computed centrality driving node size, incident → `alert` + blast radius. The agent-observability surface.

```tsx
// 18.3 in ~15 lines
import { Plexus } from '@plexus/react';
import { observatory } from '@plexus/agentic/observatory';

export default function Observatory() {
  const binding = observatory({ otlp: '/v1/traces', live: '/runs/hops' });
  return <Plexus render="gl" lens="celestial" {...binding} />;
}
```

---

## 19. Testing

- **Headless machine tests** (`@plexus/core`): drive the FSM and store with synthetic events; assert focus, camera, a11y tree, and intent validation — zero DOM.
- **Component tests** (`@plexus/react`): Testing Library; assert anatomy, bloom lifecycle, keyboard map, ARIA.
- **Visual regression**: per-lens, per-LOD snapshots of the SVG adapter; GL covered by a deterministic scene-graph snapshot.
- **Interaction/e2e**: Playwright for pan/zoom/bloom/drag-as-intent and reading-pane focus trapping.
- **Perf**: the §16 benches as CI gates.

---

## 20. Versioning & stability

Three stability tiers, marked in docs and types:
- **Stable** — `@plexus/core` store/FSM, `<Plexus>/<Field>/<Core>/<Node>/<Edge>`, the hooks in §7. Semver-protected.
- **Evolving** — `@plexus/agentic`, observatory, GL adapter specifics. Minor-version churn allowed with codemods.
- **Experimental** — new lenses, layout engines, CLI templates (`@plexus/*@next`).

`0.x` until the core FSM and token contract are frozen; `1.0` is the stability commitment, not a feature milestone.

---

## 21. Positioning vs alternatives

| Tool | What it is | Why Plexus differs |
|---|---|---|
| **React Flow / @xyflow** | node-editor library (DOM nodes) | editor-centric, no design language, no live-signal/agentic layer, no semantic-zoom/3D, DOM-heavy at scale |
| **Cytoscape / sigma / G6** | graph viz engines | visualization, not an interaction/design framework; you build the UX yourself |
| **Radix / Ark / Headless UI** | headless UI primitives | page/widget-oriented; no graph, camera, or signal model |
| **D3** | low-level viz toolkit | a toolbox, not a framework; no components, a11y, or agentic binding |
| **Plexus** | living-interface framework | the intersection: headless graph-native interaction **+** design language **+** agentic binding, with SSR and a11y built in |

Plexus is not a better node editor. It is a different category: a framework for interfaces that *are* living graphs.

---

## 22. Roadmap

- **v0.1 — Headless core + SVG + Nautiloid + declarative API.** The portfolio recipe ships. (Authored graphs, bloom, reading, command, SSR.)
- **v0.2 — Hooks, data-driven mode, force/radial layout in a worker, full a11y + Outline.**
- **v0.3 — `@plexus/agentic`: telemetry, signals, drag-as-intent, graph rules.** The console recipe ships.
- **v0.4 — `render-gl` (3D ball), semantic LOD/coarsening, Celestial/Bio-Pulse lenses.**
- **v0.5 — Observatory preset (OTel/NEXUS), perf-bench CI gates, size budgets.**
- **v1.0 — Frozen core FSM + token contract; stability commitment; codemods + CLI templates.**

---

## 23. Open questions

1. **Authoring vs data parity.** Should authored JSX compile to the same `GraphInput` the data path uses (one engine), or remain a thin parallel? (Leaning: compile to one.)
2. **Styling contract.** Data-attributes + CSS variables (max portability) vs an optional CSS-in-TS for dynamic per-node theming?
3. **Layout ownership.** Ship our worker layout, or adapt an existing engine (cola/ELK/ngraph) behind the interface? (Leaning: interface + bundled default + adapters.)
4. **Command router default.** Keyword baseline in-package, with embedding/LLM/MCP routers as opt-in adapters?
5. **3D as adapter vs separate package.** Is the neural ball a `render-gl` mode or its own `@plexus/ball`? Affects bundle and API surface.

---

## Appendix A — token reference (abridged)
`--plx-bg`, `--plx-bg-grad`, `--plx-panel`, `--plx-glass-blur`, `--plx-accent[-bright|-dim]`, `--plx-ring`, `--plx-live|busy|alert|muted`, `--plx-text[-2|-3]`, `--plx-node-r`, `--plx-core-r`, `--plx-node-fill`, `--plx-glow`, `--plx-breath`, `--plx-bloom-in`, `--plx-recoil`, `--plx-signal`, `--plx-font-display|mono`, `--plx-tracking-tag|title`.

## Appendix B — data-attributes & keyboard
**Data-attributes** (styling hooks): `data-plx-lens`, `data-plx-node`, `data-plx-kind`, `data-plx-state`, `data-plx-focused`, `data-plx-lod`, `data-plx-edge`, `data-plx-signal`, `data-plx-reading`.
**Keyboard:** `Arrow*` → neighbor · `Enter` → bloom · `Esc` → recoil/close · `Tab/Shift+Tab` → rove/exit · `/` → focus Command · `+/-` → zoom · `0` → fit · `o` → toggle Outline.

---

*End of specification.*
