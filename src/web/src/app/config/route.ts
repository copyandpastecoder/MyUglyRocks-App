import { NextResponse } from 'next/server';

// Runtime config endpoint - reads environment variables at runtime
// This allows changing API_URL without rebuilding the Docker image
// Using API_URL (not NEXT_PUBLIC_) to ensure true runtime reading
export async function GET() {
  return NextResponse.json({
    apiUrl: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://localhost:5000',
  });
}
