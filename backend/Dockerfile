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

# Copy requirements and install
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

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

# Copy Python dependencies from builder
COPY --from=builder /root/.local /root/.local

# Copy application code
COPY . .

# Ensure /root/.local/bin is in PATH for daphne
ENV PATH=/root/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Create staticfiles directory
RUN mkdir -p staticfiles

# Collect static files (CSS, admin, etc.)
RUN python manage.py collectstatic --noinput 2>/dev/null || true

# Create non-root user for security
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import socket, os; socket.create_connection(('localhost', int(os.environ.get('PORT', 8000))), timeout=5)"

# Expose ASGI port (Render inyecta PORT; localmente usa 8000)
EXPOSE 8000

# Migrate al arrancar (patrón PaaS) y luego Daphne (HTTP + WebSocket).
# Shell form para que ${PORT} se expanda en runtime.
CMD python manage.py migrate --noinput && daphne -b 0.0.0.0 -p ${PORT:-8000} config.asgi:application
