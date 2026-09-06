.PHONY: help setup install install-frontend install-orchestrator dev start start-frontend start-backend start-orchestrator start-orchestrator-worker build lint lint-orchestrator format test test-e2e test-orchestrator typecheck verify audit migrate-orchestrator seed-profile-delivery seed-book-project seed-academy ingest-canon release-book release-book-artifacts test-book-release orchestrator-services-up orchestrator-services-down

PYTHON ?= python3
#: Whose canon and graph the local stack serves.
OWNER ?= henok
BOOK_MANUSCRIPT ?= docs/blueprint/DOT-Book-One-Digital-Edition-v3.docx

help:
	@echo "Available targets:"
	@echo "  make setup             Bootstrap local dev tools, deps, env files, and infra"
	@echo "  make install           Install frontend and orchestrator dependencies"
	@echo "  make install-orchestrator Install FastAPI orchestrator dependencies"
	@echo "  make dev               Start the full local stack (infra + APIs + worker + frontend)"
	@echo "  make start             Alias of make dev"
	@echo "  make start-frontend    Start frontend only"
	@echo "  make start-backend     Alias of make start-orchestrator"
	@echo "  make start-orchestrator Start FastAPI orchestrator only"
	@echo "  make start-orchestrator-worker Start Dramatiq orchestrator worker"
	@echo "  make orchestrator-services-up Start local Postgres, Redis, and MinIO"
	@echo "  make orchestrator-services-down Stop local orchestrator services"
	@echo "  make migrate-orchestrator Apply orchestrator migrations"
	@echo "  make seed-profile-delivery Seed one published profile delivery release"
	@echo "  make seed-book-project    Seed Book One as a studio project"
	@echo "  make seed-academy         Seed DOT Academy as institution kernel space 1"
	@echo "  make ingest-canon      Load Book One so the copilot can cite it"
	@echo "  make release-book      Rebuild the web reader and digital PDF from the DOCX"
	@echo "  make release-book-artifacts Refresh the digital PDF from the DOCX"
	@echo "  make test-book-release Verify every Book One artifact matches the DOCX"
	@echo "  make test-orchestrator Test FastAPI orchestrator"
	@echo "  make build             Build frontend"
	@echo "  make lint              Lint frontend"
	@echo "  make typecheck         Typecheck frontend"
	@echo "  make test              Test frontend"
	@echo "  make test-e2e          Browser tests (Playwright)"
	@echo "  make verify            Run every gate (lint, types, tests, build, backend)"
	@echo "  make format            Autoformat frontend and backend"
	@echo "  make audit             Dependency vulnerability audit"

setup:
	bash ./scripts/setup-dev.sh

install: install-frontend install-orchestrator

install-frontend:
	pnpm --dir frontend install

install-orchestrator:
	$(PYTHON) -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 12) else "Python 3.12+ is required; run make setup")'
	$(PYTHON) -m venv .venv
	./.venv/bin/python3 -m pip install -r backend/orchestrator/requirements.txt

dev:
	./scripts/dev-stack.sh

start: dev

start-frontend:
	pnpm --dir frontend dev

start-backend: start-orchestrator

start-orchestrator:
	cd backend/orchestrator && ../../.venv/bin/python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

start-orchestrator-worker:
	cd backend/orchestrator && ../../.venv/bin/python3 -m dramatiq app.workers.tasks

orchestrator-services-up:
	docker compose -f docker-compose.orchestrator.yml up -d

orchestrator-services-down:
	docker compose -f docker-compose.orchestrator.yml down

migrate-orchestrator:
	cd backend/orchestrator && ../../.venv/bin/alembic upgrade head

seed-profile-delivery:
	cd backend/orchestrator && ../../.venv/bin/python3 scripts/seed_profile_delivery.py

seed-book-project:
	cd backend/orchestrator && ../../.venv/bin/python3 scripts/seed_book_project.py

# An institution is a row plus a policy, never a codepath (ADR-0032). Idempotent.
seed-academy:
	cd backend/orchestrator && ../../.venv/bin/python3 scripts/seed_academy_space.py

# Released canon becomes citable by the twin (ADR-0017). Safe to re-run.
ingest-canon:
	cd backend/orchestrator && ../../.venv/bin/python3 scripts/ingest_canon.py --owner $(OWNER)

# The Word manuscript is the only editorial source. Pandoc derives the web
# sections and LibreOffice derives the public PDF; both tools must be explicit
# so a release cannot quietly fall back to stale generated files.
release-book:
	$(PYTHON) scripts/import_dot_book.py --input $(BOOK_MANUSCRIPT)
	$(MAKE) test-book-release

release-book-artifacts:
	$(PYTHON) scripts/import_dot_book.py --input $(BOOK_MANUSCRIPT) --artifacts-only
	$(MAKE) test-book-release

test-book-release:
	pnpm --dir frontend exec vitest run src/content/publications/dotBookOne.release.test.ts

build:
	pnpm --dir frontend build

lint:
	pnpm --dir frontend lint

typecheck:
	pnpm --dir frontend exec tsc --noEmit

test:
	pnpm --dir frontend exec vitest run

# Browser-level checks: the rendered document, not the source. Needs a one-time
# `pnpm --dir frontend test:e2e:install` for the Chromium binary.
test-e2e:
	pnpm --dir frontend exec playwright test

# The definition of done. Agents and humans run the same gate.
verify: lint typecheck test build test-e2e lint-orchestrator test-orchestrator
	@echo "All gates passed."

# Audit the installed backend used by verify, including its transitive packages.
# Failures must remain visible to release automation.
audit:
	pnpm --dir frontend audit --audit-level high
	./.venv/bin/python3 -m pip_audit --local

lint-orchestrator:
	cd backend/orchestrator && ../../.venv/bin/ruff check app migrations
	cd backend/orchestrator && ../../.venv/bin/ruff format --check app migrations

format:
	pnpm --dir frontend exec eslint . --fix
	cd backend/orchestrator && ../../.venv/bin/ruff check app migrations --fix
	cd backend/orchestrator && ../../.venv/bin/ruff format app migrations

test-orchestrator:
	cd backend/orchestrator && ../../.venv/bin/pytest
