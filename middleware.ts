import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Auth0 SDK v4 handles authentication routes via /api/auth/* API routes
  // Middleware is optional - authentication checks happen in page components using useUser()
  // We can add custom middleware logic here if needed (e.g., route protection)
  
  const { pathname } = request.nextUrl;
  
  // Pass through all requests
  // Auth0 authentication is handled by the API route at /api/auth/[...auth0]
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"
  ]
};

