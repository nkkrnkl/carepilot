# OAuth Authentication Setup Guide

## Overview

CarePilot supports OAuth authentication (Google, Facebook, Auth0, Microsoft, etc.). With OAuth, users don't need passwords - authentication is handled by the OAuth provider.

## Database Schema Changes

### OAuth Fields Added to `user_table`

- `oauth_provider` (NVARCHAR(50), nullable) - OAuth provider name: 'google', 'facebook', 'auth0', 'microsoft', etc.
- `oauth_provider_id` (NVARCHAR(255), nullable) - User ID from OAuth provider
- `oauth_email` (NVARCHAR(255), nullable) - Email from OAuth provider (may differ from emailAddress)

### Indexes

- Index on `oauth_provider` for fast lookups
- Composite unique index on `(oauth_provider, oauth_provider_id)` to prevent duplicate OAuth accounts
- Composite index on `(oauth_provider, oauth_provider_id)` for fast OAuth lookups

### Password Field

- `password_hash` remains optional and nullable
- Users can have either OAuth OR password authentication (or both)

## Migration

### For Existing Databases

Run this SQL to add OAuth fields:

```sql
-- Add OAuth fields if they don't exist
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[user_table]') 
    AND name = 'oauth_provider'
)
BEGIN
    ALTER TABLE [dbo].[user_table]
    ADD [oauth_provider] NVARCHAR(50) NULL,
        [oauth_provider_id] NVARCHAR(255) NULL,
        [oauth_email] NVARCHAR(255) NULL;
    
    -- Create indexes
    CREATE INDEX [idx_user_oauth_provider] ON [dbo].[user_table]([oauth_provider]);
    CREATE INDEX [idx_user_oauth_provider_id] ON [dbo].[user_table]([oauth_provider], [oauth_provider_id]);
    
    -- Create unique constraint for OAuth provider + provider_id
    CREATE UNIQUE INDEX [UQ_user_oauth_provider_id] 
    ON [dbo].[user_table]([oauth_provider], [oauth_provider_id])
    WHERE [oauth_provider] IS NOT NULL AND [oauth_provider_id] IS NOT NULL;
    
    PRINT 'OAuth fields added successfully to user_table';
END
ELSE
BEGIN
    PRINT 'OAuth fields already exist in user_table';
END;
```

## Usage

### Finding or Creating OAuth Users

```typescript
import { findOrCreateOAuthUser } from '@/lib/azure/oauth-helpers';

// After OAuth authentication
const oauthUser = await findOrCreateOAuthUser({
  provider: 'google',
  providerId: '1234567890',
  email: 'user@gmail.com',
  firstName: 'John',
  lastName: 'Doe',
  picture: 'https://...',
  emailVerified: true,
}, {
  // Optional: additional user data
  InsurancePlanType: 'PPO',
  userRole: 'patient',
});
```

### Getting User by OAuth Provider

```typescript
import { getUserByOAuthProvider } from '@/lib/azure/oauth-helpers';

const user = await getUserByOAuthProvider('google', '1234567890');
if (user) {
  // User found
}
```

### Checking Authentication Method

```typescript
import { hasOAuth, hasPassword } from '@/lib/azure/oauth-helpers';
import { getUserByEmail } from '@/lib/azure/sql-storage';

const user = await getUserByEmail('user@example.com');
if (user) {
  if (hasOAuth(user)) {
    console.log('User has OAuth authentication');
  }
  if (hasPassword(user)) {
    console.log('User has password authentication');
  }
}
```

## OAuth Provider Examples

### Google OAuth

```typescript
// Example: NextAuth.js with Google
import { findOrCreateOAuthUser } from '@/lib/azure/oauth-helpers';

export async function handleGoogleOAuth(profile: any) {
  const user = await findOrCreateOAuthUser({
    provider: 'google',
    providerId: profile.id,
    email: profile.email,
    firstName: profile.given_name,
    lastName: profile.family_name,
    picture: profile.picture,
    emailVerified: profile.email_verified,
  });
  
  return user;
}
```

### Auth0

```typescript
// Example: Auth0 authentication
export async function handleAuth0Login(user: any) {
  const dbUser = await findOrCreateOAuthUser({
    provider: 'auth0',
    providerId: user.sub,
    email: user.email,
    firstName: user.given_name,
    lastName: user.family_name,
    picture: user.picture,
    emailVerified: user.email_verified,
  });
  
  return dbUser;
}
```

### Microsoft (Azure AD)

```typescript
// Example: Microsoft OAuth
export async function handleMicrosoftOAuth(profile: any) {
  const user = await findOrCreateOAuthUser({
    provider: 'microsoft',
    providerId: profile.id,
    email: profile.mail || profile.userPrincipalName,
    firstName: profile.givenName,
    lastName: profile.surname,
    picture: profile.photo,
    emailVerified: true,
  });
  
  return user;
}
```

