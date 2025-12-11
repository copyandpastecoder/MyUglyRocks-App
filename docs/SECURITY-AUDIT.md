# Security Audit Report

**Date:** December 2024
**Scope:** Full application security review (API + Web + Infrastructure)
**Status:** Issues identified, remediation in progress

---

## Executive Summary

This document contains security findings from a comprehensive audit of the MyUglyRocks application, covering both OWASP Top 10 vulnerabilities and general security issues across the .NET API, Next.js frontend, and Kubernetes infrastructure.

**Total Issues Found:** 20
- Critical/High: 6
- Medium: 7
- Low: 7

---

## Priority 1: Critical/High (Fix Immediately)

### 1. Exception Messages Exposed to Users

**Severity:** High
**Category:** Information Disclosure
**Status:** ✅ Fixed

**Affected Files:**
- `src/api/MyUglyRocks.Api/Controllers/AdminController.cs`
- `src/api/MyUglyRocks.Api/Controllers/ExportController.cs`
- `src/api/MyUglyRocks.Api/Controllers/PhotosController.cs`
- `src/api/MyUglyRocks.Api/Controllers/PostsController.cs`

**Issue:**
Exception messages are returned directly to clients via `ex.Message`, revealing internal system details, stack traces, database structure, and file paths.

**Example:**
```csharp
return BadRequest(new { message = ex.Message });
return BadRequest(new UploadPhotoResponse(false, Error: $"Failed to upload photo: {ex.Message}"));
```

**Impact:**
Attackers can gather reconnaissance information about internal implementation.

**Remediation:**
1. Implement centralized exception handling middleware
2. Log detailed errors internally
3. Return generic user-friendly messages to clients
4. Create specific exception types for business logic errors

---

### 2. Hangfire Dashboard Unprotected

**Severity:** High
**Category:** Access Control
**Status:** ✅ Fixed

**Affected File:** `src/api/MyUglyRocks.Api/Program.cs` (line ~285)

**Issue:**
Hangfire Dashboard is mapped without authentication:
```csharp
if (app.Environment.IsDevelopment())
{
    app.MapHangfireDashboard("/hangfire");
}
```

**Impact:**
- Full access to job execution history
- Ability to retry/delete jobs
- System task enumeration

**Remediation:**
```csharp
app.MapHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = new[] { new HangfireAuthorizationFilter() }
});
```

---

### 3. Missing Pagination Parameter Validation

**Severity:** High
**Category:** Input Validation / DoS
**Status:** ✅ Fixed

**Affected Files:**
- `src/api/MyUglyRocks.Api/Controllers/PostsController.cs`
- `src/api/MyUglyRocks.Api/Controllers/AdminController.cs`

**Issue:**
`skip` and `take`/`pageSize` parameters have no maximum value validation:
```csharp
public async Task<ActionResult<IEnumerable<PostListDto>>> GetPosts(
    [FromQuery] int skip = 0,
    [FromQuery] int take = 20)  // No max limit
```

**Impact:**
- Resource exhaustion attacks (memory, database)
- Full database enumeration in single request
- Bypass pagination-based rate limiting

**Remediation:**
```csharp
if (skip < 0) skip = 0;
if (take < 1) take = 1;
if (take > 100) take = 100;  // Enforce maximum
```

---

### 4. Redis No Authentication

**Severity:** High
**Category:** Infrastructure Security
**Status:** ✅ Fixed

**Affected File:** `k8s/base/redis-deployment.yaml`

**Issue:**
Redis deployed without authentication:
```yaml
command:
  - redis-server
  - --maxmemory
  - "128mb"
  # Missing: --requirepass
```

**Impact:**
- In-cluster access to all cached data
- Read/modify password reset tokens
- Session data exposure

**Remediation:**
```yaml
command:
  - redis-server
  - --requirepass
  - $(REDIS_PASSWORD)
  - --maxmemory
  - "128mb"
env:
  - name: REDIS_PASSWORD
    valueFrom:
      secretKeyRef:
        name: myuglyrocks-secrets
        key: redis-password
```

---

### 5. PostgreSQL No Encryption

**Severity:** High
**Category:** Data in Transit
**Status:** Open

**Affected File:** `k8s/base/postgres-deployment.yaml`

**Issue:**
Database connections are unencrypted within the cluster.

**Impact:**
- Credentials transmitted in plaintext
- Network sniffing possible
- Data interception risk

