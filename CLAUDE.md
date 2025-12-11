# MyUglyRocks - Claude Code Instructions

## Development Environment

### ALWAYS use Kubernetes for development
- **DO NOT** use docker-compose for running the application
- All services (API, web, postgres, redis) run in Kubernetes
- Docker is only used for building images, NOT for running containers directly

### Running the Application

1. **Build Docker images:**
   ```bash
   docker build -t myuglyrocks-api:latest -f src/api/MyUglyRocks.Api/Dockerfile .
   docker build -t myuglyrocks-web:latest -f src/web/Dockerfile .
   ```

2. **Deploy to Kubernetes:**
   ```bash
   kubectl apply -f k8s/base/
   kubectl rollout restart deployment myuglyrocks-api -n myuglyrocks
   ```

3. **Check pod status:**
   ```bash
   kubectl get pods -n myuglyrocks
   ```

### Secrets Management
- All secrets are stored in Kubernetes secrets (`myuglyrocks-secrets`)
- Secrets include: database connection, Redis, JWT, R2 storage (including public URL), Resend email API
- The `.env` file is only for reference/local tooling, NOT for running the app

### R2 Photo Storage
- Photos are stored in Cloudflare R2 bucket: `dev-myuglyrocks-media`
- Public URL: `https://pub-b409015555184d2ea808e87b602b1da5.r2.dev`
- The `R2__PublicUrl` env var is set from K8s secret `r2-public-url`
- AWSSDK.S3 v4 requires both `DisablePayloadSigning` and `DisableDefaultChecksumValidation` for R2 compatibility

### Access Methods

There are two ways to access the application:

#### Option 1: NodePort Services with HTTPS (Recommended for Network Access)

NodePort services are configured with stable ports that persist across restarts. HTTPS is enabled via mkcert certificates:

| Service | Path | URL |
|---------|------|-----|
| Web | / | https://10.80.80.181:30443 |
| API | /api | https://10.80.80.181:30443/api |

Note: Both services are served via nginx-ingress on port 30443 with path-based routing.

No port-forward needed - services are directly accessible on the host IP with HTTPS.

#### Option 2: Cloudflare Tunnel (Mobile/External Access)

For mobile testing with valid SSL certificates:

| Service | URL | Notes |
|---------|-----|-------|
| Web + API | https://dev.myuglyrocks.com | Valid SSL, accessible from anywhere |
| API | https://dev.myuglyrocks.com/api | Same path-based routing as NodePort |

The Cloudflare Tunnel runs as a pod in K8s (`cloudflared` deployment) and routes traffic to nginx-ingress.

### Rebuilding After Code Changes

```bash
# Build images (run from repo root)
docker build -t myuglyrocks-api:latest -f src/api/MyUglyRocks.Api/Dockerfile .
docker build -t myuglyrocks-web:latest -f src/web/Dockerfile .

# Restart deployments to pick up new images
kubectl rollout restart deployment myuglyrocks-api myuglyrocks-web -n myuglyrocks

# Wait for rollout
kubectl rollout status deployment myuglyrocks-api myuglyrocks-web -n myuglyrocks
```

**Note:** The API URL is configured at runtime via K8s deployment (`API_URL` env var), not at build time. This means:
- Build the web image once, deploy to any environment
- Change API URL by updating `k8s/base/web-deployment.yaml` and restarting the pod
- No rebuild needed when changing URLs

**Troubleshooting:**
- If changes don't appear, use `--no-cache` flag: `docker build --no-cache ...`
- Force pod restart: `kubectl delete pod -l app=myuglyrocks-api -n myuglyrocks`
- If using port-forwards, you may need to restart them after rollout

### CORS Configuration

CORS origins are configured in `appsettings.json` and `appsettings.Development.json`.

**Important:** When using NodePort services, ensure CORS origins include the HTTPS NodePort URLs:
- `appsettings.Development.json` is used because K8s sets `ASPNETCORE_ENVIRONMENT=Development`
- Origins must include `https://10.80.80.181:30443` (web NodePort with HTTPS)

If you see CORS errors like "Cross-Origin Request Blocked", check:
1. `appsettings.Development.json` has correct origins with NodePort numbers
2. Rebuild API image with `--no-cache` to pick up config changes
3. Delete pod to force restart: `kubectl delete pod -l app=myuglyrocks-api -n myuglyrocks`

## Project Structure

- `src/api/` - .NET 9 Backend API
- `src/web/` - Next.js 16 Frontend
- `k8s/base/` - Kubernetes manifests
- `docs/` - Documentation

## Additional Guidelines

- See `src/web/CLAUDE.md` for frontend-specific coding standards
- See `docs/` for architecture and feature documentation
