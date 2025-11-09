/**
 * Auth0 client instance for server-side use
 * Auth0 SDK v4 uses Auth0Client class for all server-side operations
 * 
 * Auth0Client automatically reads from environment variables:
 * - AUTH0_DOMAIN
 * - AUTH0_CLIENT_ID
 * - AUTH0_CLIENT_SECRET
 * - AUTH0_SECRET
 * - APP_BASE_URL (or AUTH0_BASE_URL)
 */

import { Auth0Client } from "@auth0/nextjs-auth0/server";

// Initialize Auth0 client
// It will automatically read configuration from environment variables
export const auth0 = new Auth0Client();

