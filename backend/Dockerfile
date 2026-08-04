# ─────────────────────────────────────────────
# Stage 1: Builder (install dependencies)
# ─────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /app

# Install system dependencies required by Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# requirements.lock fija versiones + hashes SHA-256 de todos los paquetes
# (directos y transitivos) para linux/amd64 + Python 3.12.
# --require-hashes: verificación explícita de integridad (Sonar S6471).
# --only-binary: solo wheels, nunca setup.py arbitrarios.
COPY requirements.lock .
RUN pip install --prefix=/install --no-cache-dir --only-binary=:all: --require-hashes -r requirements.lock

# ─────────────────────────────────────────────
# Stage 2: Runtime (minimal footprint)
# ─────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# Install runtime-only system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Instalar desde el lockfile con verificación explícita de integridad (Sonar S6471).
COPY requirements.lock .
RUN pip install --no-cache-dir --only-binary=:all: --require-hashes -r requirements.lock

# Copy application code explicitly to avoid copying sensitive data
COPY apps/ apps/
COPY core/ core/
COPY config/ config/
COPY manage.py .

# Ensure installed scripts are in PATH
ENV PATH=/usr/local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Create staticfiles directory, collect static files, and create non-root user
RUN mkdir -p staticfiles && \
    python manage.py collectstatic --noinput 2>/dev/null || true && \
    useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import socket, os; socket.create_connection(('localhost', int(os.environ.get('PORT', 8000))), timeout=5)"

# Expose ASGI port (Render inyecta PORT; localmente usa 8000)
EXPOSE 8000

# Run migrations and start Daphne using exec form via sh
CMD ["sh", "-c", "python manage.py migrate --noinput && daphne -b 0.0.0.0 -p ${PORT:-8000} config.asgi:application"]
