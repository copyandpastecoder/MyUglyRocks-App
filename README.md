# MyUglyRocks

A rock tumbling tracking application for hobbyists to log cycles, stages, and results.

## Project Structure

```
MyUglyRocks-App/
├── docs/                              # Specifications & documentation
│   ├── 01-PRD.md                      # Product Requirements
│   ├── 02-USER-STORIES.md             # User Stories
│   ├── 03-SITEMAP.md                  # Site Navigation
│   ├── 04-DATA-MODEL.md               # Database Schema
│   ├── 05-API-SPEC.md                 # API Endpoints
│   ├── 06-ARCHITECTURE.md             # System Architecture
│   ├── 07-SEQUENCE-DIAGRAMS.md        # Flow Diagrams
│   ├── 08-EMAIL-TEMPLATES.md          # Email Templates
│   ├── 09-DEV-ROADMAP.md              # Development Roadmap
│   ├── wireframes/                    # UI Wireframes
│   ├── seed-data/                     # CSV seed data files
│   └── decisions/                     # Architecture Decision Records
├── src/
│   ├── api/                           # Backend API
│   │   ├── MyUglyRocks.Api/           # ASP.NET Core Web API (entry point)
│   │   ├── MyUglyRocks.Core/          # Business logic, Entities, Services
│   │   ├── MyUglyRocks.Abstractions/  # Interfaces, Enums, Constants
│   │   ├── MyUglyRocks.Infrastructure/# EF Core, Repositories, External Services
│   │   └── MyUglyRocks.sln            # Solution file
│   └── web/                           # Frontend
│       └── (Next.js 14 App)           # TypeScript, Tailwind CSS, App Router
├── docker-compose.yml                 # Local development services
├── .editorconfig                      # Code style configuration
└── README.md
```

## Tech Stack

### Backend
- **Framework:** ASP.NET Core 9.0
- **Database:** PostgreSQL 16 with EF Core 9.0
- **Auth:** JWT with refresh tokens
- **Logging:** Serilog
- **API Docs:** Scalar (OpenAPI)
- **Secrets:** Kubernetes Secrets / Environment Variables

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui (to be added)

### Infrastructure
- **Database:** PostgreSQL (via Docker)
- **Cache:** Redis (via Docker)
- **Hosting:** Railway (production)
- **Image Storage:** Cloudflare R2

## Getting Started

### Prerequisites
- [.NET 9.0 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

### 1. Build Docker Images

```bash
# Build API and Web images (run from repo root)
docker build -t myuglyrocks-api:latest -f src/api/MyUglyRocks.Api/Dockerfile .
docker build -t myuglyrocks-web:latest -f src/web/Dockerfile .
```

### 2. Deploy to Kubernetes

```bash
# Apply all K8s manifests
kubectl apply -f k8s/base/

# Restart deployments to pick up new images
kubectl rollout restart deployment myuglyrocks-api myuglyrocks-web -n myuglyrocks

# Check pod status
kubectl get pods -n myuglyrocks
```

### 3. Access the Application

| Access Method | URL | Notes |
|---------------|-----|-------|
| Local Network | https://10.80.80.181:30443 | Via nginx-ingress NodePort |
| Mobile/External | https://dev.myuglyrocks.com | Via Cloudflare Tunnel (valid SSL) |
| API Docs | https://10.80.80.181:30443/scalar/v1 | Scalar OpenAPI docs |

> **Note:** Both web and API are served via nginx-ingress on port 30443 with path-based routing (`/api` routes to API, `/` routes to web).

## Development

### Creating Migrations

```bash
cd src/api
dotnet ef migrations add <MigrationName> -p MyUglyRocks.Infrastructure -s MyUglyRocks.Api
dotnet ef database update -p MyUglyRocks.Infrastructure -s MyUglyRocks.Api
```

### Building

```bash
# Backend
cd src/api && dotnet build

# Frontend
cd src/web && npm run build
```

## Documentation

See the [docs/](docs/) folder for complete specifications:
- [Product Requirements](docs/01-PRD.md)
- [User Stories](docs/02-USER-STORIES.md)
- [Data Model](docs/04-DATA-MODEL.md)
- [API Spec](docs/05-API-SPEC.md)
- [Architecture](docs/06-ARCHITECTURE.md)
- [Development Roadmap](docs/09-DEV-ROADMAP.md)

## Environment Configuration

### Local Development
- Copy `.env.local.example` to `.env.local` in `src/web/`
- The API port is defined in `src/api/MyUglyRocks.Api/Properties/launchSettings.json`
- Docker services are defined in `docker-compose.yml`

### Production (Railway)
In production, environment variables are set via Railway's dashboard:

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://api.myuglyrocks.com` | Production API URL |
| `DATABASE_URL` | `postgres://...` | Railway-managed PostgreSQL |
| `REDIS_URL` | `redis://...` | Railway-managed Redis |
| `CLOUDFLARE_R2_*` | `...` | R2 bucket credentials |

> **Why no localhost issues in prod?** The frontend and API run on separate Railway services with public URLs. No ports to configure - Railway handles routing automatically.

## Secrets Management

This project uses **Kubernetes Secrets** for secrets management in the K8s environment, and **environment variables** for local Docker Compose development.

### Kubernetes (Development/Production)

Secrets are stored in K8s secrets and injected as environment variables. See `k8s/base/app-secrets.yaml.example` for the required secrets:

```bash
# Create the secrets (copy and edit the example file first)
kubectl apply -f k8s/base/app-secrets.yaml
```

### Docker Compose (Local Development)

Copy `.env.example` to `.env` and fill in your values. Default values are provided for local development.