**Remediation:**
1. Generate SSL certificates for PostgreSQL
2. Enable SSL: `ssl=on ssl_cert_file=/etc/postgres/certs/server.crt`
3. Require SSL in connection strings
4. Add NetworkPolicy to restrict access

---

### 6. Secrets in Environment Variables

**Severity:** High
**Category:** Secret Management
**Status:** Open

**Affected File:** `k8s/base/api-deployment.yaml`

**Issue:**
Secrets exposed via environment variables can leak through:
- Process listings (`ps aux`)
- Pod describe output
- Container escape scenarios

**Remediation:**
1. Mount secrets as volumes instead of env vars
2. Add `securityContext.readOnlyRootFilesystem: true`
3. Implement secret rotation
4. Audit secret access

---

## Priority 2: Medium (Fix This Week)

### 7. No Sort Parameter Validation

**Severity:** Medium
**Category:** Input Validation
**Status:** ✅ Fixed

**Affected File:** `src/api/MyUglyRocks.Api/Controllers/PostsController.cs`

**Issue:**
The `sort` query parameter has no whitelist validation.

**Remediation:**
```csharp
private static readonly HashSet<string> AllowedSortFields = new(StringComparer.OrdinalIgnoreCase)
{
    "newest", "oldest", "popular", "trending"
};

if (!string.IsNullOrEmpty(sort) && !AllowedSortFields.Contains(sort))
{
    return BadRequest(new { error = "Invalid sort parameter" });
}
```

---

### 8. Insufficient Rate Limiting

**Severity:** Medium
**Category:** Abuse Prevention
**Status:** Open

**Affected File:** `src/api/MyUglyRocks.Api/Program.cs`

**Issue:**
- 100 req/min limit not applied to all endpoints
- No per-user rate limiting
- No tiered limits for authenticated vs public endpoints

**Remediation:**
1. Apply `[EnableRateLimiting("api")]` to all controllers
2. Implement per-user limits using JWT claims
3. Add stricter limits for resource-intensive operations

---

### 9. Missing CSRF Protection

**Severity:** Medium
**Category:** Cross-Site Request Forgery
**Status:** Open

**Affected File:** `src/api/MyUglyRocks.Api/Program.cs`

**Issue:**
No CSRF token validation for state-changing operations despite `AllowCredentials()` in CORS.

**Remediation:**
1. Implement CSRF token validation
2. Use custom headers (e.g., `X-CSRF-Token`)
3. Verify SameSite cookie attributes

---

### 10. Access Token in Memory

**Severity:** Medium
**Category:** Token Security
**Status:** Open

**Affected File:** `src/web/src/lib/api.ts`

**Issue:**
Access token stored in module-level JavaScript variable:
```typescript
let accessToken: string | null = null;
```

**Impact:**
- Vulnerable to XSS attacks
- Memory dump exposure

**Remediation:**
1. Consider httpOnly cookie storage
2. Implement token masking
3. Ensure strict CSP headers

---

### 11. Session Hijacking Risk

**Severity:** Medium
**Category:** Session Security
**Status:** Open

**Affected File:** `src/api/MyUglyRocks.Api/Controllers/SessionController.cs`

**Issue:**
Session heartbeat may not fully validate session ownership.

**Remediation:**
1. Validate session belongs to authenticated user
2. Use unpredictable session IDs (UUID v4)
3. Check user_id in session record

---

### 12. Missing K8s NetworkPolicy

**Severity:** Medium
**Category:** Network Security
**Status:** ✅ Fixed

**Affected Location:** `k8s/base/`

**Issue:**
No NetworkPolicy manifests to restrict pod-to-pod traffic.

**Impact:**
- Unrestricted lateral movement after compromise
- Any pod can communicate with any other pod

**Remediation:**
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: myuglyrocks-network-policy
  namespace: myuglyrocks
spec:
  podSelector:
    matchLabels:
      app: myuglyrocks-api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: myuglyrocks-web
    ports:
    - protocol: TCP
      port: 8080
```

---

### 13. No Pod Security Standards

**Severity:** Medium
**Category:** Container Security
**Status:** ✅ Fixed

**Affected Files:** All K8s deployment manifests

**Issue:**
Deployments allow privileged containers and arbitrary capabilities.

**Remediation:**
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop:
    - ALL
```

---

## Priority 3: Low (Fix This Month)

### 14. Filename Information Leak

