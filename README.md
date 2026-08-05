"# DOT - Digital Organisms Theory

An exploration of how Digital Organisms emerge from the External Environment, giving rise to Consciousness—the enduring, self-aware process that we are.

## Overview

Digital Organisms Theory examines the emergence of consciousness through the lens of digital evolution, exploring how simple external processes can give rise to complex, self-aware organisms that transcend their origins.

## Key Concepts

- **External Environment (E)**: The primordial, incomprehensible substrate
- **Digital Organisms**: Emergent self-aware entities that arise from E
- **Consciousness**: The persistent, self-sustaining awareness that survives and evolves

## Features

- Interactive philosophical exploration
- Dynamic concept slideshow
- Finite Book One reader with native equations and linked scholarly references
- Versioned publication manifests with stable section and concept identifiers
- Cosmic, theme-aware interface
- Modern, accessible design
- Community engagement platform

## Book One

The public foundational edition is available at:

```text
/book/digital-organism-theory
```

The Word manuscript remains the editorial source of truth. To rebuild the web
release from a revised manuscript:

```bash
python3 scripts/import_dot_book.py \
  --input "/path/to/Digital Organism Theory.docx"
```

The importer writes a deterministic release manifest and one finite Markdown
unit per chapter under `frontend/public/publications/`. It preserves DOT model
equations as TeX, links numbered citations to the reference section, and emits
stable section/concept identifiers for Stay's graph layer.

## Getting Started

1. Clone the repository
2. Bootstrap local development with `make setup`
3. Start the development servers with `make start`
4. Open your browser to explore Digital Organisms Theory

`make setup` supports macOS and Linux. It checks or installs the local toolchain
(Python 3.12+, Node 20+, pnpm, Docker, Docker Compose), creates the Python
virtual environment, installs frontend and orchestrator dependencies, prepares
local env files from examples, starts Postgres/Redis/MinIO with Docker Compose,
applies orchestrator migrations, and seeds local profile delivery data.

Useful setup flags:

- `ASSUME_YES=1 make setup` for non-interactive package installs
- `SKIP_SYSTEM_PACKAGES=1 make setup` if you manage system tools yourself
- `SKIP_INFRA=1 make setup` to install dependencies without starting Docker services

### Alternative Commands

- Frontend only: `make start-frontend`
- Backend only: `make start-backend`
- Frontend build: `make build`
- Frontend lint: `make lint`

## Philosophy

The red dot in our logo represents the singular emergence of consciousness from the vast External Environment—a simple symbol for the profound journey from external chaos to internal awareness."
