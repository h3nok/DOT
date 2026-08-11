.PHONY: help setup install install-frontend install-orchestrator dev start start-frontend start-backend start-orchestrator start-orchestrator-worker build lint lint-orchestrator format test test-orchestrator typecheck verify audit migrate-orchestrator seed-profile-delivery ingest-canon orchestrator-services-up orchestrator-services-down

PYTHON ?= python3
#: Whose canon and graph the local stack serves.
OWNER ?= henok

help:
	@echo "Available targets:"
	@echo "  make setup             Bootstrap local dev tools, deps, env files, and infra (incl. Google Cloud SDK for Cloud Run deploys)"
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
	@echo "  make ingest-canon      Load Book One so the copilot can cite it"
	@echo "  make test-orchestrator Test FastAPI orchestrator"
	@echo "  make build             Build frontend"
	@echo "  make lint              Lint frontend"
	@echo "  make typecheck         Typecheck frontend"
	@echo "  make test              Test frontend"
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

# Released canon becomes citable by the twin (ADR-0017). Safe to re-run.
ingest-canon:
	cd backend/orchestrator && ../../.venv/bin/python3 scripts/ingest_canon.py --owner $(OWNER)

build:
	pnpm --dir frontend build

lint:
	pnpm --dir frontend lint

typecheck:
	pnpm --dir frontend exec tsc --noEmit

test:
	pnpm --dir frontend exec vitest run

# The definition of done. Agents and humans run the same gate.
verify: lint typecheck test build lint-orchestrator test-orchestrator
	@echo "All gates passed."

audit:
	-pnpm --dir frontend audit --audit-level high
	-./.venv/bin/python3 -m pip_audit -r backend/orchestrator/requirements.txt

lint-orchestrator:
	cd backend/orchestrator && ../../.venv/bin/ruff check app migrations
	cd backend/orchestrator && ../../.venv/bin/ruff format --check app migrations

format:
	pnpm --dir frontend exec eslint . --fix
	cd backend/orchestrator && ../../.venv/bin/ruff check app migrations --fix
	cd backend/orchestrator && ../../.venv/bin/ruff format app migrations

test-orchestrator:
	cd backend/orchestrator && ../../.venv/bin/pytest
