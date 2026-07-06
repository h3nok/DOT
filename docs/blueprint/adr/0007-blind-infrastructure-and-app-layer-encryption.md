# ADR-0007: Blind infrastructure and application-layer encryption

- **Status:** Accepted
- **Date:** 2026-06-12
- **Deciders:** Founder

## Context

The platform is meant to host identity, reading notes, private graph state, invitations,
and eventually agentic memory. Normal managed-cloud encryption at rest protects against
some disk and infrastructure failure modes, but the cloud provider and privileged platform
paths can still read plaintext if the application stores plaintext.

The product promise is stronger: even infrastructure providers should not know who is on
the platform or be able to read private member content.

## Decision

Private member data is encrypted before it is persisted. The platform uses
application-layer encryption for private content, tenant/member-scoped data encryption
keys, blind identity indexes for lookups, and zero-retention guest questions by default.

The guest twin/orchestrator may answer from public graph context without storing prompts.
Private context is only retrieved when a member explicitly unlocks it, and prompts,
retrieved context, and responses are excluded from analytics, logs, traces, and model
training pipelines.

## Consequences

- (+) Cloud databases, object stores, backups, and logs do not contain readable private
  member content by default.
- (+) Supports the trust posture of an invite-only, member-owned platform.
- (+) Makes guest questions safer to ship early because the default retention mode is
  none.
- (-) Server-side search, moderation, analytics, support debugging, and data recovery are
  harder because plaintext is intentionally unavailable.
- (-) Key rotation, export/delete, and backup restore flows must be designed carefully.
- **Revisit if:** a feature requires centralized plaintext processing. That feature must
  receive explicit founder approval and a narrower ADR documenting scope, retention, and
  user consent.

## Alternatives considered

| Option                                          | Pros                                             | Cons                                                     | Verdict      |
| ----------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------- | ------------ |
| Managed encryption at rest only                 | Simple; supported by every cloud database        | Provider/platform can still access plaintext             | Rejected     |
| Application-layer encryption with blind indexes | Strong privacy boundary; matches product promise | More complex search, support, and key management         | **Accepted** |
| Fully client-only storage                       | Maximum provider blindness                       | Hard collaboration, sync, recovery, and multi-device use | Deferred     |
