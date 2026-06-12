# ADR-0006: Member-owned Knowledge & Publication OS

- **Status:** Accepted
- **Date:** 2026-06-12
- **Deciders:** Founder, Principal Engineer

## Context

The product is evolving from a profile/invite gateway into a calmer internet: a place
where members consolidate their documents and connected sources, read and summarize them,
and publish durable work without being pulled into feeds or surveillance loops. The first
customer delivery is Habte's own profile and book/publication workspace.

## Decision

Build a **member-owned Knowledge & Publication OS** as the next major product subsystem.
The system prioritizes:

1. Publication Studio for Habte's book.
2. Manual document upload and private Knowledge Vault.
3. Source ledger with citations/provenance before AI answers.
4. Scoped AI summaries and Q&A over selected sources.
5. Revocable connectors only after upload/publication/provenance are reliable.

AI must operate over explicit member-selected sources. It must cite source anchors and
must say when sources do not support an answer.

## Consequences

- (+) Turns Stay into a durable, member-owned knowledge home rather than another feed.
- (+) Creates a direct path to publishing the founder's book on-platform.
- (+) Protects trust by requiring source provenance before AI synthesis.
- (+) Gives future connectors a safe ownership/permissions model.
- (−) Slower than building a chatbot first; ingestion, metadata, and deletion/export must be real.
- **Revisit if:** connectors become the first product surface, or if AI answers are allowed without citations.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| Chatbot-first knowledge assistant | Fast demo | Hallucination/provenance risk; weak ownership model | Rejected |
| Feed-first social knowledge platform | Familiar growth pattern | Violates Attention Manifesto | Rejected |
| Publication + vault + provenance first | Trustworthy, durable, book-ready | More backend work up front | **Accepted** |
