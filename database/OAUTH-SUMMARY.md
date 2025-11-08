# OAuth Authentication - Quick Summary

## What Changed for OAuth Users?

Since you're using **OAuth for authentication**, here's what changed in your database schema:

### ✅ No Password Required
- The `password_hash` field is **optional and nullable**
- You don't need to store passwords for OAuth users
- You can skip the password-related API endpoints if you only use OAuth

### ✅ OAuth Fields Added
Three new fields were added to `user_table`:

1. **`oauth_provider`** - OAuth provider name (e.g., 'google', 'facebook', 'auth0', 'microsoft')
2. **`oauth_provider_id`** - User ID from the OAuth provider
3. **`oauth_email`** - Email from OAuth provider (may differ from emailAddress)

### ✅ Unique Constraint
- Unique constraint on `(oauth_provider, oauth_provider_id)` ensures one user per OAuth account
- Prevents duplicate OAuth accounts

### ✅ Helper Functions
- `findOrCreateOAuthUser()` - Automatically finds or creates users from OAuth data
- `getUserByOAuthProvider()` - Get user by OAuth provider and provider ID
- `hasOAuth()` - Check if user has OAuth authentication
- `hasPassword()` - Check if user has password authentication

## Migration

### For Existing Databases

Run this SQL migration:
```sql
-- Execute database/migration-add-oauth.sql
```

Or manually:
```sql
ALTER TABLE [dbo].[user_table]
ADD [oauth_provider] NVARCHAR(50) NULL,
    [oauth_provider_id] NVARCHAR(255) NULL,
    [oauth_email] NVARCHAR(255) NULL;

CREATE INDEX [idx_user_oauth_provider] ON [dbo].[user_table]([oauth_provider]);
CREATE INDEX [idx_user_oauth_provider_id] ON [dbo].[user_table]([oauth_provider], [oauth_provider_id]);

CREATE UNIQUE INDEX [UQ_user_oauth_provider_id] 
ON [dbo].[user_table]([oauth_provider], [oauth_provider_id])
WHERE [oauth_provider] IS NOT NULL AND [oauth_provider_id] IS NOT NULL;
```

## Usage Example

```typescript
import { findOrCreateOAuthUser } from '@/lib/azure/oauth-helpers';

// After OAuth authentication (e.g., Google, Auth0, etc.)
const user = await findOrCreateOAuthUser({
  provider: 'google', // or 'auth0', 'facebook', 'microsoft', etc.
  providerId: '1234567890',
  email: 'user@gmail.com',
  firstName: 'John',
  lastName: 'Doe',
});
```

## What You DON'T Need

Since you're using OAuth:
- ❌ You don't need to install `bcryptjs` (unless you also support password auth)
- ❌ You don't need password API endpoints (`/api/auth/signup`, `/api/auth/signin`)
- ❌ You don't need to store password hashes

## What You DO Need

- ✅ Run the OAuth migration SQL
- ✅ Implement OAuth callback handler (depends on your OAuth provider)
- ✅ Use `findOrCreateOAuthUser()` in your OAuth callback
- ✅ Store OAuth provider information when users sign in

## Files to Review

1. **database/schema.sql** - Updated with OAuth fields
2. **database/migration-add-oauth.sql** - Migration script
3. **lib/azure/oauth-helpers.ts** - OAuth helper functions
4. **database/OAUTH-SETUP.md** - Complete OAuth setup guide

## Next Steps

1. Run the migration SQL on your database
2. Set up your OAuth provider (Google, Auth0, etc.)
3. Implement OAuth callback handler
4. Use `findOrCreateOAuthUser()` in your callback
5. Test OAuth authentication flow

## Questions?

See `database/OAUTH-SETUP.md` for detailed documentation and examples.

