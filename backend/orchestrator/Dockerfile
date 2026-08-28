# syntax=docker/dockerfile:1
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Build from the repository root so the released canon can travel with the
# service image: docker build -f backend/orchestrator/Dockerfile .

# ── deps layer (cached unless requirements.txt changes) ──────────────────────
FROM base AS deps
COPY backend/orchestrator/requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# ── final image ───────────────────────────────────────────────────────────────
FROM deps AS final

COPY backend/orchestrator/ .
COPY frontend/public/publications/henok/digital-organism-theory/v3/ \
    /canon/digital-organism-theory/v3/

ENV ORCHESTRATOR_CANON_ROOT=/canon/digital-organism-theory/v3

# Non-root user for least-privilege execution
RUN addgroup --system dot && adduser --system --ingroup dot dot
USER dot

EXPOSE 8000

# Default: API server. The public launch runs one worker on one Cloud Run instance.
CMD ["python", "-m", "uvicorn", "app.main:app", \
     "--host", "0.0.0.0", "--port", "8000", \
     "--workers", "1", "--no-access-log"]
