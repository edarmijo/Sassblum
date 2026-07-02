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

# Copy requirements and install into a portable prefix that the runtime image
# can copy into Python's global site-packages.
COPY requirements.txt .
RUN pip install --prefix=/install --no-cache-dir -r requirements.txt

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

# Copy Python dependencies from builder into the runtime Python environment
COPY --from=builder /install /usr/local

# Copy application code explicitly to avoid copying sensitive data
COPY apps/ apps/
COPY core/ core/
COPY config/ config/
COPY manage.py .

# Runtime settings
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Create staticfiles directory and collect static files
RUN mkdir -p staticfiles && \
    python manage.py collectstatic --noinput 2>/dev/null || true

# Create non-root user for security
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import socket, os; socket.create_connection(('localhost', int(os.environ.get('PORT', 8000))), timeout=5)"

# Expose ASGI port (Render inyecta PORT; localmente usa 8000)
EXPOSE 8000

# Run migrations and start Daphne using exec form via sh
CMD ["sh", "-c", "python manage.py migrate --noinput && daphne -b 0.0.0.0 -p ${PORT:-8000} config.asgi:application"]
