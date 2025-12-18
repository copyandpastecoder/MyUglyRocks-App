import { NextRequest, NextResponse } from 'next/server';

// Force Node.js runtime (not Edge) for internal DNS resolution
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Proxy handler for all /api/* requests (except /api/config)
async function proxyRequest(request: NextRequest) {
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { error: 'API_URL not configured' },
      { status: 503 }
    );
  }

  // Get the path after /api/
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  const url = new URL(pathname + search, apiUrl);

  // Prepare headers - copy all but problematic headers
  // - host: let fetch use target URL's host
  // - content-length: recalculated by fetch for the body
  // - expect: Node.js undici fetch doesn't support Expect header
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey !== 'host' && lowerKey !== 'content-length' && lowerKey !== 'expect') {
      headers.set(key, value);
    }
  });

  // Add proxy headers for backend logging and CSRF validation
  const originalHost = request.headers.get('host');
  if (originalHost) {
    headers.set('X-Forwarded-Host', originalHost);
  }
  headers.set('X-Forwarded-Proto', 'https');

  // Note: Don't override Host header - let fetch use the target URL's host
  // This avoids TLS/SNI issues with the public URL (api.myuglyrocks.com)

  // Forward client IP if available
  const forwardedFor = request.headers.get('x-forwarded-for');
  const clientIp = forwardedFor?.split(',')[0]?.trim() || request.headers.get('x-real-ip');
  if (clientIp) {
    headers.set('X-Forwarded-For', clientIp);
  }

  try {
    // Forward the request to the backend API
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    // Forward body for methods that support it
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      // Use arrayBuffer to preserve exact bytes
      const buffer = await request.arrayBuffer();
      if (buffer.byteLength > 0) {
        fetchOptions.body = buffer;
      }
    }

    const response = await fetch(url, fetchOptions);

    // Read response body fully (streaming can cause issues)
    const responseBody = await response.arrayBuffer();

    // Headers that must not be forwarded (hop-by-hop or body-encoding related)
    // These become invalid when we convert chunked/compressed response to ArrayBuffer
    const skipHeaders = new Set([
      'transfer-encoding',
      'content-encoding',
      'content-length', // Let NextResponse calculate correct length for our buffer
      'connection',
      'keep-alive',
    ]);

    // Copy response headers (except problematic ones)
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (!skipHeaders.has(key.toLowerCase())) {
        responseHeaders.append(key, value);
      }
    });

    // Return proxied response with fully read body
    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to API' },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  return proxyRequest(request);
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request);
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request);
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request);
}

export async function OPTIONS(request: NextRequest) {
  return proxyRequest(request);
}
