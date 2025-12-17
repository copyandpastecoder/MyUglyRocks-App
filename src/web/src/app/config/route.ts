import { NextRequest, NextResponse } from 'next/server';

// All public domains use same-origin API URLs
// Dev: K8s nginx-ingress routes /api to API service
// Prod: Next.js middleware proxies /api to Railway API service (see middleware.ts)
// This enables SameSite=Lax cookies to work without cross-subdomain issues
const SAME_ORIGIN_HOSTS = [
  'dev.myuglyrocks.com',
  'www.myuglyrocks.com',
  'myuglyrocks.com',
];

// Runtime config endpoint - reads environment variables at runtime
// This allows changing API_URL without rebuilding the Docker image
//
// IMPORTANT: All public domains return same-origin API URLs.
// - Dev: nginx-ingress handles routing /api to the API service
// - Prod: Next.js middleware proxies /api to the Railway API service
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

  // Public domains use same-origin API URLs (for SameSite cookie support)
  if ((host && SAME_ORIGIN_HOSTS.includes(host)) ||
      (originHost && SAME_ORIGIN_HOSTS.includes(originHost))) {
    // If host is in the list, use it; otherwise originHost must be (per the condition above)
    const matchedHost = host && SAME_ORIGIN_HOSTS.includes(host) ? host : originHost!;
    return NextResponse.json({
      apiUrl: `https://${matchedHost}`,
    });
  }

  // For local/NodePort access, use the configured API_URL (empty = relative URLs)
  return NextResponse.json({
    apiUrl: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || '',
  });
}
