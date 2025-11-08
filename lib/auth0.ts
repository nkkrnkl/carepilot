/**
 * Auth0 client instance for server-side use
 * Auth0 SDK v4 uses Auth0Client class for all server-side operations
 */

import { Auth0Client } from "@auth0/nextjs-auth0/server";

// Initialize Auth0 client with explicit configuration
// This ensures all required environment variables are available
export const auth0 = new Auth0Client({
  // Auth0 will read from environment variables:
  // AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET
  // APP_BASE_URL (required for Auth0 SDK v4)
  appBaseUrl: process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL || "http://localhost:3000",
});

