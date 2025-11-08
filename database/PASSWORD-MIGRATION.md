# Password Migration Guide

## Overview

The user table now includes a `password_hash` field for storing hashed passwords. This guide explains how to handle password storage and migration.

## Security Best Practices

1. **Never store plaintext passwords** - Always hash passwords before storing
2. **Use bcrypt** - We use bcryptjs for password hashing (salt rounds: 10)
3. **Validate password strength** - Enforce minimum requirements
4. **Never return password hashes** - Always exclude password_hash from API responses

## Database Schema Update

The `user_table` now includes:
```sql
[password_hash] NVARCHAR(255) NULL,  -- Hashed password (bcrypt)
```

**Important**: The field is nullable to support existing users who don't have passwords yet.

## Migration Steps

### 1. Run Schema Update

If you have an existing database, run this SQL to add the password_hash column:

```sql
-- Add password_hash column if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[user_table]') 
    AND name = 'password_hash'
)
BEGIN
    ALTER TABLE [dbo].[user_table]
    ADD [password_hash] NVARCHAR(255) NULL;
END;
```

### 2. Update Existing Users (Optional)

If you want to set passwords for existing users, you can use the API or create a migration script:

```typescript
// Migration script example
import { getUserByEmail, updateUser } from '@/lib/azure/sql-storage';
import { hashPassword } from '@/lib/auth';

async function setPasswordForUser(email: string, password: string) {
  const passwordHash = await hashPassword(password);
  await updateUser(email, { password_hash: passwordHash });
}
```

## API Endpoints

### Sign Up
**POST** `/api/auth/signup`

```json
{
  "emailAddress": "user@example.com",
  "password": "SecurePass123",
  "FirstName": "John",
  "LastName": "Doe",
  "InsurancePlanType": "PPO",
  "userRole": "patient"
}
```

### Sign In
**POST** `/api/auth/signin`

```json
{
  "emailAddress": "user@example.com",
  "password": "SecurePass123"
}
```

### Update Password
**POST** `/api/auth/update-password`

```json
{
  "emailAddress": "user@example.com",
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass123"
}
```

## Password Requirements

Passwords must meet the following requirements:
- At least 8 characters long
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## Usage Examples

### Creating a User with Password

```typescript
import { createUser } from '@/lib/azure/sql-storage';
import { hashPassword } from '@/lib/auth';

const passwordHash = await hashPassword('SecurePass123');

await createUser({
  emailAddress: 'user@example.com',
  FirstName: 'John',
  LastName: 'Doe',
  InsurancePlanType: 'PPO',
  password_hash: passwordHash,
  // ... other fields
});
```

### Verifying a Password

```typescript
import { getUserByEmail } from '@/lib/azure/sql-storage';
import { verifyPassword } from '@/lib/auth';

const user = await getUserByEmail('user@example.com');
if (user && user.password_hash) {
  const isValid = await verifyPassword('password123', user.password_hash);
  if (isValid) {
    // Password is correct
  }
}
```

### Updating a Password

```typescript
import { updateUser } from '@/lib/azure/sql-storage';
import { hashPassword } from '@/lib/auth';

const newPasswordHash = await hashPassword('NewSecurePass123');
await updateUser('user@example.com', {
  password_hash: newPasswordHash,
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

## Security Considerations

1. **HTTPS Only** - Always use HTTPS in production to protect password transmission
2. **Rate Limiting** - Implement rate limiting on sign-in endpoints to prevent brute force attacks
3. **Session Management** - Use secure session tokens (JWT, etc.) after authentication
4. **Password Reset** - Implement a secure password reset flow
5. **Audit Logging** - Log authentication attempts for security monitoring

## Dependencies

Make sure to install bcryptjs:

```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

## Notes

- Passwords are hashed using bcrypt with 10 salt rounds
- The password_hash field is nullable to support existing users
- Password hashes are never returned in API responses
- Always validate password strength before hashing
- Use secure comparison (bcrypt.compare) to verify passwords

