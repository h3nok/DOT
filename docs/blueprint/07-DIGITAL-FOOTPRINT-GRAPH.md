# Digital Footprint Graph & Social Integrations

> The graph-aware layer for Stay/DOT: a member-owned map of identities, sources,
> publications, topics, relationships, and platform accounts. It powers footprint
> understanding, graph navigation, source-backed publishing, and the future social
> platform without becoming an engagement feed.

## 1. Product intent

Members should be able to answer:

- What have I published, where, and under which identities?
- Which topics, projects, people, organizations, and sources define my public footprint?
- Which platform accounts are connected, exported, stale, revoked, or only manually linked?
- Which pieces of my work support a claim, chapter, profile section, or recommendation?
- Which trusted people or circles relate to this work without exposing private context?

This graph is not a surveillance graph. It is an owned navigation and memory graph. The
member can inspect, correct, export, and delete it.

> **Binding invariant (root design decision).** DOT is a member-owned graph OS for
> understanding and publishing a digital footprint — not a feed. Every connector, AI
> action, UI view, and publication workflow must resolve to explicit nodes, edges,
> provenance, consent, and portability. A feature that cannot answer "which nodes,
> which edges, whose consent, what provenance, how does it export" is not ready to
> build.

## 2. Integration posture

Use official, user-controlled paths first. Do not make unofficial private APIs or scraping
the backbone of the system.

### Tier 1 - Portable feeds and exports

- **Substack public publication feed:** Substack exposes publication RSS at
  `https://your.substack.com/feed`.
- **Substack export:** Substack says creators can export publication data, including posts,
  subscriber lists, and optional stats. Imported/exported artifacts should enter DOT as
  member-provided archives.
- **RSS-compatible platforms:** WordPress, Ghost, Medium, Beehiiv, Mailchimp archive URLs,
  Tumblr, Blogspot, Squarespace, ConvertKit, and any platform with a usable RSS feed can
  become read-only source imports.
- **Manual archive import:** Where APIs are restricted or unavailable, the member uploads
  exports such as CSV, JSON, HTML, ZIP, or markdown.

### Tier 2 - Official graph/social APIs

- **Bluesky / AT Protocol:** highest-fit social graph target because atproto is built around
  user identity, signed repositories, follows, records, account portability, and client
  choice.
- **Mastodon / ActivityPub:** high-fit federated target for posts, profiles, follows,
  boosts, replies, and ActivityStreams objects.
- **GitHub:** high-fit professional/project graph target for repos, commits, issues, PRs,
  releases, stars, and organizations.
- **Threads / Meta APIs:** usable only within the official permissions and product surface
  available to the app.

### Tier 3 - Restricted platforms

- **LinkedIn:** profile API access is restricted to approved developers. Storage is limited
  to authenticated-member data with permission; the system must not store other members'
  LinkedIn data as if it owned it.
- **X, Instagram, YouTube, TikTok, Reddit, Discord, Slack, Notion, Google Drive:** treat
  each as a connector with explicit scopes, review, rate limits, revocation, and platform
  terms checks before implementation.

## 3. Substack integration

Substack should be integrated in three modes:

1. **Read public publication:** member enters a Substack URL; orchestrator resolves
   `/feed`, imports post metadata and public excerpts, and creates footprint nodes.
2. **Import owned export:** member uploads a Substack export; orchestrator creates source
   objects, publication nodes, topic nodes, subscriber-list metadata records if explicitly
   allowed, and private graph edges.
3. **Publish/distribute out:** DOT release exports should produce Substack-compatible
   markdown/HTML and RSS-ready output. Automated publishing should remain manual or
   explicit until there is a stable official write API path.

Do not depend on unofficial Substack APIs for core product behavior. If experiments use
them, they must be isolated behind a non-default connector adapter, disabled in production
unless reviewed, and documented as brittle.

## 4. Graph model

First-class graph tables now exist in the FastAPI orchestrator:

