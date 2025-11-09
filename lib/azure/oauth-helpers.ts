/**
 * OAuth Helper Functions for User Management
 * Handles OAuth user creation and lookup
 */

import { createUser, getUserByEmail, updateUser, UserEntity } from './sql-storage';

export interface OAuthUserData {
  provider: string; // 'google', 'facebook', 'auth0', 'microsoft', etc.
  providerId: string; // User ID from OAuth provider
  email: string; // Email from OAuth provider
  firstName?: string;
  lastName?: string;
  picture?: string; // Profile picture URL
  emailVerified?: boolean;
}

/**
 * Find or create a user from OAuth data
 * @param oauthData OAuth user data from provider
 * @param additionalUserData Additional user data to set on creation
 * @returns User entity
 */
export async function findOrCreateOAuthUser(
  oauthData: OAuthUserData,
  additionalUserData?: Partial<UserEntity>
): Promise<UserEntity> {
  // Try to find user by OAuth provider + provider ID
  const userByOAuth = await getUserByOAuthProvider(
    oauthData.provider,
    oauthData.providerId
  );

  if (userByOAuth) {
    // User exists, update OAuth email if different
    if (oauthData.email && userByOAuth.oauth_email !== oauthData.email) {
      await updateUser(userByOAuth.emailAddress, {
        oauth_email: oauthData.email,
      });
      userByOAuth.oauth_email = oauthData.email;
    }
    return userByOAuth;
  }

  // Try to find user by email
  const userByEmail = await getUserByEmail(oauthData.email);
  if (userByEmail) {
    // User exists with this email, link OAuth account
    await updateUser(oauthData.email, {
      oauth_provider: oauthData.provider,
      oauth_provider_id: oauthData.providerId,
      oauth_email: oauthData.email,
    });
    return {
      ...userByEmail,
      oauth_provider: oauthData.provider,
      oauth_provider_id: oauthData.providerId,
      oauth_email: oauthData.email,
    };
  }

  // Create new user
  const newUser: Omit<UserEntity, 'created_at' | 'updated_at'> = {
    emailAddress: oauthData.email,
    FirstName: oauthData.firstName || '',
    LastName: oauthData.lastName || '',
    DateOfBirth: additionalUserData?.DateOfBirth || '',
    StreetAddress: additionalUserData?.StreetAddress || '',
    PatientCity: additionalUserData?.PatientCity || '',
    PatientState: additionalUserData?.PatientState || '',
    InsurancePlanType: additionalUserData?.InsurancePlanType || 'PPO',
    userRole: additionalUserData?.userRole || 'patient',
    oauth_provider: oauthData.provider,
    oauth_provider_id: oauthData.providerId,
    oauth_email: oauthData.email,
    ...additionalUserData,
  };

  await createUser(newUser);

  // Return the created user
  const createdUser = await getUserByEmail(oauthData.email);
  if (!createdUser) {
    throw new Error('Failed to create OAuth user');
  }

  return createdUser;
}

/**
 * Get user by OAuth provider and provider ID
 * @param provider OAuth provider name
 * @param providerId User ID from OAuth provider
 * @returns User entity or null
 */
export async function getUserByOAuthProvider(
  provider: string,
  providerId: string
): Promise<UserEntity | null> {
  const sql = await import('mssql');
  const { getConnectionPool } = await import('./sql-storage');
  
  const pool = await getConnectionPool();
  const request = pool.request();

  request.input('oauth_provider', sql.NVarChar, provider);
  request.input('oauth_provider_id', sql.NVarChar, providerId);

  const result = await request.query(`
    SELECT * FROM user_table 
    WHERE oauth_provider = @oauth_provider 
    AND oauth_provider_id = @oauth_provider_id
  `);

  if (result.recordset.length === 0) {
    return null;
  }

  return result.recordset[0] as UserEntity;
}

/**
 * Check if a user has OAuth authentication
 * @param user User entity
 * @returns True if user has OAuth, false otherwise
 */
export function hasOAuth(user: UserEntity): boolean {
  return !!(user.oauth_provider && user.oauth_provider_id);
}

/**
 * Check if a user has password authentication
 * @param user User entity
 * @returns True if user has password, false otherwise
 */
export function hasPassword(user: UserEntity): boolean {
  return !!user.password_hash;
}

