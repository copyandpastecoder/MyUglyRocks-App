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
- Secrets include: database connection, Redis, JWT, R2 storage, Resend email API
- The `.env` file is only for reference/local tooling, NOT for running the app

### Access Methods

There are two ways to access the application:

#### Option 1: NodePort Services (Recommended for Network Access)

NodePort services are configured with stable ports that persist across restarts:

| Service | NodePort | URL |
|---------|----------|-----|
| Web | 30000 | http://10.80.80.181:30000 |
| API | 30001 | http://10.80.80.181:30001 |

No port-forward needed - services are directly accessible on the host IP.

#### Option 2: Port Forwarding (Localhost Only)

Port-forwards are **not persistent** - they need to be started each time you restart your machine or K8s cluster:

```bash
# Localhost only (default)
kubectl port-forward svc/myuglyrocks-api 5222:80 -n myuglyrocks &
kubectl port-forward svc/myuglyrocks-web 3000:80 -n myuglyrocks &

# Network access (for mobile/other devices) - add --address 0.0.0.0
kubectl port-forward --address 0.0.0.0 svc/myuglyrocks-api 5222:80 -n myuglyrocks &
kubectl port-forward --address 0.0.0.0 svc/myuglyrocks-web 3000:80 -n myuglyrocks &
```

**Access URLs (port-forward):**
- Localhost: http://localhost:3000 (web), http://localhost:5222 (API)
- Network: http://10.80.80.181:3000 (web), http://10.80.80.181:5222 (API)

### Rebuilding After Code Changes

```bash
# Build images (run from repo root)
docker build -t myuglyrocks-api:latest -f src/api/MyUglyRocks.Api/Dockerfile .

# Web image - MUST specify API URL (use NodePort 30001 for network access)
docker build -t myuglyrocks-web:latest --build-arg NEXT_PUBLIC_API_URL=http://10.80.80.181:30001 -f src/web/Dockerfile .

# Restart deployments to pick up new images
kubectl rollout restart deployment myuglyrocks-api myuglyrocks-web -n myuglyrocks

# Wait for rollout
kubectl rollout status deployment myuglyrocks-api myuglyrocks-web -n myuglyrocks
```

**Troubleshooting:**
- If changes don't appear, use `--no-cache` flag: `docker build --no-cache ...`
- Force pod restart: `kubectl delete pod -l app=myuglyrocks-api -n myuglyrocks`
- If using port-forwards, you may need to restart them after rollout

### CORS Configuration

CORS origins are configured in `appsettings.json` and `appsettings.Development.json`.

**Important:** When using NodePort services, ensure CORS origins include the NodePort URLs:
- `appsettings.Development.json` is used because K8s sets `ASPNETCORE_ENVIRONMENT=Development`
- Origins must include `http://10.80.80.181:30000` (web NodePort)

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
