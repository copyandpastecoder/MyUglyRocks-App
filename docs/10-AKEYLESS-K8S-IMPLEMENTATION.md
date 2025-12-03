# Akeyless Kubernetes Implementation Plan

This document outlines the implementation plan for integrating Akeyless secrets management with Kubernetes, providing secure, zero-credential authentication for both development and production environments.

## Overview

The recommended approach uses **Akeyless K8s Auth Method** which authenticates applications using Kubernetes Service Account JWT tokens. This eliminates the need for static credentials in the application, as the Kubernetes platform itself becomes the authentication mechanism.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Kubernetes Cluster                          │
│                                                                     │
│  ┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐  │
│  │  MyUglyRocks    │────▶│ Akeyless        │────▶│  Akeyless    │  │
│  │  API Pod        │     │ Gateway         │     │  SaaS        │  │
│  │                 │     │ (in-cluster)    │     │              │  │
│  │ Service Account │     └─────────────────┘     └──────────────┘  │
│  │ JWT Token       │                                               │
│  └─────────────────┘                                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Benefits

1. **Zero Static Credentials** - No API keys or access tokens stored in code or environment variables
2. **Automatic Rotation** - K8s Service Account tokens are short-lived and auto-rotated
3. **Audit Trail** - All secret access is logged with pod identity
4. **Dev/Prod Parity** - Same authentication mechanism in all environments
5. **Platform Native** - Leverages Kubernetes built-in identity system

---

## Phase 1: Akeyless Console Configuration

### 1.1 Create K8s Auth Method in Akeyless

