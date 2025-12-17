import { NextRequest, NextResponse } from 'next/server';

// Force Node.js runtime (not Edge) for internal DNS resolution
export const runtime = 'nodejs';

// Proxy handler for all /api/* requests (except /api/config)
async function proxyRequest(request: NextRequest) {
  const apiUrl = process.env.API_URL;

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

  // Prepare headers - copy all but host
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'host') {
      headers.set(key, value);
    }
  });

  try {
    // Forward the request to the backend API
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    // Only include body for methods that support it
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      fetchOptions.body = await request.text();
    }

    const response = await fetch(url, fetchOptions);

    // Copy response headers
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      responseHeaders.append(key, value);
    });

    // Return proxied response
    return new NextResponse(response.body, {
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
