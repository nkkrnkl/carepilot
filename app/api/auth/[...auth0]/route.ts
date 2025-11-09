/**
 * Auth0 API Route Handler
 * Handles all Auth0 authentication routes: /api/auth/login, /api/auth/logout, /api/auth/callback
 */

import { handleAuth, handleLogin, handleLogout, handleCallback } from '@auth0/nextjs-auth0';

export const GET = handleAuth({
  login: handleLogin({
    returnTo: '/',
    authorizationParams: {
      audience: process.env.AUTH0_AUDIENCE,
      scope: 'openid profile email',
    },
  }),
  logout: handleLogout({
    returnTo: '/',
  }),
  callback: handleCallback(),
});