1. Log in to Akeyless Console (https://console.akeyless.io)
2. Navigate to **Access Permissions** → **Auth Methods**
3. Click **New** → **Kubernetes**
4. Configure:
   - **Name**: `k8s-myuglyrocks-dev` (create one for each environment)
   - **K8s Host**: Your cluster API server URL
   - **K8s CA Certificate**: Your cluster's CA certificate (base64 encoded)
   - **Token Reviewer JWT**: A JWT from a service account with `system:auth-delegator` role
   - **Bound Namespaces**: `myuglyrocks` (or your namespace)
   - **Bound Service Account Names**: `myuglyrocks-api`

### 1.2 Create Access Role

1. Navigate to **Access Permissions** → **Access Roles**
2. Create role: `myuglyrocks-dev-role`
3. Associate the K8s Auth Method created above
4. Grant access to secrets:
   - `/myuglyrocks/dev/*` - Read access

### 1.3 Repeat for Production

Create separate auth method and role for production:
- Auth Method: `k8s-myuglyrocks-prod`
- Role: `myuglyrocks-prod-role`
- Secret path: `/myuglyrocks/prod/*`

---

## Phase 2: Kubernetes Cluster Setup

### 2.1 Development Environment (Docker Desktop K8s)

Enable Kubernetes in Docker Desktop:
1. Open Docker Desktop → Settings → Kubernetes
2. Check "Enable Kubernetes"
3. Click "Apply & Restart"

### 2.2 Create Namespace and Service Account

```yaml
# k8s/base/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: myuglyrocks
---
# k8s/base/service-account.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: myuglyrocks-api
  namespace: myuglyrocks
```

### 2.3 Deploy Akeyless Gateway

```yaml
# k8s/base/akeyless-gateway.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: akeyless-gateway
  namespace: myuglyrocks
spec:
  replicas: 1
  selector:
    matchLabels:
      app: akeyless-gateway
  template:
    metadata:
      labels:
        app: akeyless-gateway
    spec:
      containers:
      - name: gateway
        image: akeyless/base:latest-akeyless
        ports:
        - containerPort: 8000
          name: web
        - containerPort: 8081
          name: api
        env:
        - name: ADMIN_ACCESS_ID
          valueFrom:
            secretKeyRef:
              name: akeyless-admin-creds
              key: access-id
        - name: ADMIN_ACCESS_KEY
          valueFrom:
            secretKeyRef:
              name: akeyless-admin-creds
              key: access-key
        readinessProbe:
          httpGet:
            path: /status
            port: 8081
          initialDelaySeconds: 30
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /status
            port: 8081
          initialDelaySeconds: 60
          periodSeconds: 30
---
apiVersion: v1
kind: Service
metadata:
  name: akeyless-gateway
  namespace: myuglyrocks
spec:
  selector:
    app: akeyless-gateway
  ports:
  - name: api
    port: 8081
    targetPort: 8081
  - name: web
    port: 8000
    targetPort: 8000
```

### 2.4 Create Admin Credentials Secret (Bootstrap Only)

This secret is only needed for Gateway admin access, not for application authentication:

```bash
kubectl create secret generic akeyless-admin-creds \
  --namespace myuglyrocks \
  --from-literal=access-id=p-xxxxxxxxxx \
  --from-literal=access-key=xxxxxxxxxxxx
```

---

## Phase 3: Application Code Changes

### 3.1 Update AkeylessConfigurationProvider

Replace CLI-based authentication with K8s Auth:

```csharp
// Configuration/AkeylessConfigurationProvider.cs
public class AkeylessConfigurationProvider : ConfigurationProvider
{
    private readonly AkeylessConfigurationSource _source;
    private readonly HttpClient _httpClient;

    public AkeylessConfigurationProvider(AkeylessConfigurationSource source)
    {
        _source = source;
        _httpClient = new HttpClient();
    }

    public override void Load()
    {
        var token = AuthenticateWithK8s();
        if (string.IsNullOrEmpty(token))
        {
            Console.WriteLine("[Akeyless] K8s authentication failed");
            return;
        }

        foreach (var mapping in SecretMappings)
        {
            var secretName = BuildSecretName(mapping.Key);
            var value = GetSecret(token, secretName);
            if (!string.IsNullOrWhiteSpace(value))
            {
                Data[mapping.Value] = value;
            }
        }
    }

    private string? AuthenticateWithK8s()
    {
        // Read the service account token from the mounted volume
        const string tokenPath = "/var/run/secrets/kubernetes.io/serviceaccount/token";

        if (!File.Exists(tokenPath))
        {
            Console.WriteLine("[Akeyless] K8s service account token not found");
            return null;
        }

        var k8sJwt = File.ReadAllText(tokenPath);

        var authRequest = new
        {
            access_type = "k8s",
            k8s_auth_config_name = _source.K8sAuthConfigName, // e.g., "k8s-myuglyrocks-dev"
            k8s_service_account_token = k8sJwt,
            gateway_url = _source.GatewayUrl
        };

        var response = _httpClient.PostAsJsonAsync(
            $"{_source.GatewayUrl}/auth",
            authRequest
        ).Result;

        if (!response.IsSuccessStatusCode)
            return null;

        var result = response.Content.ReadFromJsonAsync<AuthResponse>().Result;
        return result?.Token;
    }

    private string? GetSecret(string token, string secretName)
    {
        var request = new
        {
            name = secretName,
            token = token
        };

        var response = _httpClient.PostAsJsonAsync(
            $"{_source.GatewayUrl}/get-secret-value",
            request
        ).Result;

        if (!response.IsSuccessStatusCode)
            return null;

        var result = response.Content.ReadFromJsonAsync<SecretResponse>().Result;
        return result?.Value;
    }
}
```

### 3.2 Update Configuration Source

```csharp
public class AkeylessConfigurationSource : IConfigurationSource
{
    public string GatewayUrl { get; set; } = "http://akeyless-gateway:8081";
    public string K8sAuthConfigName { get; set; } = "k8s-myuglyrocks-dev";
    public string SecretPath { get; set; } = "/myuglyrocks/dev";

    public IConfigurationProvider Build(IConfigurationBuilder builder)
        => new AkeylessConfigurationProvider(this);
}
```

### 3.3 Update Program.cs

```csharp
// Remove credential-based configuration
var akeylessGatewayUrl = builder.Configuration["Akeyless:GatewayUrl"]
    ?? "http://akeyless-gateway:8081";
var akeylessAuthConfig = builder.Configuration["Akeyless:K8sAuthConfigName"]
    ?? (builder.Environment.IsProduction() ? "k8s-myuglyrocks-prod" : "k8s-myuglyrocks-dev");
var akeylessSecretPath = builder.Configuration["Akeyless:SecretPath"]
    ?? (builder.Environment.IsProduction() ? "/myuglyrocks/prod" : "/myuglyrocks/dev");

builder.Configuration.AddAkeyless(akeylessGatewayUrl, akeylessAuthConfig, akeylessSecretPath);
```

---

## Phase 4: Kubernetes Deployment

### 4.1 API Deployment Manifest

```yaml
# k8s/base/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myuglyrocks-api
  namespace: myuglyrocks
spec:
  replicas: 2
  selector:
    matchLabels:
      app: myuglyrocks-api
  template:
    metadata:
      labels:
        app: myuglyrocks-api
    spec:
      serviceAccountName: myuglyrocks-api  # Uses K8s auth
      containers:
      - name: api
        image: myuglyrocks-api:latest
        ports:
        - containerPort: 8080
        env:
        - name: ASPNETCORE_ENVIRONMENT
          value: "Development"  # or "Production"
        - name: Akeyless__GatewayUrl
          value: "http://akeyless-gateway:8081"
        - name: Akeyless__K8sAuthConfigName
          value: "k8s-myuglyrocks-dev"
        - name: Akeyless__SecretPath
          value: "/myuglyrocks/dev"
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: myuglyrocks-api
  namespace: myuglyrocks
spec:
  selector:
    app: myuglyrocks-api
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
```

### 4.2 Kustomize Structure

```
k8s/
├── base/
│   ├── kustomization.yaml
│   ├── namespace.yaml
│   ├── service-account.yaml
│   ├── akeyless-gateway.yaml
│   ├── api-deployment.yaml
│   ├── postgres-deployment.yaml
│   └── redis-deployment.yaml
├── overlays/
│   ├── dev/
│   │   ├── kustomization.yaml
│   │   └── patches/
│   │       └── api-env.yaml
│   └── prod/
│       ├── kustomization.yaml
│       └── patches/
│           └── api-env.yaml
```

---

## Phase 5: CI/CD Integration

### 5.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Kubernetes

on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Build and push Docker image
      run: |
        docker build -t myuglyrocks-api:${{ github.sha }} ./src/api
        # Push to your container registry

    - name: Deploy to Kubernetes
      uses: azure/k8s-deploy@v4
      with:
        namespace: myuglyrocks
        manifests: |
          k8s/overlays/prod/
        images: |
          myuglyrocks-api:${{ github.sha }}
```

---

## Phase 6: Dockerfile Updates

Remove Akeyless CLI from Dockerfile (no longer needed with K8s Auth):

```dockerfile
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["MyUglyRocks.Api/MyUglyRocks.Api.csproj", "MyUglyRocks.Api/"]
COPY ["MyUglyRocks.Core/MyUglyRocks.Core.csproj", "MyUglyRocks.Core/"]
COPY ["MyUglyRocks.Infrastructure/MyUglyRocks.Infrastructure.csproj", "MyUglyRocks.Infrastructure/"]
COPY ["MyUglyRocks.Abstractions/MyUglyRocks.Abstractions.csproj", "MyUglyRocks.Abstractions/"]
RUN dotnet restore "MyUglyRocks.Api/MyUglyRocks.Api.csproj"
COPY . .
WORKDIR /src/MyUglyRocks.Api
RUN dotnet publish -c Release -o /app/publish

# Runtime stage - simplified, no CLI needed
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "MyUglyRocks.Api.dll"]
```

---

## Implementation Checklist

### Akeyless Console Setup
- [ ] Create K8s Auth Method for dev environment
- [ ] Create K8s Auth Method for prod environment
- [ ] Create Access Role for dev with secret permissions
- [ ] Create Access Role for prod with secret permissions
- [ ] Configure Token Reviewer in each auth method

### Kubernetes Setup
- [ ] Enable Kubernetes in Docker Desktop (dev)
- [ ] Create namespace manifest
- [ ] Create service account manifest
- [ ] Create Akeyless Gateway deployment
- [ ] Create admin credentials secret (bootstrap)
- [ ] Create API deployment manifest
- [ ] Create PostgreSQL and Redis deployments
- [ ] Set up Kustomize overlays

### Application Code
- [ ] Update AkeylessConfigurationProvider for K8s Auth
- [ ] Update AkeylessConfigurationSource
- [ ] Update Program.cs
- [ ] Remove CLI from Dockerfile
- [ ] Add health check endpoint

### CI/CD
- [ ] Set up container registry
- [ ] Create GitHub Actions workflow
- [ ] Configure Kubernetes credentials in GitHub Secrets

### Testing
- [ ] Test locally with Docker Desktop K8s
- [ ] Verify secret retrieval works
- [ ] Test pod restart and re-authentication
- [ ] Load test with multiple replicas

---

## Alternative: CSI Driver Approach

If you prefer secrets mounted as files rather than fetched at runtime:

```yaml
# Using Akeyless CSI Driver
apiVersion: v1
kind: Pod
metadata:
  name: myuglyrocks-api
