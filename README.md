# DOT - Digital Organism Theory

Repository for *Consciousness: A Digital Organism*, Book One of Digital
Organism Theory, and the attention-protecting publication system around it.

Public home: [dotheory.org](https://dotheory.org)

## Overview

Book One presents a framework for consciousness, conditioning, and conscious
authorship. It begins with first-person experience, develops a functional model
of state-bearing informational processes, and then applies that model to the
Canvas, Painting, Character, Fear, Love, and Intent. It keeps observations,
models, hypotheses, and speculation visibly distinct.

## Key Concepts

- **Subjective Data Principle**: feeling is data about an interpreter's
  relationship to reality, but feeling is not automatically truth.
- **Digital Organism**: a state-bearing, information-sensitive process that
  works to preserve or develop coherence across change.
- **Big C and Little c**: the book's explicitly marked hypotheses about a
  larger conscious process and local centers of experience.
- **Reality Frames and Reality Streams**: models for rule-bound environments
  and the changing information available within them.
- **Canvas, Painting, and Character**: a separation between persistence,
  accumulated interpretation, and enacted pattern.
- **Conscious Authorship**: the practical movement from inherited conditioning
  toward clearer Intent and greater choice.

## Features

- Interactive philosophical exploration
- Book-derived concept map with passage-level provenance
- Finite Book One reader with native equations and linked scholarly references
- Versioned publication manifests with stable section and concept identifiers
- Vintage, scholarly, responsive reading interface
- Modern, accessible design
- Community engagement platform

## Book One

The current digital edition is available at:

```text
/book/digital-organism-theory
```

The Word manuscript in `docs/blueprint/` remains the editorial source of truth.
After revising it in Word or LibreOffice, rebuild the web chapters, manifest,
and branded digital PDF together:

```bash
make release-book
```

The importer writes a deterministic release manifest and one finite Markdown
unit per chapter under `frontend/public/publications/`. It preserves DOT model
equations as TeX, links numbered citations to the reference section, and emits
stable section/concept identifiers for DOT's graph layer. The normal test suite
compares the private manuscript checksum with the manifest, so a DOCX edit
cannot ship while the reader still represents an older manuscript. The DOCX is
never exposed as a public download. `make release-book-artifacts` refreshes only
the digital PDF when chapter extraction is intentionally unchanged.

The complete online book and PDF are free without an account or email address.
The PDF is published beside the reading units and mirrored in the backend
artifact directory; release tests require identical bytes. Author support is a
separate, optional one-time contribution at `/support?purpose=author`, with a
changeable $20 suggestion and the support plane's server-enforced $2–$5,000 card
range. Free access never requires checkout. Stripe configuration and signed
webhook delivery are still required before support can open. Historical book
purchase/refund records remain private; new book purchase checkout is retired
(ADR-0035; L1/L7/L8/L9/L10, none violated).

The GitHub Pages deployment runs the same release command before every build.
Once a manuscript revision reaches `main`, the public reader and digital PDF are
regenerated from that Word document as part of the deployment.

## YouTube channel artwork

The shared identity lives in
[`frontend/src/content/identity.json`](frontend/src/content/identity.json):
warm ivory and green ink for DOT Daylight; living-ink dark and warm-white text
for DOT Night; jade in both. New readers follow their device's light/dark
preference. Old saved appearances retain their palette; Reset deliberately
adopts the new pair. Source Serif 4 sets long-form reading, Space Grotesk is
the branded display voice, and JetBrains Mono carries annotation.

The off-site [channel kit](design/youtube/index.html) includes an upload-ready
banner, circular-crop-safe avatar, three editable thumbnail examples, and a
still splash/title card. It follows the existing DOT identity and reads the
author credit from the same record as About. A proposed channel description
and account-setup steps are in the kit; no channel or handle has been created,
and no placeholder YouTube link is published on the site.

Rebuild the SVG/PNG exports with the existing frontend fonts and Playwright
Chromium installation:

```bash
pnpm --dir frontend exec node scripts/render-channel-kit.mjs
```

The renderer checks actual text bounds against the banner safe area, avatar
crop safety, PNG dimensions, and upload file-size limits. Fonts are embedded
under their existing SIL Open Font Licenses, retained beside the exports.
These assets are not part of the frontend bundle or an automatic video embed.
They serve L1, L8, L9, and L10 and violate no manifesto laws.

### Complete Word/PDF design

The reproducible design pass preserves manuscript wording, native equations,
fields, citations, and bookmarks while applying a 7-by-10-inch layout, shared
type roles, an ink-and-jade jacket, and light reading pages. Cover text stays
native and editable. Install the optional tools in your chosen Python
environment from `scripts/requirements-book-design.txt`, render the channel
kit's jacket background, and write to an explicit review output:

```bash
python scripts/brand_book_one.py --output /path/to/review-edition.docx
python -m unittest discover -s scripts -p test_brand_book_one.py
```

An approved edition-label correction can be applied explicitly with
`--edition-version 3`. It changes only the existing cover label and edition
metadata, not the book prose or native equations. Inline formulas remain in
left-aligned prose; the longest display formula puts its qualifier on a second
native equation row, without changing any tokens or subscripts. Explicit normal
text formatting keeps the literal "DOT" qualifications from being interpreted
as a dot-accent command by LibreOffice.

Inspect the Word/PDF proof before replacing the canonical private manuscript,
then run `make release-book` to refresh its derived reader and free PDF.
The design recipe embeds the existing licensed fonts in Word and saves them
under `design/fonts/` with their notices. On Linux, PDF export uses these fonts
through an isolated Fontconfig configuration; it does not install fonts into
your account. This is a digital-edition design, not a printer-specific wrap,
spine, bleed, ISBN, or distribution setup. No purchase or signup availability
is changed by the design pass (ADR-0034; L1/L7/L8/L9/L10, none violated).

After book fonts are available, `python scripts/generate_og_image.py` rebuilds
the matching site/book/chapter share cards and the raster icons. Static HTML,
the manifest, and SVG favicons carry the same palette; scripted pages also
update browser chrome as the reading base changes.

## Public-launch preparation

The public book, free PDF, About, concept map, open seams, and Privacy are
static-first. They do not require a member account or a working orchestrator.
The build gives public routes their own HTML text and metadata for readers
and crawlers without JavaScript. The script-free PDF link starts the same
named download as the app rather than depending on a PDF viewer.

Keep the optional services separate from that reading launch:

- **Reader list:** `/readers` is open signup, not membership. Production needs
  a valid `JOIN_CONTACT_KEY` in the server's secret store and a working
  `RESEND_API_KEY` with a verified `EMAIL_FROM` sender. Check
  `GET /v1/readers/status`, then verify a real confirmation message and the
  one-click `/readers/leave#<token>` link before announcing signup. A closed
  list asks for no address; an unreachable service reports a different state
  and offers contact and the book.
- **Author support:** configure the Stripe keys and signed webhook delivery
  described in the [orchestrator README](backend/orchestrator/README.md).
  Verify hosted checkout, the receipt, and server-side settlement before
  announcing contributions. Free downloads never depend on those checks.
- **YouTube:** the artwork is ready, but the channel must be created in the
  author's account. Publish only a real, author-approved channel URL; the
  current site does not invent one or embed a player.
- **Membership:** stays invite-only. Reader confirmation and author support
  do not create a member account. The wider member platform is a separate
  launch gate.

Run `make verify` before publishing. Focused desktop/mobile launch checks are:

```bash
pnpm --dir frontend exec playwright test e2e/public-launch.spec.ts e2e/free-book.spec.ts
```

The reader-list browser checks use controlled API responses; they verify the
interaction and request contract, not production mail delivery. Pushing `main`
triggers the Pages workflow, so keep the changes local until publication is
explicitly approved. This preparation serves L1/L7/L8/L9/L10 and violates none.
Book reading uses the existing P2 Reader; no other Attention OS primitive is
claimed here.

## Getting Started

1. Clone the repository
2. Bootstrap local development with `make setup`
3. Start the development servers with `make start`
4. Open your browser to explore Digital Organism Theory

`make setup` supports macOS and Linux. It checks or installs the local toolchain
(Python 3.12+, Node 20+, pnpm, Docker, Docker Compose), creates the Python
virtual environment, installs frontend and orchestrator dependencies, prepares
local env files from examples, starts Postgres/Redis/MinIO with Docker Compose,
applies orchestrator migrations, and seeds local profile delivery data.

The repository pins pnpm 10.4.1 in both the root and frontend manifests.
Corepack selects a version from the current directory before pnpm handles
`--dir frontend`, so the root pin is required for commands such as `make build`.
The root pnpm dependency and lockfile use the same version for npm-run scripts.
Keep these pins aligned when updating the package manager; there is no need to
change Corepack's global default or disable version checks.

Useful setup flags:

- `ASSUME_YES=1 make setup` for non-interactive package installs
- `SKIP_SYSTEM_PACKAGES=1 make setup` if you manage system tools yourself
- `SKIP_INFRA=1 make setup` to install dependencies without starting Docker services
- `INSTALL_GCLOUD=1 make setup` to include the optional Google Cloud CLI

On Linux, setup starts Docker with `systemctl` or `service` when available. If
your user is not in the `docker` group yet, setup can use `sudo docker` for the
current run and add your user to the group for future shells.

### Google Cloud tooling

CI deploys the orchestrator to Cloud Run from `main`, using Workload Identity
Federation in `.github/workflows/ci.yml`. Local development does not require a
Google Cloud account or CLI.

For manual cloud administration, `INSTALL_GCLOUD=1 make setup` checks the CLI
and installs it when missing on macOS (Homebrew) or Debian/Ubuntu (Google's
signed apt repository). Other systems must install it manually. With
`SKIP_SYSTEM_PACKAGES=1`, a missing requested CLI is an explicit error.

Setup never authenticates or deploys for you. Authenticate separately:

```bash
gcloud auth login
```

Use explicit `--project` and `--region` flags for cloud commands. A configured
account can still have expired credentials; renew them with `gcloud auth login`
if an operation reports reauthentication is required. Application Default
Credentials are separate and only needed for local code that uses Google Cloud
client libraries.

### Alternative Commands

- Frontend only: `make start-frontend`
- Backend only: `make start-backend`
- Frontend build: `make build`
- Frontend lint: `make lint`

## Philosophy

The public theory surface is a reading layer over Book One, not a second
manuscript. Every concept must resolve to a released passage and retain the
book's claim boundary. Earlier Big Theory draft material is historical only and
must not feed the reader, concept map, or grounded agent.
