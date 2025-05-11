/**
 * JWT Token Service
 * Handles creating and validating access and refresh tokens
 */
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { users, refreshTokens } from '../../shared/schema';
import { db } from '../db';
import { eq, and, lt, gte } from 'drizzle-orm';

// Types from schema
import type { User, RefreshToken } from '../../shared/schema';

// Constants
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret';
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

// Interfaces
export interface TokenPayload {
  id: number;
  username: string;
  email: string;
  role: string;
  companyId: number | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expires: Date;
}

// Helper to create token payload from user
const createTokenPayload = (user: User): TokenPayload => {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    companyId: user.companyId
  };
};

// Generate access token
export const generateAccessToken = (user: User): string => {
  const payload = createTokenPayload(user);
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

// Generate refresh token and store in database
export const generateRefreshToken = async (user: User, ipAddress?: string): Promise<string> => {
  // Create token
  const token = uuidv4();
  
  // Calculate expiry
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  
  // Store in database
  if (db) {
    await db.insert(refreshTokens).values({
      token,
      userId: user.id,
      expires,
      createdByIp: ipAddress
    });
  }
  
  return token;
};

// Generate both tokens for user authentication
export const generateTokens = async (user: User, ipAddress?: string): Promise<TokenPair> => {
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user, ipAddress);
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  return { accessToken, refreshToken, expires };
};

// Verify access token
export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
    // Verify the payload has the expected fields for TokenPayload
    if (
      typeof payload === 'object' && 
      payload !== null && 
      'id' in payload && 
      'username' in payload && 
      'email' in payload && 
      'role' in payload && 
      'companyId' in payload
    ) {
      return payload as TokenPayload;
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Verify and use refresh token to generate new tokens
export const refreshTokensWithRefreshToken = async (
  token: string, 
  ipAddress?: string
): Promise<TokenPair | null> => {
  if (!db) return null;
  
  try {
    // Find token in database
    const foundTokens = await db.select().from(refreshTokens).where(
      and(
        eq(refreshTokens.token, token),
        eq(refreshTokens.isRevoked, false),
        eq(refreshTokens.isExpired, false),
        gte(refreshTokens.expires, new Date())
      )
    );
    
    if (!foundTokens.length) return null;
    
    const refreshToken = foundTokens[0];
    
    // Get user from token
    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, refreshToken.userId));
      
    if (!foundUsers.length) return null;
    
    const user = foundUsers[0];
    
    // Replace old refresh token with a new one
    const newRefreshToken = await generateRefreshToken(user, ipAddress);
    
    // Mark the old token as replaced
    await db
      .update(refreshTokens)
      .set({
        replacedByToken: newRefreshToken,
        isActive: false
      })
      .where(eq(refreshTokens.token, token));
    
    // Generate new access token
    const accessToken = generateAccessToken(user);
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    return { accessToken, refreshToken: newRefreshToken, expires };
  } catch (error) {
    console.error('Error refreshing tokens:', error);
    return null;
  }
};

// Revoke refresh token (for logout)
export const revokeRefreshToken = async (token: string, ipAddress?: string): Promise<boolean> => {
  if (!db) return false;
  
  try {
    await db
      .update(refreshTokens)
      .set({
        revokedAt: new Date(),
        revokedByIp: ipAddress,
        isActive: false,
        isRevoked: true
      })
      .where(eq(refreshTokens.token, token));
    
    return true;
  } catch (error) {
    console.error('Error revoking token:', error);
    return false;
  }
};

// Revoke all refresh tokens for a user (for force logout all devices)
export const revokeAllUserRefreshTokens = async (userId: number): Promise<boolean> => {
  if (!db) return false;
  
  try {
    await db
      .update(refreshTokens)
      .set({
        revokedAt: new Date(),
        isActive: false,
        isRevoked: true
      })
      .where(
        and(
          eq(refreshTokens.userId, userId),
          eq(refreshTokens.isActive, true)
        )
      );
    
    return true;
  } catch (error) {
    console.error('Error revoking all user tokens:', error);
    return false;
  }
};

// Check if refresh token is active
export const isRefreshTokenActive = async (token: string): Promise<boolean> => {
  if (!db) return false;
  
  try {
    const tokens = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token, token),
          eq(refreshTokens.isActive, true),
          eq(refreshTokens.isRevoked, false),
          eq(refreshTokens.isExpired, false),
          gte(refreshTokens.expires, new Date())
        )
      );
    
    return tokens.length > 0;
  } catch (error) {
    console.error('Error checking if token is active:', error);
    return false;
  }
};

// Cleanup expired tokens
export const cleanupExpiredTokens = async (): Promise<number> => {
  if (!db) return 0;
  
  try {
    await db
      .update(refreshTokens)
      .set({
        isExpired: true,
        isActive: false
      })
      .where(
        and(
          lt(refreshTokens.expires, new Date()),
          eq(refreshTokens.isActive, true),
          eq(refreshTokens.isExpired, false)
        )
      );
    
    return 1; // Number of affected rows (approximation since Drizzle doesn't return this easily)
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    return 0;
  }
};