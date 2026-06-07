.PHONY: help install install-frontend install-backend start start-frontend start-backend build lint

help:
	@echo "Available targets:"
	@echo "  make install           Install frontend and backend dependencies"
	@echo "  make start             Start frontend (Vite) and backend (Flask)"
	@echo "  make start-frontend    Start frontend only"
	@echo "  make start-backend     Start backend only"
	@echo "  make build             Build frontend"
	@echo "  make lint              Lint frontend"

install: install-frontend install-backend

install-frontend:
	pnpm --dir frontend install

install-backend:
	./.venv/bin/python3 -m pip install -r backend/requirements.txt

start:
	node runner.js

start-frontend:
	pnpm --dir frontend dev

start-backend:
	cd backend && ../.venv/bin/python3 src/main.py

build:
	pnpm --dir frontend build

lint:
	pnpm --dir frontend lint
