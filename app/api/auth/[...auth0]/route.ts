/**
 * Auth0 API Route Handler
 * This route handles all Auth0 authentication endpoints
 * GET /api/auth/login - Redirects to Auth0 login
 * GET /api/auth/logout - Logs out the user
 * GET /api/auth/callback - Handles Auth0 callback
 * GET /api/auth/me - Returns user session
 */

import { handleAuth, handleLogin, handleLogout, handleCallback } from '@auth0/nextjs-auth0';

export const GET = handleAuth({
  login: handleLogin({
    authorizationParams: {
      audience: process.env.AUTH0_AUDIENCE || undefined,
      scope: 'openid profile email',
    },
    returnTo: process.env.AUTH0_BASE_URL || 'http://localhost:3000',
  }),
  logout: handleLogout({
    returnTo: process.env.AUTH0_BASE_URL || 'http://localhost:3000',
  }),
  callback: handleCallback(),
});

