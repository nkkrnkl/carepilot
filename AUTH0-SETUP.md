# Auth0 Integration Setup Guide

## Prerequisites

1. Auth0 account with the following credentials:
   - Domain: `dev-mkzc2baz7coa6cg6.us.auth0.com`
   - Client ID: `ooKrOZCVndrxGt4OHcj8iF9VGIqSGSnC`
   - Client Secret: `DPAvrTmgF-hnZEwwPZN2l_iw8YLn0_wPWww2pd_OPCLWFAHBtadMzQjm8_ex3-wv`

## Step 1: Create Environment Variables File

Create a `.env.local` file in the root directory with the following content:

```env
# Auth0 Configuration
AUTH0_SECRET='b87243fb5f48bfa065665382caf3f383a61c22e1b79cddffe8eb230bd0636e11'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://dev-mkzc2baz7coa6cg6.us.auth0.com'
AUTH0_CLIENT_ID='ooKrOZCVndrxGt4OHcj8iF9VGIqSGSnC'
AUTH0_CLIENT_SECRET='DPAvrTmgF-hnZEwwPZN2l_iw8YLn0_wPWww2pd_OPCLWFAHBtadMzQjm8_ex3-wv'
AUTH0_AUDIENCE=''

# Azure SQL Database Configuration (your existing config)
AZURE_SQL_SERVER='k2sqldatabaseserver.database.windows.net'
AZURE_SQL_DATABASE='K2Database'
AZURE_SQL_USER='carepilot'
AZURE_SQL_PASSWORD='abc123!!'
```

**Note:** For production, generate a new `AUTH0_SECRET` using:
```bash
openssl rand -hex 32
```

## Step 2: Create Auth0 API Route Handler

Create the file: `app/api/auth/[...auth0]/route.ts`

```typescript
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
```

## Step 3: Create Auth Utility File

Create the file: `lib/auth.ts`

```typescript
/**
 * Auth0 user session utilities
 */

import { getSession } from '@auth0/nextjs-auth0';
import { User } from '@auth0/nextjs-auth0';

export async function getServerSession() {
  return await getSession();
}

export function getUserEmail(user: User | undefined): string | null {
  return user?.email || null;
}

export function getUserName(user: User | undefined): string | null {
  return user?.name || user?.email || null;
}

export function getUserPicture(user: User | undefined): string | null {
  return user?.picture || null;
}
```

## Step 4: Create Auth Button Component

Create the file: `components/auth/auth-button.tsx`

```typescript
"use client";

import { useUser } from '@auth0/nextjs-auth0/client';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User } from 'lucide-react';
import Link from 'next/link';

export function AuthButton() {
  const { user, error, isLoading } = useUser();

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        Loading...
      </Button>
    );
  }

  if (error) {
    return (
      <Button variant="outline" asChild>
        <a href="/api/auth/login">Login</a>
      </Button>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" asChild>
          <Link href="/profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {user.name || user.email}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <a href="/api/auth/logout" className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </a>
        </Button>
      </div>
    );
  }

  return (
    <Button variant="outline" asChild>
      <a href="/api/auth/login" className="flex items-center gap-2">
        <LogIn className="h-4 w-4" />
        Login
      </a>
    </Button>
  );
}
```

## Step 5: Update Sign-In Page

Update `app/signin/page.tsx` to redirect to Auth0:

```typescript
"use client";

import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link";

export default function SignInPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user && !isLoading) {
      // User is logged in, redirect to patient dashboard
      router.push('/patient');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">CarePilot</h1>
        <p className="text-gray-600 mb-8">Sign in to access your dashboard</p>
        
        <div className="space-y-4">
          <a
            href="/api/auth/login"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Sign In with Auth0
          </a>
          
          <div className="mt-6">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Step 6: Configure Auth0 in Dashboard

1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Navigate to **Applications** → Your Application
3. Add **Allowed Callback URLs**:
   - `http://localhost:3000/api/auth/callback`
   - `http://localhost:3000` (for development)
4. Add **Allowed Logout URLs**:
   - `http://localhost:3000`
5. Add **Allowed Web Origins**:
   - `http://localhost:3000`

## Step 7: Update Booking to Use Authenticated User

The scheduling page has been updated to use `user.email` from Auth0 instead of localStorage.

## Step 8: Test Authentication

1. Start the dev server: `npm run dev`
2. Navigate to `http://localhost:3000/signin`
3. Click "Sign In with Auth0"
4. Complete the Auth0 login flow
5. You should be redirected back to the app

## Usage in Components

### Client Components

```typescript
"use client";

import { useUser } from '@auth0/nextjs-auth0/client';

export function MyComponent() {
  const { user, error, isLoading } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;
  if (user) {
    return <div>Hello {user.email}</div>;
  }
  return <div>Not logged in</div>;
}
```

### Server Components

```typescript
import { getSession } from '@auth0/nextjs-auth0';
import { redirect } from 'next/navigation';

export default async function Page() {
  const session = await getSession();
  
  if (!session) {
    redirect('/api/auth/login');
  }

  return <div>Hello {session.user.email}</div>;
}
```

## Protected Routes

To protect a route, create a server component wrapper:

```typescript
import { getSession } from '@auth0/nextjs-auth0';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/api/auth/login');
  }

  return (
    <div>
      <h1>Protected Content</h1>
      <p>Email: {session.user.email}</p>
    </div>
  );
}
```

## Next Steps

1. Update profile page to fetch user data from Auth0
2. Sync Auth0 user with your `user_table` in SQL Database
3. Add role-based access control (patient vs doctor)
4. Update API routes to verify authentication
5. Add user metadata to Auth0 for role assignment

## Troubleshooting

### "Invalid state" error
- Clear cookies and try again
- Ensure `AUTH0_SECRET` is set correctly

### "Redirect URI mismatch"
- Check Auth0 dashboard callback URLs
- Ensure they match exactly (including http:// vs https://)

### User not persisting
- Check that `AUTH0_SECRET` is set
- Verify session cookies are being set in browser

---

**Note:** Make sure to add `.env.local` to `.gitignore` to keep secrets safe!

