# ADR-0010: The twin agent runs under HKI conformance

- **Status:** Accepted
- **Date:** 2026-08-05
- **Deciders:** Founder

## Context

The platform's differentiating feature is a **digital twin**: an agent that can answer as
the member, from the member's own graph. That agent will hold the most sensitive material
on the platform — private nodes, imported archives, reading notes, unpublished drafts —
and it will read attacker-controlled text as a matter of routine, because imported content
from Substack, GitHub, RSS, and uploaded archives is exactly that.

The prototype's `POST /api/twin/ask` sent a bare question to Gemini with no grounding, no
citations, no tenant boundary, and no tool discipline. That shape cannot be hardened; it
has to be replaced.

The founder already owns a security standard for exactly this problem: **Hermetic
Knowledge Isolation (HKI)** — signed-domain runtimes, a rigid Model Context Protocol data
boundary, and short-lived isolated execution environments. It is used in production to
isolate multi-agent systems. The twin should be its reference implementation, not an
exception to it.

## Decision

The twin plane is built to HKI conformance from the first commit. Seven controls are
binding, and each is testable.

- **HKI-1 Signed-domain runtime.** Every tool ships a manifest — name, JSON Schema for
  arguments, declared egress hosts. The registry holds an HMAC over the canonical manifest
  and refuses to dispatch a tool whose signature is absent or does not verify. There is no
  dynamic tool registration path.
- **HKI-2 MCP boundary.** The model may emit only JSON matching a closed union:
  `{tool, args}` or `{answer, cites[]}`. No shell, no code evaluation, no free-form URL, no
  SQL. Output that does not match is a refusal, not a repair-and-retry loop.
- **HKI-3 Ephemeral execution.** Document and file work runs in a short-lived sandbox with
  no ambient credentials and no filesystem visibility outside the run directory. The
  sandbox is destroyed with the run.
- **HKI-4 Context integrity.** Tenant content is never concatenated into the system prompt.
  It is delivered inside an explicit untrusted-data envelope. Instructions appearing inside
  that envelope are ignored by contract, and the contract is covered by injection tests.
- **HKI-5 Egress control.** The HTTP client used by tools enforces the union of hosts
  declared across signed manifests. Connectors are the only path to the network.
- **HKI-6 Zero retention.** Prompts, retrieved context, and answers are never written to
  the database, application logs, traces, or Sentry. This extends ADR-0007's zero-retention
  guest posture to every twin invocation, member or visitor.
- **HKI-7 Tenant-bound retrieval.** The retriever accepts a `TenantContext`, not an
  `owner_id` string, and executes inside the tenant-bound transaction of ADR-0011.
  Cross-tenant retrieval is not a policy check; it is structurally unreachable.

**Grounding is enforced, not requested.** The answer's `cites[]` must be a subset of the
node ids returned by retrieval for that turn. An answer citing anything else is discarded
and the member is told there is no grounded answer. Visibility (`public` / `circle` /
`private`) is resolved server-side and passed into retrieval as an argument.

## Consequences

- (+) Prompt injection through imported content cannot escalate to tool execution, data
  exfiltration, or cross-tenant reads.
- (+) Every twin sentence is traceable to nodes the member can open, inspect, and correct —
  which is the binding graph-OS invariant, enforced at runtime.
- (+) The twin becomes a credible public demonstration of HKI.
- (+) Zero retention means guest questions are safe to ship early.
- (−) The twin will refuse more often than an ungrounded model would. This is the intended
  trade; fluency without provenance is the failure mode being designed against.
- (−) No dynamic tools, no plugin marketplace, no user-authored tools without a signing
  ceremony.
- (−) Debugging is harder because prompts and context are not retained. Failures are
  diagnosed from tool-dispatch metadata and node ids, never from content.
- **Revisit if:** a capability genuinely requires retention or an unsigned tool. It needs
  founder approval and a narrower ADR naming the scope, the retention window, and the
  consent surface.

## Alternatives considered

| Option                                      | Pros                                                   | Cons                                                                          | Verdict      |
| ------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------- | ------------ |
| Port the ungrounded Gemini passthrough      | Ships today                                            | No grounding, no citations, no tenant boundary; unfixable shape               | Rejected     |
| Standard RAG with a system-prompt guardrail | Familiar; fast to build                                | Guardrails in the prompt are defeated by injected content in the same channel | Rejected     |
| Full HKI conformance from the first commit  | Injection-resistant; provable grounding; showcases HKI | Slower; more refusals; no dynamic tools                                       | **Accepted** |
| Defer the twin until the graph is complete  | Avoids the problem                                     | The twin is the reason the graph is worth building                            | Rejected     |
