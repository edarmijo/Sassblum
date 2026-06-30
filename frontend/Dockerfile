# ─────────────────────────────────────────────
# Stage 1: Build React app with Vite
# ─────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# npm install (no npm ci): el lockfile generado en Windows no incluye las
# variantes Linux de los paquetes opcionales WASM (bug conocido de npm)
RUN npm install --prefer-offline --no-audit

# Copy source
COPY . .

# Build the app (TypeScript check + Vite bundle)
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Serve with nginx
# ─────────────────────────────────────────────
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/

# Copy built React app from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Non-root user not strictly needed for nginx (runs as nginx user by default),
# but good practice for consistency
RUN chown -R nginx:nginx /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Expose HTTP port
EXPOSE 80

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
