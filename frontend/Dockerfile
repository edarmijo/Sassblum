# ─────────────────────────────────────────────
# Stage 1: Build React app with Vite
# ─────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# npm ci: instala exactamente lo que dicta package-lock.json (versiones bloqueadas).
# --ignore-scripts: ningún paquete ejecuta lifecycle scripts al instalar
# (los binarios nativos llegan como optionalDependencies, no via postinstall).
RUN npm ci --ignore-scripts

# Copy source
COPY . .

# Build the app (TypeScript check + Vite bundle)
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Serve with nginx
# ─────────────────────────────────────────────
FROM nginxinc/nginx-unprivileged:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/

# Copy built React app from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Switch to root temporarily to adjust permissions if needed
USER root
RUN chown -R nginx:nginx /usr/share/nginx/html
# Switch back to non-root
USER nginx

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1

# Expose HTTP port
EXPOSE 8080

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
