# Authentication Setup Guide

## Overview

CarePilot now supports password-based authentication. Users can sign up, sign in, and update their passwords securely.

## Features

- ✅ Password hashing with bcrypt
- ✅ Password strength validation
- ✅ Secure password storage (never plaintext)
- ✅ Sign up, sign in, and password update endpoints
- ✅ Backward compatible (existing users without passwords can still exist)

## Installation

### 1. Install Dependencies

```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

### 2. Run Database Migration

If you have an existing database, run the migration script:

```sql
-- Execute database/migration-add-password.sql
```

Or manually add the column:

```sql
ALTER TABLE [dbo].[user_table]
ADD [password_hash] NVARCHAR(255) NULL;
```

### 3. Update Schema

If creating a new database, the `password_hash` column is already included in `database/schema.sql`.

## API Endpoints

### Sign Up

**POST** `/api/auth/signup`

Create a new user account with password.

**Request:**
```json
{
  "emailAddress": "user@example.com",
  "password": "SecurePass123",
  "FirstName": "John",
  "LastName": "Doe",
  "InsurancePlanType": "PPO",
  "userRole": "patient",
  "DateOfBirth": "1990-01-15",
  "StreetAddress": "123 Main St",
  "PatientCity": "New York",
  "PatientState": "NY"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "emailAddress": "user@example.com",
    "FirstName": "John",
    "LastName": "Doe",
    "userRole": "patient"
  }
}
```

### Sign In

**POST** `/api/auth/signin`

Authenticate a user with email and password.

**Request:**
```json
{
  "emailAddress": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sign in successful",
  "user": {
    "emailAddress": "user@example.com",
    "FirstName": "John",
    "LastName": "Doe",
    "userRole": "patient",
    // ... other user fields (password_hash is never returned)
  }
}
```

### Update Password

**POST** `/api/auth/update-password`

Update a user's password.

**Request:**
```json
{
  "emailAddress": "user@example.com",
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

## Password Requirements

Passwords must meet the following requirements:
- ✅ At least 8 characters long
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)

## Usage Examples

### Frontend Integration

```typescript
// Sign up
const response = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    emailAddress: 'user@example.com',
    password: 'SecurePass123',
    FirstName: 'John',
    LastName: 'Doe',
    InsurancePlanType: 'PPO',
  }),
});

// Sign in
const response = await fetch('/api/auth/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    emailAddress: 'user@example.com',
    password: 'SecurePass123',
  }),
});

// Update password
const response = await fetch('/api/auth/update-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    emailAddress: 'user@example.com',
    currentPassword: 'OldPass123',
    newPassword: 'NewSecurePass123',
  }),
});
```

### Backend Usage

```typescript
import { hashPassword, verifyPassword } from '@/lib/auth';
import { createUser, getUserByEmail } from '@/lib/azure/sql-storage';

// Create user with password
const passwordHash = await hashPassword('SecurePass123');
await createUser({
  emailAddress: 'user@example.com',
  FirstName: 'John',
  LastName: 'Doe',
  InsurancePlanType: 'PPO',
  password_hash: passwordHash,
});

// Verify password
const user = await getUserByEmail('user@example.com');
if (user && user.password_hash) {
  const isValid = await verifyPassword('SecurePass123', user.password_hash);
  if (isValid) {
    // User authenticated
  }
}
```

## Security Considerations

### 1. HTTPS Only
Always use HTTPS in production to protect password transmission.

### 2. Rate Limiting
Implement rate limiting on sign-in endpoints to prevent brute force attacks:

```typescript
// Example with Next.js middleware
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limit: 5 requests per 15 minutes
  const rateLimitResult = await rateLimit(request, {
    limit: 5,
    window: 15 * 60 * 1000, // 15 minutes
  });
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }
  
  // ... rest of sign-in logic
}
```

### 3. Session Management
After successful authentication, use secure session tokens (JWT, etc.):

```typescript
import jwt from 'jsonwebtoken';

// After successful sign-in
const token = jwt.sign(
  { emailAddress: user.emailAddress, userRole: user.userRole },
  process.env.JWT_SECRET!,
  { expiresIn: '24h' }
);

return NextResponse.json({
  success: true,
  token,
  user: userWithoutPassword,
});
```

### 4. Password Reset
Implement a secure password reset flow:

1. User requests password reset
2. Generate secure token
3. Send reset link via email
4. User clicks link and sets new password
5. Invalidate reset token

### 5. Audit Logging
Log authentication attempts for security monitoring:

```typescript
// Log sign-in attempts
await logAuthEvent({
  emailAddress,
  event: 'sign_in_attempt',
  success: isPasswordValid,
  ipAddress: request.headers.get('x-forwarded-for'),
  timestamp: new Date(),
});
```

## Testing

### Test Sign Up
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "emailAddress": "test@example.com",
    "password": "TestPass123",
    "FirstName": "Test",
    "LastName": "User",
    "InsurancePlanType": "PPO"
  }'
```

### Test Sign In
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "emailAddress": "test@example.com",
    "password": "TestPass123"
  }'
```

### Test Update Password
```bash
curl -X POST http://localhost:3000/api/auth/update-password \
  -H "Content-Type: application/json" \
  -d '{
    "emailAddress": "test@example.com",
    "currentPassword": "TestPass123",
    "newPassword": "NewTestPass123"
  }'
```

## Migration for Existing Users

If you have existing users without passwords:

1. **Option 1**: Users set passwords on first login
2. **Option 2**: Send password reset emails to all users
3. **Option 3**: Generate temporary passwords and email them

```typescript
// Example: Set password for existing user
import { updateUser } from '@/lib/azure/sql-storage';
import { hashPassword } from '@/lib/auth';

async function setPasswordForExistingUser(email: string, password: string) {
  const passwordHash = await hashPassword(password);
  await updateUser(email, { password_hash: passwordHash });
}
```

## Troubleshooting

### "bcryptjs not found"
```bash
npm install bcryptjs @types/bcryptjs
```

### "password_hash column does not exist"
Run the migration script: `database/migration-add-password.sql`

### "Invalid email or password"
- Check that the user exists in the database
- Verify the password is correct
- Ensure password_hash is set for the user

### Password validation errors
Ensure passwords meet requirements:
- At least 8 characters
- Contains uppercase, lowercase, and number

## Next Steps

1. ✅ Install bcryptjs
2. ✅ Run database migration
3. ✅ Test API endpoints
4. ✅ Integrate with frontend
5. ✅ Implement session management
6. ✅ Add rate limiting
7. ✅ Set up password reset flow
8. ✅ Add audit logging

## Files Created

- `lib/auth.ts` - Authentication utilities (hashing, verification, validation)
- `app/api/auth/signup/route.ts` - Sign up endpoint
- `app/api/auth/signin/route.ts` - Sign in endpoint
- `app/api/auth/update-password/route.ts` - Password update endpoint
- `database/migration-add-password.sql` - Database migration script
- `database/PASSWORD-MIGRATION.md` - Migration guide
- `database/AUTHENTICATION.md` - This file

