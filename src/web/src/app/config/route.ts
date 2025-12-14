import { NextRequest, NextResponse } from 'next/server';

// Allowlist of known public domains that should use same-origin API URLs
const ALLOWED_PUBLIC_HOSTS = [
  'dev.myuglyrocks.com',
  'www.myuglyrocks.com',
  'myuglyrocks.com',
];

// Runtime config endpoint - reads environment variables at runtime
// This allows changing API_URL without rebuilding the Docker image
//
// IMPORTANT: When accessed via Cloudflare Tunnel (e.g., dev.myuglyrocks.com),
// we return the same origin as the API URL to ensure cookies work correctly.
// The nginx-ingress handles routing /api to the API service.
export async function GET(request: NextRequest) {
  // Get the host from request headers (strip port if present)
  const hostHeader = request.headers.get('host');
  const host = hostHeader?.split(':')[0]?.toLowerCase();

  // Parse origin to extract hostname (handles full URLs like "https://dev.myuglyrocks.com")
  const originHeader = request.headers.get('origin');
  let originHost: string | null = null;
  if (originHeader) {
    try {
      originHost = new URL(originHeader).hostname.toLowerCase();
    } catch {
      // Invalid origin URL, ignore
    }
  }

  // If accessing via a known public domain (exact match), use that as the API URL
  // This ensures cookies stay same-origin (critical for SameSite=Lax)
  if ((host && ALLOWED_PUBLIC_HOSTS.includes(host)) ||
      (originHost && ALLOWED_PUBLIC_HOSTS.includes(originHost))) {
    const matchedHost = host && ALLOWED_PUBLIC_HOSTS.includes(host) ? host : originHost;
    // Defensive check (should never be null given the conditional above)
    if (!matchedHost) {
      return NextResponse.json({ apiUrl: '' });
    }
    return NextResponse.json({
      apiUrl: `https://${matchedHost}`,
    });
  }

  // For local/NodePort access, use the configured API_URL (empty = relative URLs)
  return NextResponse.json({
    apiUrl: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || '',
  });
}
