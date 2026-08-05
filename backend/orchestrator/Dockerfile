# syntax=docker/dockerfile:1
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# ── deps layer (cached unless requirements.txt changes) ──────────────────────
FROM base AS deps
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# ── final image ───────────────────────────────────────────────────────────────
FROM deps AS final

COPY . .

# Non-root user for least-privilege execution
RUN addgroup --system dot && adduser --system --ingroup dot dot
USER dot

EXPOSE 8000

# Default: API server. Override CMD to run the worker.
CMD ["python", "-m", "uvicorn", "app.main:app", \
     "--host", "0.0.0.0", "--port", "8000", \
     "--workers", "2", "--no-access-log"]