**Severity:** Low
**Category:** Information Disclosure
**Status:** ✅ Fixed

**Affected File:** `src/api/MyUglyRocks.Api/Controllers/PhotosController.cs`

**Issue:**
Original filenames stored, revealing user file system information.

**Remediation:**
```csharp
FileName = $"{photoId:N}{Path.GetExtension(file.FileName)}"
```

---

### 15. PII in Logs

**Severity:** Low
**Category:** Data Protection / Compliance
**Status:** ✅ Fixed

**Affected Files:**
- `src/api/MyUglyRocks.Core/Services/AuthService.cs`
- `src/api/MyUglyRocks.Core/Services/EmailService.cs`

**Issue:**
User emails logged in plaintext:
```csharp
_logger.LogInformation("Email sent successfully: {Subject} to {To}", subject, to);
```

**Impact:**
PII exposure in logs, GDPR/compliance issues.

**Remediation:**
```csharp
_logger.LogInformation("Email sent: {Subject} to {UserHash}", subject, HashEmail(to));
```

---

### 16. Username Not Validated

**Severity:** Low
**Category:** Input Validation
**Status:** ✅ Fixed

**Affected File:** `src/api/MyUglyRocks.Api/Controllers/PostsController.cs`

**Issue:**
Username parameter has no validation for length or format.

**Remediation:**
```csharp
if (string.IsNullOrWhiteSpace(username) || username.Length > 255)
    return BadRequest("Invalid username");
```

---

### 17. No Dependency Vulnerability Scanning

**Severity:** Low
**Category:** Supply Chain Security
**Status:** ✅ Fixed

**Affected Files:** All `package.json` and `.csproj` files

**Issue:**
No automated dependency vulnerability scanning configured.

**Remediation:**
1. Enable GitHub Dependabot
2. Run `dotnet list package --vulnerable` in CI
3. Run `npm audit` in CI
4. Create baseline for acceptable vulnerabilities

---

### 18. CSP Headers (API)

**Severity:** Low
**Category:** Security Headers
**Status:** Resolved

**Note:** CSP is correctly configured as restrictive for API:
```csharp
"default-src 'none'; frame-ancestors 'none'; form-action 'none'"
```

---

### 19. K8s Audit Logging

**Severity:** Low
**Category:** Monitoring
**Status:** Open

**Issue:**
No K8s API audit logging configured at cluster level.

**Remediation:**
Enable audit logging at Kubernetes cluster level.

---

### 20. Missing Resource Limits

**Severity:** Low
**Category:** Availability
**Status:** Open

**Affected Files:** K8s deployment manifests

**Issue:**
Some deployments may lack CPU/memory limits.

**Remediation:**
```yaml
resources:
  limits:
    cpu: "500m"
    memory: "512Mi"
  requests:
    cpu: "100m"
    memory: "128Mi"
```

---

## Previously Fixed (OWASP)

The following OWASP-related issues were addressed in prior commits:

| Issue | Status | Commit |
|-------|--------|--------|
| IDOR in SessionController | Fixed | `ec75ccd` |
| Failed login tracking | Fixed | `ec75ccd` |
| Backend password validation | Fixed | `ec75ccd` |
| K8s environment (Development → Production) | Fixed | `ec75ccd` |
| AllowedHosts wildcard | Fixed | `ec75ccd` |
| CSP/HSTS headers | Fixed | `ec75ccd` |
| CORS configuration | Fixed | `ec75ccd` |
| DTO validation attributes | Fixed | `5ce80af` |

---

## Remediation Checklist

### Immediate (This Week)
- [x] Add pagination parameter validation to all list endpoints
- [x] Implement centralized exception handling
- [x] Add authentication to Hangfire dashboard
- [x] Enable Redis authentication
- [x] Add Pod Security Standards to deployments

### Short-term (2 Weeks)
- [ ] Configure PostgreSQL SSL/TLS
- [ ] Implement per-user rate limiting
- [x] Add K8s NetworkPolicy
- [ ] Implement CSRF token validation
- [x] Add input validation to query parameters (sort, username)

### Medium-term (1 Month)
- [ ] Move secrets from env vars to volume mounts
- [x] Implement PII masking in logs
- [x] Set up dependency vulnerability scanning
- [ ] Enhance session security validation
- [x] Add resource limits to all deployments (already in place)
- [x] Fix filename information leak

---

## Contact

For questions about this security audit, contact the development team.