```text
footprint_accounts
  id, owner_id, platform, handle, display_name, profile_url, external_id,
  auth_mode, status, sync_cursor, last_synced_at, revoked_at

footprint_nodes
  id, owner_id, kind, label, platform, external_id, source_ref, properties,
  visibility, confidence, first_seen_at, last_seen_at

footprint_edges
  id, owner_id, source_node_id, target_node_id, relation, platform, weight,
  confidence, evidence_ref, first_seen_at, last_seen_at

footprint_imports
  id, owner_id, account_id, run_id, connector, import_mode, status,
  requested_by, source_ref, summary, created_at, completed_at
```

Node kinds:

- `identity`
- `platform_account`
- `publication`
- `post`
- `source`
- `topic`
- `project`
- `person`
- `organization`
- `place`
- `circle`

Core relations:

- `same_as`
- `published_to`
- `authored`
- `mentions`
- `cites`
- `derived_from`
- `belongs_to`
- `follows`
- `subscribed_to`
- `collaborated_with`
- `trusted_by`
- `member_of`
- `viewable_by`

## 4A. Visibility, consent, and projection rules

The binding invariant ties every graph record to explicit consent and visibility. These
rules are normative for connectors, AI actions, UI views, and publication workflows alike.

**Visibility states** (on nodes and edges):

- `private` — default for everything created by an import or an inference.
- `circle` — visible to explicitly named circles through `viewable_by` edges.
- `public` — visible in public projections (profile, publications, public graph views).

**Projection rule:** an edge's effective visibility is the _minimum_ of its own
visibility and the visibility of both endpoint nodes. A public projection may contain
only nodes and edges whose effective visibility is public. Inferred records
(`confidence < 1.0`, unconfirmed `same_as`) never appear in public projections,
regardless of declared visibility.

**Consent lifecycle:** imports and inference only ever create `private` records. Raising
visibility is always an explicit member action, recorded as an audit event. Revocation
(connector revocation, visibility downgrade) takes effect in the next projection and is
likewise audited. The consent states surfaced in the UI — imported, verified, stale,
revoked, manually linked, unsupported — are derived from account status, evidence
freshness, and member confirmation, not stored as free-form flags.

**Identity links:** `same_as` edges merge public identity and are therefore the most
consent-sensitive relation in the graph. Acceptable verification proofs, in order of
preference:

1. Platform-verified identity: atproto DID document, ActivityPub actor keys.
2. Bidirectional `rel="me"` links between the two profiles.
3. DNS TXT record or `/.well-known/` proof on a domain the member controls.
4. A member-authored proof post on the target platform.

Without one of these, a `same_as` edge requires explicit member confirmation and stays
`private` until confirmed.

## 5. Orchestrator responsibilities

The FastAPI orchestrator is now graph-aware:

- Store platform accounts and import modes.
- Queue connector imports as durable `orchestrator_runs`.
- Normalize imported items into graph nodes and edges.
- Preserve provenance through `source_ref` and `evidence_ref`.
- Keep owner scope on every graph record.
- Support graph snapshots for UI navigation.
- Support deletion/export and connector revocation.

Current API surface:

```text
POST /v1/graph/accounts
GET  /v1/graph/accounts
POST /v1/graph/nodes
POST /v1/graph/edges
POST /v1/graph/imports
GET  /v1/graph/imports
GET  /v1/graph/imports/{import_id}
POST /v1/graph/imports/{import_id}/process
GET  /v1/graph/snapshot
```

The first processor supports Substack/RSS-compatible feeds. It normalizes feed data into:

- `platform_account` nodes for the connected account;
- `publication` nodes for the RSS publication;
- `post` nodes for feed items;
- `topic` nodes for feed categories;
- `authored`, `published_to`, and `mentions` edges with import evidence.

Operational contract:

- Account creation is an upsert by owner, platform, and handle.
- Import creation is idempotent through `orchestrator_runs`.
- Recent imports are listable for UI status, summaries, and run linkage.
- RSS/Substack fetches reject credentials, local/private networks, unsupported content
  types, oversized bodies, and long redirect chains.