## API Integration

### OAuth Callback Handler

```typescript
// app/api/auth/oauth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateOAuthUser } from '@/lib/azure/oauth-helpers';

export async function GET(request: NextRequest) {
  try {
    const { provider, code } = request.nextUrl.searchParams;
    
    // Exchange code for user info (implementation depends on OAuth provider)
    const oauthUserData = await exchangeCodeForUserInfo(provider, code);
    
    // Find or create user
    const user = await findOrCreateOAuthUser({
      provider,
      providerId: oauthUserData.id,
      email: oauthUserData.email,
      firstName: oauthUserData.firstName,
      lastName: oauthUserData.lastName,
      picture: oauthUserData.picture,
      emailVerified: oauthUserData.emailVerified,
    });
    
    // Create session/token
    const sessionToken = createSessionToken(user);
    
    return NextResponse.json({
      success: true,
      user: {
        emailAddress: user.emailAddress,
        FirstName: user.FirstName,
        LastName: user.LastName,
        userRole: user.userRole,
      },
      token: sessionToken,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'OAuth authentication failed', details: error.message },
      { status: 500 }
    );
  }
}
```

## User Linking

### Linking OAuth to Existing Account

If a user signs in with OAuth but already has an account (with password or different OAuth), the system will:

1. **Check by OAuth provider + provider ID** - If found, return existing user
2. **Check by email** - If found, link OAuth account to existing user
3. **Create new user** - If not found, create new user with OAuth data

### Linking Multiple OAuth Providers

Users can link multiple OAuth providers to the same account:

```typescript
// Link additional OAuth provider to existing user
const user = await getUserByEmail('user@example.com');
if (user) {
  // User can add Google, Facebook, etc. to same account
  // Store multiple providers in a separate table or JSON field
}
```

## Data Model

### User Table Structure

```typescript
interface UserEntity {
  emailAddress: string; // Primary key
  FirstName: string;
  LastName: string;
  // ... other fields
  password_hash?: string; // Optional - for password auth
  oauth_provider?: string; // Optional - OAuth provider name
  oauth_provider_id?: string; // Optional - OAuth provider user ID
  oauth_email?: string; // Optional - Email from OAuth provider
}
```

### Authentication Flow

```
User clicks "Sign in with Google"
    ↓
OAuth Provider (Google) authenticates user
    ↓
OAuth Provider returns user info
    ↓
findOrCreateOAuthUser() checks:
    1. User exists by oauth_provider + oauth_provider_id?
    2. User exists by email?
    3. Create new user
    ↓
Return user data + create session
```

## Best Practices

### 1. Email Verification
- OAuth providers typically verify emails
- Store `emailVerified` status if available
- Use `oauth_email` if it differs from `emailAddress`

### 2. Profile Picture
- Store profile picture URL if available
- Consider storing in a separate `profile_picture` field
- Or store in `documents` JSON field

### 3. Multiple OAuth Providers
- Consider creating a separate `user_oauth_providers` table if users can link multiple providers
- Or store as JSON array in a field

### 4. Session Management
- Use JWT tokens or session cookies after OAuth authentication
- Never store OAuth access tokens in database (use refresh tokens if needed)

### 5. Security
- Validate OAuth provider responses
- Verify OAuth tokens with provider
- Use HTTPS only
- Implement CSRF protection

## Migration from Password to OAuth

If you have existing users with passwords who want to use OAuth:

```typescript
// User signs in with OAuth
const oauthUser = await findOrCreateOAuthUser({
  provider: 'google',
  providerId: '1234567890',
  email: 'existing@example.com',
});

// System automatically links OAuth to existing account by email
// User can now use either password or OAuth to sign in
```

## Testing

### Test OAuth User Creation

```typescript
import { findOrCreateOAuthUser } from '@/lib/azure/oauth-helpers';

const user = await findOrCreateOAuthUser({
  provider: 'google',
  providerId: 'test-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
});

console.log('OAuth user:', user);
```

## Files Created/Modified

1. **database/schema.sql** - Added OAuth fields to user_table
2. **lib/azure/sql-storage.ts** - Updated UserEntity type and createUser function
3. **lib/azure/oauth-helpers.ts** - OAuth helper functions
4. **database/OAUTH-SETUP.md** - This file

## Next Steps

1. ✅ Run database migration to add OAuth fields
2. ✅ Install OAuth library (NextAuth.js, Auth0, etc.)
3. ✅ Set up OAuth provider (Google, Facebook, etc.)
4. ✅ Implement OAuth callback handler
5. ✅ Update sign-in page to include OAuth buttons
6. ✅ Test OAuth authentication flow

## Questions?

- See `database/DATA-MODEL.md` for database schema details
- See `lib/azure/oauth-helpers.ts` for OAuth helper functions
- See your OAuth provider's documentation for setup instructions

