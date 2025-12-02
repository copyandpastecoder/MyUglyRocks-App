# ADR-002: JWT Authentication with httpOnly Cookies

## Status
**Accepted**

## Date
2025-01-XX

## Context

MyUglyRocks needs a secure authentication system that:
- Authenticates users for protected routes and API calls
- Works across frontend (Next.js) and backend (ASP.NET Core) on Railway
- Protects against common web vulnerabilities (XSS, CSRF)
- Supports session management (logout, token refresh)
- Scales without server-side session storage

### Requirements
1. **Stateless backend** - No server-side session storage required
2. **Cross-origin compatible** - Frontend and backend on different domains
3. **XSS resistant** - Tokens not accessible to JavaScript
4. **CSRF resistant** - Protected against cross-site request forgery
5. **Refresh capability** - Long-lived sessions without frequent re-login
6. **Revocation** - Ability to invalidate sessions (logout, password change)

### Options Considered

#### Option A: JWT in httpOnly Cookies
- Tokens stored in httpOnly, Secure, SameSite cookies
- Short-lived access token (15 min) + long-lived refresh token (7 days)
- Refresh tokens stored in Redis for revocation

#### Option B: JWT in localStorage
- Tokens stored in browser localStorage
- Simple implementation
- Vulnerable to XSS attacks

#### Option C: Session-based Authentication
- Server stores session in database/Redis
- Session ID in cookie
- Requires stateful backend

#### Option D: OAuth 2.0 / OpenID Connect Only
- Delegate auth to Google, GitHub, etc.
- No email/password option
- Dependency on third parties

#### Option E: ASP.NET Identity with Cookie Auth
- Built-in session cookies
- Server-side session validation
- Simpler but less scalable

## Decision

**Use JWT tokens stored in httpOnly cookies with refresh token rotation.**

### Implementation Details

```
Authentication Flow:
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Browser   │      │   Next.js   │      │  ASP.NET    │
│             │      │  (Railway)  │      │  (Railway)  │
└──────┬──────┘      └──────┬──────┘      └──────┬──────┘
       │                    │                    │
       │  POST /auth/login  │                    │
       │───────────────────>│                    │
       │                    │  POST /api/v1/auth/login
       │                    │───────────────────>│
       │                    │                    │
       │                    │  Set-Cookie:       │
       │                    │  access_token      │
       │                    │  refresh_token     │
       │                    │<───────────────────│
       │  Set-Cookie        │                    │
       │  (proxied)         │                    │
       │<───────────────────│                    │
       │                    │                    │
       │  GET /api/cycles   │                    │
       │  Cookie: access_token                   │
       │────────────────────────────────────────>│
       │                    │                    │
       │  200 OK + data     │                    │
       │<────────────────────────────────────────│
```

### Token Strategy

| Token | Storage | Lifetime | Purpose |
|-------|---------|----------|---------|
| Access Token | httpOnly cookie | 15 minutes | API authentication |
| Refresh Token | httpOnly cookie + Redis | 7 days | Obtain new access tokens |

### Cookie Configuration

```csharp
// Access token cookie
new CookieOptions
{
    HttpOnly = true,
    Secure = true,           // HTTPS only
    SameSite = SameSiteMode.Lax,  // Allows navigation requests
    Path = "/",
    MaxAge = TimeSpan.FromMinutes(15)
}

// Refresh token cookie
new CookieOptions
{
    HttpOnly = true,
    Secure = true,
    SameSite = SameSiteMode.Strict,  // More restrictive
    Path = "/api/v1/auth",           // Only sent to auth endpoints
    MaxAge = TimeSpan.FromDays(7)
}
```

### JWT Claims

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "username": "rockfan42",
  "role": "User",
  "iat": 1706123456,
  "exp": 1706124356
}
```

## Consequences

### Positive

- **XSS Protection**: httpOnly cookies are not accessible to JavaScript, preventing token theft via XSS
- **Stateless Verification**: Access tokens can be verified without database lookup
- **Revocation Support**: Refresh tokens in Redis enable logout and forced session termination
- **Automatic Sending**: Browser automatically includes cookies, no client-side token management
- **Industry Standard**: Well-understood pattern with extensive documentation

### Negative

- **CSRF Consideration**: Cookies are sent automatically, requiring CSRF protection for mutations
  - Mitigated by: SameSite=Lax/Strict + checking Origin/Referer headers
- **Cross-Domain Complexity**: Requires CORS configuration and proper cookie domain settings
- **Refresh Token Storage**: Requires Redis for revocation list (added infrastructure)
- **Token Size**: JWT in cookie adds ~500 bytes to every request

### Security Measures

| Threat | Mitigation |
|--------|------------|
| XSS Token Theft | httpOnly flag prevents JavaScript access |
| CSRF | SameSite cookies + Origin header validation |
| Token Replay | Short expiry (15 min) + HTTPS only |
| Session Hijacking | Secure flag + refresh token rotation |
| Brute Force | Rate limiting on auth endpoints |
| Password Compromise | Refresh token revocation on password change |

### Refresh Token Rotation

On each refresh:
1. Validate current refresh token against Redis
2. Generate new access token AND new refresh token
3. Invalidate old refresh token in Redis
4. Return new tokens in cookies

This limits the window of opportunity if a refresh token is compromised.

## Alternatives Rejected

### JWT in localStorage
Rejected due to XSS vulnerability. Any JavaScript running on the page (including third-party scripts or XSS payloads) can read localStorage and exfiltrate tokens.

### Session-based Authentication
Rejected because it requires server-side session storage and database lookups for every request. This adds latency and makes horizontal scaling more complex.

### OAuth Only
Rejected because users expect email/password login. OAuth can be added later as an additional option, but shouldn't be the only method.

## Implementation Checklist

- [ ] Configure JWT settings in appsettings.json
- [ ] Implement token generation service
- [ ] Set up Redis for refresh token storage
- [ ] Create auth middleware for JWT validation
- [ ] Implement token refresh endpoint
- [ ] Configure CORS for cross-origin cookies
- [ ] Add rate limiting to auth endpoints
- [ ] Implement logout (clear cookies + revoke refresh token)

## Related Decisions
- [ADR-001-database.md](./ADR-001-database.md) - User data stored in PostgreSQL
- [ADR-004-frontend-framework.md](./ADR-004-frontend-framework.md) - Next.js API routes may proxy auth

## References
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://auth0.com/blog/jwt-security-best-practices/)
- [SameSite Cookies Explained](https://web.dev/samesite-cookies-explained/)
