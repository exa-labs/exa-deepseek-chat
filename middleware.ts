import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the host from headers
  const host = request.headers.get('host');

  // Check if it's the Vercel deployment
  if (host === 'exa-deepseek-chat.vercel.app') {
    return NextResponse.redirect('https://demo.exa.ai/deepseekchat', {
      status: 301,
    });
  }

  // Allow local development (e.g., localhost) and other environments to proceed normally
  if (host?.includes('localhost') || host?.includes('127.0.0.1')) {
    return NextResponse.next();
  }

  // For all other cases, allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: '/:path*', // Match all paths
};