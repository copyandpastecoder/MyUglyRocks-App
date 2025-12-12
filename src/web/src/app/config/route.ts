import { NextRequest, NextResponse } from 'next/server';

// Runtime config endpoint - reads environment variables at runtime
// This allows changing API_URL without rebuilding the Docker image
//
// IMPORTANT: When accessed via Cloudflare Tunnel (e.g., dev.myuglyrocks.com),
// we return the same origin as the API URL to ensure cookies work correctly.
// The nginx-ingress handles routing /api to the API service.
export async function GET(request: NextRequest) {
  // Get the origin from the request headers
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  // If accessing via a known public domain, use that as the API URL
  // This ensures cookies stay same-origin (critical for SameSite=Lax)
  if (host?.includes('dev.myuglyrocks.com') || origin?.includes('dev.myuglyrocks.com')) {
    return NextResponse.json({
      apiUrl: 'https://dev.myuglyrocks.com',
    });
  }

  // For local/NodePort access, use the configured API_URL (empty = relative URLs)
  return NextResponse.json({
    apiUrl: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || '',
  });
}
