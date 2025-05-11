import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User, InsertRefreshToken, RefreshToken, refreshTokens } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { db } from '../db';

// Environment variables with fallbacks
const secret = process.env.JWT_SECRET || 'your-secret-key-for-development-only';
const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY || '15m'; // 15 minutes
const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY || '7d'; // 7 days

/**
 * Access token payload structure
 */
interface TokenPayload {
  sub: number;  // User ID
  role: string; // User role
  email: string;
  name: string;
  companyId: number | null;
  iat?: number; // Issued at
  exp?: number; // Expiry
}

/**
 * Response structure for authentication
 */
export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Seconds
  tokenType: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    companyId: number | null;
    avatarUrl: string | null;
  };
}

/**
 * Generate an access token for the user
 */
export function generateAccessToken(user: User): string {
  const payload: TokenPayload = {
    sub: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    companyId: user.companyId,
  };

  return jwt.sign(payload, secret, { expiresIn: accessTokenExpiry });
}

/**
 * Generate a refresh token and store it in the database
 */
export async function generateRefreshToken(
  user: User, 
  ipAddress: string
): Promise<string> {
  // Create a new refresh token with UUID
  const token = uuidv4();
  
  // Calculate expiry date
  const expiresInMs = getExpiryInMs(refreshTokenExpiry);
  const expiresAt = new Date(Date.now() + expiresInMs);

  // Create token data for database
  const refreshTokenData: InsertRefreshToken = {
    token,
    userId: user.id,
    expires: expiresAt,
    createdByIp: ipAddress,
  };

  // Store token in database
  try {
    await db!.insert(db!.schema.refreshTokens).values(refreshTokenData);
    return token;
  } catch (error) {
    console.error('Failed to store refresh token:', error);
    throw new Error('Failed to generate refresh token');
  }
}

/**
 * Get a refresh token from the database
 */
export async function getRefreshToken(token: string): Promise<RefreshToken | undefined> {
  try {
    const result = await db!.execute(
      sql`SELECT * FROM refresh_tokens WHERE token = ${token} AND is_revoked = FALSE AND is_expired = FALSE`
    );
    
    if (result.rows.length === 0) {
      return undefined;
    }
    
    const refreshToken = result.rows[0] as RefreshToken;
    
    // Check if the token has expired
    if (new Date(refreshToken.expires) < new Date()) {
      await revokeRefreshToken(token, 'Expired');
      return undefined;
    }
    
    return refreshToken;
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return undefined;
  }
}

/**
 * Revoke a refresh token
 */
export async function revokeRefreshToken(
  token: string, 
  ipAddress: string, 
  replacedByToken?: string
): Promise<boolean> {
  try {
    const result = await db!.execute(
      sql`UPDATE refresh_tokens 
          SET is_revoked = TRUE, 
              revoked_at = NOW(),
              revoked_by_ip = ${ipAddress},
              replaced_by_token = ${replacedByToken || null},
              is_active = FALSE
          WHERE token = ${token}`
    );
    
    return result.rowCount > 0;
  } catch (error) {
    console.error('Error revoking refresh token:', error);
    return false;
  }
}

/**
 * Verify an access token
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, secret) as TokenPayload;
  } catch (error) {
    console.error('Error verifying access token:', error);
    return null;
  }
}

/**
 * Generate a new access token from a refresh token
 */
export async function refreshAccessToken(
  refreshToken: string, 
  ipAddress: string
): Promise<AuthTokenResponse | null> {
  try {
    // Get the refresh token from the database
    const token = await getRefreshToken(refreshToken);
    
    if (!token) {
      return null;
    }
    
    // Get the user associated with the token
    const user = await db!.execute(
      sql`SELECT * FROM users WHERE id = ${token.userId}`
    );
    
    if (user.rows.length === 0) {
      return null;
    }
    
    // Create a new refresh token (rotation)
    const newRefreshToken = await rotateRefreshToken(token, ipAddress);
    
    // Generate a new access token
    const accessToken = generateAccessToken(user.rows[0] as User);
    
    // Return the tokens and user information
    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: getExpiryInSeconds(accessTokenExpiry),
      tokenType: 'Bearer',
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
        role: user.rows[0].role,
        companyId: user.rows[0].company_id,
        avatarUrl: user.rows[0].avatar_url,
      },
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return null;
  }
}

/**
 * Rotate (replace) a refresh token with a new one
 */
async function rotateRefreshToken(
  token: RefreshToken,
  ipAddress: string
): Promise<string> {
  // Create a new refresh token
  const newToken = uuidv4();
  
  // Calculate expiry date
  const expiresInMs = getExpiryInMs(refreshTokenExpiry);
  const expiresAt = new Date(Date.now() + expiresInMs);
  
  // Create token data for database
  const refreshTokenData: InsertRefreshToken = {
    token: newToken,
    userId: token.userId,
    expires: expiresAt,
    createdByIp: ipAddress,
  };
  
  try {
    // Insert the new token
    await db!.insert(db!.schema.refreshTokens).values(refreshTokenData);
    
    // Revoke the old token and link it to the new one
    await revokeRefreshToken(token.token, ipAddress, newToken);
    
    return newToken;
  } catch (error) {
    console.error('Failed to rotate refresh token:', error);
    throw new Error('Failed to rotate refresh token');
  }
}

/**
 * Generate full authentication response with tokens
 */
export async function generateAuthTokens(
  user: User, 
  ipAddress: string
): Promise<AuthTokenResponse> {
  // Generate an access token
  const accessToken = generateAccessToken(user);
  
  // Generate a refresh token
  const refreshToken = await generateRefreshToken(user, ipAddress);
  
  // Return the tokens and user information
  return {
    accessToken,
    refreshToken,
    expiresIn: getExpiryInSeconds(accessTokenExpiry),
    tokenType: 'Bearer',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      avatarUrl: user.avatarUrl,
    },
  };
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeAllUserTokens(userId: number, ipAddress: string): Promise<boolean> {
  try {
    const result = await db!.execute(
      sql`UPDATE refresh_tokens 
          SET is_revoked = TRUE, 
              revoked_at = NOW(),
              revoked_by_ip = ${ipAddress},
              is_active = FALSE
          WHERE user_id = ${userId} AND is_revoked = FALSE`
    );
    
    return true;
  } catch (error) {
    console.error('Error revoking all user tokens:', error);
    return false;
  }
}

/**
 * Helper function to convert token expiry string to milliseconds
 */
function getExpiryInMs(expiry: string): number {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1));
  
  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 15 * 60 * 1000; // Default to 15 minutes
  }
}

/**
 * Helper function to convert token expiry string to seconds
 */
function getExpiryInSeconds(expiry: string): number {
  return Math.floor(getExpiryInMs(expiry) / 1000);
}