spec:
  serviceAccountName: myuglyrocks-api
  containers:
  - name: api
    image: myuglyrocks-api:latest
    volumeMounts:
    - name: secrets
      mountPath: /mnt/secrets
      readOnly: true
  volumes:
  - name: secrets
    csi:
      driver: secrets-store.csi.k8s.io
      readOnly: true
      volumeAttributes:
        secretProviderClass: myuglyrocks-secrets
```

This approach mounts secrets as files, which can be read by the application. Useful for apps that expect secrets in specific file locations.

---

## Security Considerations

1. **Namespace Isolation** - Each environment should have its own namespace
2. **RBAC** - Limit which service accounts can authenticate
3. **Network Policies** - Restrict traffic to Akeyless Gateway
4. **Secret Rotation** - K8s tokens auto-rotate; ensure app handles token refresh
5. **Audit Logging** - Enable Akeyless audit logs for compliance

---

## References

- [Akeyless K8s Auth Documentation](https://docs.akeyless.io/docs/kubernetes-auth)
- [Akeyless Gateway Installation](https://docs.akeyless.io/docs/gateway-installation)
- [Akeyless CSI Driver](https://docs.akeyless.io/docs/csi-driver)
- [Kubernetes Service Account Tokens](https://kubernetes.io/docs/concepts/security/service-accounts/)
