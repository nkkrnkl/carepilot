/**
 * Auth0 client instance for server-side use
 * This file provides server-side Auth0 utilities
 */

import { getSession } from '@auth0/nextjs-auth0';

/**
 * Get the current user session (server-side)
 */
export async function getAuth0Session() {
  return getSession();
}

/**
 * Auth0 configuration helper
 * Note: Auth0 SDK v4 uses environment variables directly
 * This file is kept for compatibility and future extensions
 */
export const auth0Config = {
  domain: process.env.AUTH0_DOMAIN || process.env.AUTH0_ISSUER_BASE_URL?.replace('https://', '') || '',
  clientId: process.env.AUTH0_CLIENT_ID || '',
  clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
  baseURL: process.env.AUTH0_BASE_URL || process.env.APP_BASE_URL || 'http://localhost:3000',
  secret: process.env.AUTH0_SECRET || '',
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL || `https://${process.env.AUTH0_DOMAIN || ''}`,
  audience: process.env.AUTH0_AUDIENCE || '',
};

// For backward compatibility, export an auth0 object
export const auth0 = {
  config: auth0Config,
  getSession: getAuth0Session,
};

