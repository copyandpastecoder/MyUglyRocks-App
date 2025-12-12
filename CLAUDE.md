# MyUglyRocks Development Guide

## Development Environment

**IMPORTANT: No localhost. Everything runs through Kubernetes with tunnel to dev.myuglyrocks.com**

### Deployment

To deploy changes to the dev environment:

```bash
# Build API image
docker build -t myuglyrocks-api:latest -f src/api/MyUglyRocks.Api/Dockerfile .

# Build Web image
docker build -t myuglyrocks-web:latest -f src/web/Dockerfile ./src/web

# Restart deployments to pick up new images
kubectl rollout restart deployment/myuglyrocks-api -n myuglyrocks
kubectl rollout restart deployment/myuglyrocks-web -n myuglyrocks

# Check status
kubectl get pods -n myuglyrocks
```

### Database

- PostgreSQL runs in Kubernetes namespace `myuglyrocks`
- Migrations run automatically on API startup
- To reseed data: restart the API pod (drops and recreates demo user data)

### Accessing Services

- **Web**: https://dev.myuglyrocks.com (via Cloudflare tunnel)
- **API**: https://dev.myuglyrocks.com/api (via Cloudflare tunnel)

### Useful Commands

```bash
# View API logs
kubectl logs -f deployment/myuglyrocks-api -n myuglyrocks

# View Web logs
kubectl logs -f deployment/myuglyrocks-web -n myuglyrocks

# Connect to database (requires port-forward - ask user first)
kubectl exec -it deployment/postgres -n myuglyrocks -- psql -U postgres -d myuglyrocks

# Check pod status
kubectl get pods -n myuglyrocks -w
```

## Code Standards

See [src/web/CLAUDE.md](src/web/CLAUDE.md) for frontend coding standards (theming, components).
