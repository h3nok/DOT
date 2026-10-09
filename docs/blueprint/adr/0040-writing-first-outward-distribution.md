# ADR-0040: Native writing with optional outward distribution

- **Status:** Accepted
- **Date:** 2026-10-07
- **Deciders:** Founder, through the request to finish native blogging and cross-platform publishing

## Context

The public blog and Studio can host complete, immutable writing releases, but
the archive is empty and the distribution tools export only a title and link.
The founder wants to write here and distribute to other platforms from the same
flow. This implements the distribution portion of proposed ADR-0039 and doc 16;
it does not approve or activate newsletter email delivery.

## Decision

Keep Studio as the editorial source. Publish the complete piece on the owned
domain first. Distribute only an exact public Academy essay release, with active
publisher authority checked server-side. Draft edits never change an external
package for an already released version. Preserve existing essay/book addresses.

Support author-selected LinkedIn link posting using its documented self-service
API and OAuth permissions. Keep account tokens encrypted on the backend with a
dedicated key, bound to the authenticated owner and actor. OAuth requests expire,
are consumed once, and cannot be replayed under another account. Disconnect
removes stored credentials. Absent application configuration disables automatic
sharing honestly while native publishing remains available.

Use complete Markdown, HTML, and rich-text copies for Substack and Medium.
Medium's documentation rejects new API integrations; Substack's documented API
covers public creator metadata. Neither is represented as automatic article
publishing. Native source links accompany exports; Medium's import tool can
preserve its supported canonical-link behavior. Do not invent external account
URLs, transfer the owned reader list, or claim a recorded copy was verified.

An explicit author action may publish here and then share the released title,
summary, and link to a connected LinkedIn account. Persist the external outcome
separately. External failure cannot roll back or obscure native success. Deduplicate
by owner, actor, release, and platform. A timeout, process interruption, missing
provider receipt, or server error needs manual review rather than blind retry.
Definite provider rejection allows an explicit retry. An author can record the
published external URL to reconcile an uncertain outcome.

Serves L1 (legible publishing outcomes), L3 (reader-chosen channels), L4 (no interruptive
delivery), L7 (clear outcomes and disconnect), L9 (private credentials and no list
transfer), and L10 (one destination at a time with advanced exports collapsed);
violates none. Public reading keeps copy-link and device sharing; distribution
controls stay inside the author's private workspace.

## Consequences

External platform features and account approvals set the automation boundary.
LinkedIn native articles/newsletters are different from API link posts. Real
application credentials and an account grant are required before automatic
sharing is active. Export/import remains a user action on unsupported platforms.
The connector tables hold permissions and distribution state, not another CMS.
No worker service or email campaign is required for this bounded request flow.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| Link directory | Fast | Does not host the author's complete writing | Rejected |
| A second editorial CMS | Mature editor | Two sources to maintain | Rejected |
| Undocumented publishing APIs or browser cookies | Broader apparent automation | Unverified capability and fragile authorization | Rejected |
| Native release, supported API sharing, portable full-text exports | Owned writing and honest platform limits | Account setup and some manual steps remain | Accepted |

Capability evidence checked 2026-10-07:
[LinkedIn sharing](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin),
[Medium importing](https://help.medium.com/hc/en-us/articles/213480228-API-Importing),
[Substack API scope](https://substack.com/api-tos).
