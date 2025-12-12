# Deployment Notes - Action Required

## Rate Limiting Configuration

The API uses a sliding window rate limiter to prevent abuse while allowing normal usage patterns.

### Current Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| General API | 600 requests | per minute |
| Intensive Operations (uploads, exports) | 30 requests | per minute |

### How It Works

- **Authenticated users**: Rate limited by user ID
- **Anonymous users**: Rate limited by IP address
- **Sliding window**: Smoother than fixed window, allows bursts up to limit
- **429 Response**: Returned when limit exceeded, includes `Retry-After` header

### Adjusting Limits

Edit `src/api/MyUglyRocks.Api/Program.cs` rate limiter configuration:

```csharp
// General API limit
PermitLimit = 600,  // requests per window
Window = TimeSpan.FromMinutes(1),
SegmentsPerWindow = 6,  // 10-second segments

// Intensive operations
PermitLimit = 30,
Window = TimeSpan.FromMinutes(1),
```

After changes, rebuild and redeploy the API.

---

## API Secrets Migration (Security Fix #6)

API secrets are now mounted as files instead of environment variables. This is more secure.

### Steps to Deploy:

1. **Create the new API secrets:**
   ```bash
   kubectl create secret generic myuglyrocks-api-secrets -n myuglyrocks \
     --from-literal=db-connection-string="Host=postgres;Database=myuglyrocks;Username=postgres;Password=YOUR_PASSWORD;SSL Mode=Require;Trust Server Certificate=true" \
     --from-literal=redis-connection-string="redis:6379,password=YOUR_REDIS_PASSWORD" \
     --from-literal=jwt-secret="YOUR_JWT_SECRET" \
     --from-literal=r2-account-id="YOUR_R2_ACCOUNT" \
     --from-literal=r2-access-key-id="YOUR_R2_KEY" \
     --from-literal=r2-secret-access-key="YOUR_R2_SECRET" \
     --from-literal=r2-bucket-name="YOUR_BUCKET" \
     --from-literal=r2-public-url="YOUR_R2_PUBLIC_URL" \
     --from-literal=resend-api-key="YOUR_RESEND_KEY"
   ```

2. **Rebuild and deploy the API:**
   ```bash
   docker build -t myuglyrocks-api:latest -f src/api/MyUglyRocks.Api/Dockerfile .
   kubectl apply -f k8s/base/api-deployment.yaml
   kubectl rollout restart deployment myuglyrocks-api -n myuglyrocks
   ```

3. **Verify secrets are mounted:**
   ```bash
   kubectl exec -it deployment/myuglyrocks-api -n myuglyrocks -- ls -la /etc/secrets/
   ```

See `k8s/base/api-secrets.yaml.example` for the full secret format.

---

## PostgreSQL SSL Changes (Security Fix #5)

PostgreSQL now requires SSL/TLS encrypted connections. You need to update your secrets before deploying.

### Steps to Deploy:

1. **Apply the new SSL ConfigMap:**
   ```bash
   kubectl apply -f k8s/base/postgres-ssl-config.yaml
   ```

2. **Update your Kubernetes secret with SSL-enabled connection string:**
   ```bash
   # Delete existing secret (backup first if needed)
   kubectl delete secret myuglyrocks-secrets -n myuglyrocks

   # Create new secret with SSL connection string
   kubectl create secret generic myuglyrocks-secrets -n myuglyrocks \
     --from-literal=postgres-password="YOUR_PASSWORD" \
     --from-literal=db-connection-string="Host=postgres;Database=myuglyrocks;Username=postgres;Password=YOUR_PASSWORD;SSL Mode=Require;Trust Server Certificate=true" \
     --from-literal=redis-password="YOUR_REDIS_PASSWORD" \
     --from-literal=redis-connection-string="redis:6379,password=YOUR_REDIS_PASSWORD" \
     --from-literal=jwt-secret="YOUR_JWT_SECRET" \
     --from-literal=r2-account-id="YOUR_R2_ACCOUNT" \
     --from-literal=r2-access-key-id="YOUR_R2_KEY" \
     --from-literal=r2-secret-access-key="YOUR_R2_SECRET" \
     --from-literal=r2-bucket-name="YOUR_BUCKET" \
     --from-literal=r2-public-url="YOUR_R2_PUBLIC_URL" \
     --from-literal=resend-api-key="YOUR_RESEND_KEY"
   ```

3. **Apply the updated PostgreSQL deployment:**
   ```bash
   kubectl apply -f k8s/base/postgres-deployment.yaml
   ```

4. **Wait for PostgreSQL to restart:**
   ```bash
   kubectl rollout status deployment postgres -n myuglyrocks
   ```

5. **Restart the API to pick up the new connection string:**
   ```bash
   kubectl rollout restart deployment myuglyrocks-api -n myuglyrocks
   ```

6. **Verify SSL is working:**
   ```bash
   # Check PostgreSQL logs for SSL connections
   kubectl logs -l app=postgres -n myuglyrocks | grep -i ssl
   ```

### Key Changes:
- `k8s/base/postgres-ssl-config.yaml` - New ConfigMap with SSL certs generation script
- `k8s/base/postgres-deployment.yaml` - Updated with SSL init container and config mounts
- Connection strings now require `SSL Mode=Require;Trust Server Certificate=true`

### Troubleshooting:

**If API can't connect to database:**
```bash
# Check postgres pod status
kubectl get pods -n myuglyrocks -l app=postgres

# Check init container logs (SSL cert generation)
kubectl logs -l app=postgres -n myuglyrocks -c generate-ssl-certs

# Check postgres container logs
kubectl logs -l app=postgres -n myuglyrocks -c postgres
```

**If SSL cert generation fails:**
```bash
# Delete and recreate the postgres pod
kubectl delete pod -l app=postgres -n myuglyrocks
```
