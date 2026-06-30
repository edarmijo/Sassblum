# SassBlum Production Deployment Guide

## Prerequisites

- Docker & Docker Compose v2
- Jenkins (on CI server)
- SSH access to production server
- Supabase project with PostgreSQL database
- Docker Hub or private registry account
- Linux server (Ubuntu 22.04+ recommended)

---

## Backend Environment Variables

| Variable | Example | Required | Notes |
|----------|---------|----------|-------|
| DJANGO_SECRET_KEY | `...50+ random chars...` | Yes | Use `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| DJANGO_DEBUG | False | Yes | ALWAYS False in production |
| DATABASE_URL | `postgresql://user:pass@host:5432/db` | Yes | Supabase connection string |
| REDIS_URL | `redis://redis:6379/0` | Yes | For Django Channels (internal container name) |
| USE_REDIS | True | Yes | Enable Redis in production |
| CORS_ALLOWED_ORIGINS | `https://app.com,https://www.com` | Yes | Comma-separated, no spaces |
| ALLOWED_HOSTS | `api.example.com,www.api.com` | Yes | Comma-separated |
| EMAIL_HOST | smtp.gmail.com | Yes | SMTP server |
| EMAIL_PORT | 587 | Yes | TLS port |
| EMAIL_HOST_USER | noreply@example.com | Yes | SMTP username |
| EMAIL_HOST_PASSWORD | `...` | Yes | SMTP password (or app token) |
| DEFAULT_FROM_EMAIL | noreply@example.com | Yes | From address for emails |
| FRONTEND_URL | https://app.example.com | Yes | For verification links in emails |
| SUPABASE_URL | https://your-project.supabase.co | Optional | For file uploads |
| SUPABASE_SERVICE_KEY | your-service-key | Optional | For file uploads |

---

## Frontend Environment Variables

Used during build time (via `.env.production` or CI injection):