- `GET /v1/graph/snapshot` returning the full graph is an MVP affordance. Before member
  graphs exceed a few thousand nodes, the snapshot contract must add filters (kind,
  platform, visibility, time) and cursor pagination or delta-since-version reads; the UI
  must not assume the whole graph fits in one response.

Deletion and revocation propagate through provenance:

- Deleting a source tombstones every node and edge whose only evidence is that source.
- Records with remaining evidence drop the deleted `evidence_ref`/`source_ref` and
  recompute confidence.
- A dangling `evidence_ref` is an invariant violation, not an acceptable state.
- Revoking a connector freezes its syncs and marks the account revoked; the member
  chooses between keeping derived records as a manual archive or deleting them.

## 6. UI layer

The UI should be graph-first for footprint and social navigation:

- **Footprint graph cockpit:** main visual map of identities, sources, posts, topics,
  projects, and platform accounts.
- **Graph-based navigation:** clicking a node moves to its connected sources, posts,
  people, projects, claims, or publication sections.
- **Right inspector:** selected node facts, provenance, platform, confidence, visibility,
  connected edges, and available actions.
- **Import history:** recent connector jobs with status, summary counts, and run IDs.
- **Filters:** platform, kind, relation, visibility, time, source confidence, and public vs
  private.
- **Consent states:** imported, verified, stale, revoked, manually linked, unsupported.
- **List projection:** every graph view has an equivalent list/reader projection of the
  same query. The graph is the primary metaphor, not the only access path — keyboard,
  screen-reader, and small-screen members get the same data as a navigable list.

Graph UI is not a feed. Recommendations must be path-explained: "shown because this topic
connects through these sources/people/projects," never opaque ranking.

## 7. Social platform direction

Stay can become a social platform by making the graph the social substrate:

- Profiles are graph projections, not timelines.
- Circles are explicit graph scopes, not follower traps.
- Discovery is pull-based graph traversal, not infinite feed ranking.
- Trust is edge-level and inspectable.
- Public posts and publications are durable nodes with source/citation trails.
- Private context never leaks into public graph projections without member action.

The default social object is not a post. It is a relationship between a person, a source,
a project, a topic, a publication, and a permission boundary.

## 8. Acceptance gates

- A member can connect or manually add a platform account.
- A member can queue a Substack RSS/import job and inspect the run.
- A member can list recent imports with status and summaries.
- A member can process a Substack/RSS import into graph nodes and edges.
- A member can see graph nodes and edges returned from `/v1/graph/snapshot`.
- A member cannot see another member's graph.
- A cross-owner edge is rejected.
- Graph import jobs are idempotent.
- Duplicate platform account creation does not create duplicate graph accounts.
- Local/private RSS targets are rejected before connector fetch.
- Graph UI can render an empty, offline, and populated snapshot.
- Deletion/export plans include graph records and connector account state.
- A public graph projection contains no `private`/`circle` nodes, no edges touching
  them, and no inferred or unconfirmed records (§4A projection rule).
- An unverified `same_as` edge cannot be made public.
- Deleting a source leaves no node or edge with a dangling `evidence_ref`.

## 9. References

- Substack RSS support: https://support.substack.com/hc/en-us/articles/360038239391-Is-there-an-RSS-feed-for-my-publication
- Substack import/export and portability: https://substack.com/features
- Substack post import from platforms/RSS: https://support.substack.com/hc/en-us/articles/360037830351-How-do-I-import-my-posts-from-another-platform-such-as-Mailchimp-WordPress-Medium-or-Ghost
- Bluesky AT Protocol: https://docs.bsky.app/docs/advanced-guides/atproto
- Mastodon ActivityPub: https://docs.joinmastodon.org/spec/activitypub/
- LinkedIn Profile API restrictions: https://learn.microsoft.com/en-us/linkedin/shared/integrations/people/profile-api
