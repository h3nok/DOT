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

The GitHub Pages deployment runs the same release command before every build.
Once a manuscript revision reaches `main`, the public reader and digital PDF are
regenerated from that Word document as part of the deployment.

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

Useful setup flags:

- `ASSUME_YES=1 make setup` for non-interactive package installs
- `SKIP_SYSTEM_PACKAGES=1 make setup` if you manage system tools yourself
- `SKIP_INFRA=1 make setup` to install dependencies without starting Docker services

On Linux, setup starts Docker with `systemctl` or `service` when available. If
your user is not in the `docker` group yet, setup can use `sudo docker` for the
current run and add your user to the group for future shells.

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