| Variable | Example | Required | Notes |
|----------|---------|----------|-------|
| VITE_API_BASE_URL | `https://api.example.com/api` | Yes | Backend API base (with `/api` suffix) |
| VITE_WS_URL | `wss://api.example.com` | Yes | WebSocket URL (wss:// for secure) |
| VITE_ENV | production | Yes | For conditional logic in app |

---

## Jenkins Setup

### Install Required Plugins

1. Go to **Manage Jenkins** → **Manage Plugins**
2. Install these plugins:
   - **Docker Pipeline**
   - **SSH Agent**
   - **Credentials Plugin** (usually pre-installed)
   - **Pipeline** (usually pre-installed)
   - **Git** (usually pre-installed)

### Create Jenkins Credentials

#### 1. Docker Registry Credentials
- Credential ID: `docker-credentials`
- Type: Username with password
- Username: Your Docker Hub username
- Password: Docker Hub personal access token (Settings → Security → Tokens)

#### 2. SSH Deploy Key
- Credential ID: `deploy-server-ssh`
- Type: SSH Username with private key
- Username: `deploy`
- Private key: Content of your SSH private key file (the deployment user's private key)

#### 3. Optional: GitHub Webhook
For automatic triggers on push to main:
1. Go to GitHub repo → Settings → Webhooks → Add webhook
2. Payload URL: `http://jenkins.example.com/github-webhook/`
3. Content type: `application/json`
4. Events: Push events
5. Active: Yes

### Create Jenkins Pipeline Job

1. New Item → **Pipeline**
2. **Name**: `sassblum-cd`
3. **Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: `https://github.com/your-org/SassBlumRedise-oWeb.git`
   - **Branch**: `*/main`
   - **Script path**: `Jenkinsfile`
4. **Build triggers**:
   - Check "GitHub hook trigger for GITScm polling" (if using webhook)
   - OR: Poll SCM: `H/15 * * * *` (every 15 minutes)

---

## Production Server Setup

### Prerequisites on Ubuntu 22.04+

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
sudo apt-get install -y docker.io docker-compose-v2 git curl

# Add deploy user to docker group (no sudo for docker)
sudo usermod -aG docker deploy

# Enable Docker to start on boot
sudo systemctl enable docker
```

### Directory Structure

```bash
# Create deployment directory
sudo mkdir -p /opt/sassblum
sudo chown deploy:deploy /opt/sassblum
cd /opt/sassblum

# Create directory for persistent logs
mkdir -p logs

# Set restricted permissions on env file
touch .env.prod
chmod 600 .env.prod
```

### Environment Configuration

Create `/opt/sassblum/.env.prod`:

```bash
# Django
DJANGO_SECRET_KEY=your-secure-random-key-here-min-50-chars
DJANGO_DEBUG=False

# Database
DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres

# Redis (running in Docker)
REDIS_URL=redis://redis:6379/0
USE_REDIS=True

# CORS and hosts
CORS_ALLOWED_ORIGINS=https://app.example.com,https://www.example.com
ALLOWED_HOSTS=api.example.com,www.api.example.com

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@example.com
FRONTEND_URL=https://app.example.com

# Supabase (optional)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

### Clone Repository

```bash
cd /opt/sassblum
git clone https://github.com/your-org/SassBlumRedise-oWeb.git .
```

### SSL/TLS with Let's Encrypt

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d api.example.com -d www.api.example.com

# Certificate paths:
# - Full chain: /etc/letsencrypt/live/api.example.com/fullchain.pem
# - Private key: /etc/letsencrypt/live/api.example.com/privkey.pem
```

### Update nginx.conf for HTTPS

Once you have certificates, update `nginx.conf`:

```nginx
upstream backend {
    server backend:8000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.example.com www.api.example.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name api.example.com www.api.example.com;

    # SSL certificates (from Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    client_max_body_size 10M;

    location / {
        root /usr/share/nginx/html;
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600s;
        proxy_buffering off;
    }

    location /ws/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_buffering off;
    }

    location /static/ {
        alias /usr/share/nginx/html/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript;
    gzip_min_length 1000;
}
```

### Test Deployment Locally

```bash
# Pull latest images
docker pull docker.io/yourname/sassblum-backend:latest
docker pull docker.io/yourname/sassblum-frontend:latest

# Start with docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d

# Check services
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

---

## Deployment Workflow

### Via Jenkins (Automated)

1. Push code to `main` branch
2. Jenkins webhook triggers automatically (or manual trigger)
3. Pipeline stages execute:
   - Checkout
   - Backend Tests (pytest, flake8)
   - Frontend Tests (tsc, jest, eslint)
   - Build Docker images
   - Push to Docker registry
   - Deploy to production server (SSH)
   - Smoke tests
4. Monitor Jenkins logs: Manage Jenkins → System log

### Manual Deployment

```bash
# On CI server
git clone https://github.com/your-org/SassBlumRedise-oWeb.git
cd SassBlumRedise-oWeb

# Run tests
cd backend && pytest && cd ..
cd frontend && npm test && cd ..

# Build images
docker build -t docker.io/yourname/sassblum-backend:latest backend/
docker build -t docker.io/yourname/sassblum-frontend:latest frontend/

# Push to registry
docker push docker.io/yourname/sassblum-backend:latest
docker push docker.io/yourname/sassblum-frontend:latest

# SSH to production and pull/restart
ssh deploy@prod-server.example.com << 'EOF'
cd /opt/sassblum
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate
EOF
```

---

## Monitoring & Maintenance

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Backend only
docker-compose -f docker-compose.prod.yml logs -f backend

# Frontend only
docker-compose -f docker-compose.prod.yml logs -f frontend

# Redis only
docker-compose -f docker-compose.prod.yml logs -f redis
```

### Health Checks

Each container has a health check configured. View status:

```bash
docker-compose -f docker-compose.prod.yml ps
# STATUS should show (healthy) for all services
```

### Database Migrations

```bash
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate
```

### Collect Static Files

```bash
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput
```

### Backup Database

```bash
# Via Supabase dashboard (Settings → Backups)
# Or via pg_dump
pg_dump "postgresql://user:password@db.supabase.co:5432/postgres" > /opt/sassblum/backups/db-$(date +%Y%m%d-%H%M%S).sql
```

### Scale Backend

```bash
# Run multiple backend instances (behind nginx upstream)
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

---

## Rollback Procedure

If a deployment fails:

```bash
# SSH to production server
ssh deploy@prod-server.example.com

cd /opt/sassblum

# Stop current deployment
docker-compose -f docker-compose.prod.yml down

# Change image tag to previous build number in docker-compose.prod.yml
# Example: sassblum-backend:123 instead of :latest

# Restart with previous version
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Once confirmed to be working, update Jenkins to deploy that build number
```

---

## Troubleshooting

### Container exits immediately

```bash
# Check logs
docker logs sassblum_backend_prod

# Common causes:
# - Missing environment variable: grep "error" docker logs
# - Database connection: verify DATABASE_URL in .env.prod
# - Secret key invalid: ensure DJANGO_SECRET_KEY is 50+ chars
```

### WebSocket connection fails

```bash
# Check Redis running
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping
# Should return PONG

# Check backend logs for WebSocket errors
docker-compose -f docker-compose.prod.yml logs backend | grep -i websocket

# Verify nginx proxy_buffering is off (see nginx.conf /ws/ block)
```

### Slow response times

```bash
# Check if backend is overloaded
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py shell
# >>> from django.db import connection
# >>> len(connection.queries)  # If > 100, N+1 query problem

# Scale backend:
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Monitor with:
docker stats
```

### Certificate renewal failing

```bash
# Certbot auto-renewal runs daily. Check status:
sudo systemctl status certbot.timer

# Manual renewal:
sudo certbot renew --force-renewal

# If renewal succeeds, nginx reloads automatically
```

---

## Success Indicators

- [ ] `docker-compose -f docker-compose.prod.yml ps` shows all services as (healthy)
- [ ] `curl https://api.example.com/` returns HTML (frontend loads)
- [ ] `curl -H "Authorization: Bearer $TOKEN" https://api.example.com/api/tickets/` returns JSON (API works)
- [ ] WebSocket connects: browser DevTools → Network → ws → status 101 Switching Protocols
- [ ] Emails send: check backend logs for SMTP log entries
- [ ] Notifications arrive in real-time: create ticket, see notification bell update instantly

---

## Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables: `docker-compose config | grep DJANGO_SECRET_KEY`
3. Test connectivity: `docker-compose exec backend python manage.py shell`
4. Check Git log: `git log --oneline | head -10`
