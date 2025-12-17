import { NextRequest, NextResponse } from 'next/server';

// Middleware runs at runtime (edge), so it can read runtime environment variables
// This proxies /api/* requests to the backend API for same-origin cookie support
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only proxy /api/* requests (except /api/config which is a Next.js route)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/config')) {
    const apiUrl = process.env.API_URL;

    if (!apiUrl) {
      // No API_URL configured, let Next.js handle it (will 404)
      return NextResponse.next();
    }

    // Build the proxy URL
    const url = new URL(pathname + request.nextUrl.search, apiUrl);

    // Prepare headers - copy all but host
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    });

    // Forward the request to the backend API
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    // Only include body for methods that support it
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      fetchOptions.body = request.body;
      // @ts-expect-error - duplex is required for streaming request bodies in Node 18+
      fetchOptions.duplex = 'half';
    }

    const response = await fetch(url, fetchOptions);

    // Copy response headers, preserving Set-Cookie
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      responseHeaders.append(key, value);
    });

    // Create response with backend's response
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all /api/* routes except /api/config
    '/api/:path*',
  ],
};
