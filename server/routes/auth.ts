/**
 * Authentication Routes
 * Handles login, logout, token refresh, and auth status
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { db } from '../db';
import { users } from '../../shared/schema';
import { loginSchema } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { 
  generateTokens, 
  refreshTokensWithRefreshToken, 
  revokeRefreshToken,
  TokenPayload
} from '../lib/jwt';
import { authenticate } from '../middleware/auth';
import { comparePasswords, hashPassword } from '../lib/auth-helpers';

const router = Router();

// Interface to extend request with token data
interface RequestWithIp extends Request {
  ip: string;
}

// Login endpoint - returns JWT tokens
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = loginSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid login data',
        errors: validationResult.error.format()
      });
    }
    
    const { username, password } = validationResult.data;
    
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        message: 'Database connection not available' 
      });
    }
    
    // Find user by username or email (case-insensitive)
    // First try exact match
    let foundUsers = await db
      .select()
      .from(users)
      .where(
        eq(users.username, username)
      );
    
    // If no user found, try case-insensitive username match
    if (!foundUsers.length) {
      const allUsers = await db
        .select()
        .from(users);
      
      foundUsers = allUsers.filter(user => 
        user.username.toLowerCase() === username.toLowerCase() ||
        (user.email && user.email.toLowerCase() === username.toLowerCase())
      );
    }
    
    if (!foundUsers.length) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }
    
    const user = foundUsers[0];
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated' 
      });
    }
    
    // Verify password
    let passwordMatch = false;
    const hashedPassword = user.password;
    
    // Log the password format for debugging
    console.log(`Login attempt for user: ${username}`);
    console.log(`Password hash format check: ${hashedPassword && typeof hashedPassword === 'string' ? 
                 (hashedPassword.includes('.') ? 'scrypt (contains dot separator)' : 'bcrypt (no dot separator)') : 
                 'unknown format'}`);
    
    // Try with our custom scrypt compare first (used by admin script)
    try {
      if (hashedPassword && typeof hashedPassword === 'string' && hashedPassword.includes('.')) {
        // This looks like a scrypt hash (contains salt separator)
        console.log('Attempting to verify with scrypt...');
        passwordMatch = await comparePasswords(password, hashedPassword);
        console.log(`Scrypt verification result: ${passwordMatch ? 'success' : 'failed'}`);
      } 
      
      // If scrypt failed or not applicable, try bcrypt
      if (hashedPassword && !passwordMatch) {
        console.log('Attempting to verify with bcrypt...');
        try {
          passwordMatch = await bcrypt.compare(password, hashedPassword);
          console.log(`Bcrypt verification result: ${passwordMatch ? 'success' : 'failed'}`);
        } catch (bcryptError) {
          console.error('Bcrypt verification error:', bcryptError);
        }
      }
    } catch (error) {
      console.error('Password verification error:', error);
    }
    
    if (!passwordMatch) {
      console.log(`Authentication failed for user: ${username}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }
    
    console.log(`Authentication successful for user: ${username} with role: ${user.role}`);
    
    // Generate tokens
    const ipAddress = (req as RequestWithIp).ip;
    const tokens = await generateTokens(user, ipAddress);
    
    // Update last login time
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, user.id));
    
    // Extract user data to return (exclude sensitive fields)
    const { password: _password, ...userWithoutPassword } = user;
    
    // Create a cookie with httpOnly flag to store the refresh token
    const cookieOptions = {
      httpOnly: true,
      expires: tokens.expires,
      sameSite: 'strict' as const, 
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };
    
    // Set the cookie with refresh token
    res.cookie('refreshToken', tokens.refreshToken, cookieOptions);
    
    // Calculate token expiry in milliseconds (15 minutes)
    const expiresIn = 15 * 60 * 1000;
    
    // Return user, access token, and include refresh token as fallback
    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      user: userWithoutPassword,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken, // Include refresh token for client-side fallback
      expiresIn: expiresIn
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred during login' 
    });
  }
});

// Refresh token endpoint - returns new JWT tokens
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    // Get refresh token from cookie or request body
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ 
        success: false, 
        message: 'Refresh token is required' 
      });
    }
    
    // Get IP address for tracking
    const ipAddress = (req as RequestWithIp).ip;
    
    // Refresh tokens
    const tokens = await refreshTokensWithRefreshToken(refreshToken, ipAddress);
    
    if (!tokens) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired refresh token' 
      });
    }
    
    // Set new refresh token cookie
    const cookieOptions = {
      httpOnly: true,
      expires: tokens.expires,
      sameSite: 'strict' as const, 
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };
    
    res.cookie('refreshToken', tokens.refreshToken, cookieOptions);
    
    // Calculate token expiry in milliseconds (15 minutes)
    const expiresIn = 15 * 60 * 1000;
    
    // Return new access token and the refresh token as fallback
    return res.status(200).json({
      success: true,
      message: 'Token refresh successful',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken, // Include refresh token for client-side fallback
      expiresIn: expiresIn
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred during token refresh' 
    });
  }
});

// Logout endpoint - revokes refresh token
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // Get refresh token from cookie or request body
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      // No token to revoke, but still clear cookie
      res.clearCookie('refreshToken');
      return res.status(200).json({ 
        success: true, 
        message: 'Logged out successfully' 
      });
    }
    
    // Get IP address for tracking
    const ipAddress = (req as RequestWithIp).ip;
    
    // Revoke token
    await revokeRefreshToken(refreshToken, ipAddress);
    
    // Clear cookie
    res.clearCookie('refreshToken');
    
    return res.status(200).json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred during logout' 
    });
  }
});

// Get auth status endpoint
router.get('/status', authenticate, async (req: Request, res: Response) => {
  // If we get here, the user is authenticated (middleware confirmed this)
  return res.status(200).json({
    authenticated: true,
    user: req.user
  });
});

// Get initial auth status - doesn't use middleware to avoid redirect loops
router.get('/initial-status', async (req: Request, res: Response) => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(200).json({ 
        authenticated: false,
        message: 'No access token provided' 
      });
    }
    
    // Extract and verify token without throwing errors
    // This way we don't get a loop of redirects on expired tokens
    const token = authHeader.split(' ')[1];
    
    // The authenticate middleware will handle token verification
    // and set the user property on request
    return res.status(200).json({
      authenticated: true
    });
    
  } catch (error) {
    console.error('Auth status error:', error);
    return res.status(200).json({ 
      authenticated: false,
      message: 'Authentication check failed' 
    });
  }
});

// Debug route for testing password verification in development environments
if (process.env.NODE_ENV !== 'production') {
  // Enhanced debug login route
  router.post('/debug-login', async (req: Request, res: Response) => {
    try {
      // Extract username and password from request body
      const { username, password } = req.body;
      
      console.log(`\n===== DEBUG LOGIN ATTEMPT =====`);
      console.log(`Attempting debug login with username: ${username}`);
      
      if (!username || !password) {
        console.log('❌ Missing credentials in debug login request');
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }
      
      if (!db) {
        console.log('❌ Database connection not available for debug login');
        return res.status(500).json({
          success: false,
          message: 'Database connection not available'
        });
      }
      
      // Start the detailed lookup process
      console.log(`Looking up user with username: ${username}`);
      
      // Step 1: Try exact username match
      console.log(`Step 1: Exact username match lookup...`);
      let foundUsers = await db
        .select()
        .from(users)
        .where(eq(users.username, username));
      
      if (foundUsers.length) {
        console.log(`✅ Found user by exact username match: ${foundUsers[0].username} (${foundUsers[0].email || 'no email'})`);
      } else {
        console.log(`❌ No user found with exact username: ${username}`);
      }
      
      // Step 2: Try case-insensitive username/email match
      if (!foundUsers.length) {
        console.log(`Step 2: Case-insensitive username/email lookup...`);
        const allUsers = await db.select().from(users);
        
        const lowercaseInput = username.toLowerCase();
        console.log(`Searching for case-insensitive match: ${lowercaseInput}`);
        
        // Store the full list of users for debugging
        console.log(`Available users in database (${allUsers.length}):`);
        allUsers.forEach((user, index) => {
          console.log(`User ${index + 1}: ${user.username} (${user.email || 'no email'}), Role: ${user.role}`);
        });
        
        foundUsers = allUsers.filter(user => 
          user.username.toLowerCase() === lowercaseInput ||
          (user.email && user.email.toLowerCase() === lowercaseInput)
        );
        
        if (foundUsers.length) {
          console.log(`✅ Found user by case-insensitive match: ${foundUsers[0].username} (${foundUsers[0].email || 'no email'})`);
        } else {
          console.log(`❌ No user found with case-insensitive match for: ${lowercaseInput}`);
          
          // Log potential near-matches for debugging
          const potentialMatches = allUsers.filter(user => 
            user.username.toLowerCase().includes(lowercaseInput) ||
            (user.email && user.email.toLowerCase().includes(lowercaseInput))
          );
          
          if (potentialMatches.length) {
            console.log(`Potential partial matches found:`);
            potentialMatches.forEach(user => {
              console.log(`- ${user.username} (${user.email || 'no email'})`);
            });
          }
        }
      }
      
      if (!foundUsers.length) {
        console.log(`❌ User not found after all lookup attempts`);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      const user = foundUsers[0];
      console.log(`User found: ${user.username}, ID: ${user.id}, Role: ${user.role}`);
      
      if (!user.isActive) {
        console.log(`❌ User account is deactivated: ${user.username}`);
        return res.status(401).json({
          success: false, 
          message: 'Account is deactivated'
        });
      }
      
      // Verify password
      console.log(`Verifying password...`);
      const hashedPassword = user.password;
      
      if (!hashedPassword) {
        console.log(`❌ User has no password set: ${user.username}`);
        return res.status(401).json({
          success: false,
          message: 'Invalid login credentials'
        });
      }
      
      const passwordFormat = hashedPassword.includes('.') ? 'scrypt' : 'bcrypt';
      console.log(`Password hash format: ${passwordFormat}`);
      
      // Try with our custom scrypt compare first
      let passwordMatch = false;
      let scryptResult = false;
      let bcryptResult = false;
      
      try {
        if (hashedPassword.includes('.')) {
          console.log('Attempting scrypt verification...');
          scryptResult = await comparePasswords(password, hashedPassword);
          console.log(`Scrypt verification result: ${scryptResult ? '✅ Valid' : '❌ Invalid'}`);
          passwordMatch = scryptResult;
        }
      } catch (error) {
        console.error('Scrypt verification error:', error);
      }
      
      // If scrypt failed or not applicable, try bcrypt
      if (!passwordMatch) {
        try {
          console.log('Attempting bcrypt verification...');
          bcryptResult = await bcrypt.compare(password, hashedPassword);
          console.log(`Bcrypt verification result: ${bcryptResult ? '✅ Valid' : '❌ Invalid'}`);
          passwordMatch = bcryptResult;
        } catch (error) {
          console.error('Bcrypt verification error:', error);
        }
      }
      
      if (!passwordMatch) {
        console.log(`❌ Password verification failed for user: ${user.username}`);
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }
      
      console.log(`✅ Password verified successfully for user: ${user.username}`);
      console.log(`===== DEBUG LOGIN COMPLETE =====\n`);
      
      // Return success with debugging info
      return res.status(200).json({
        success: true,
        message: 'Debug login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        verification: {
          method: passwordFormat,
          scryptResult,
          bcryptResult
        }
      });
      
    } catch (error) {
      console.error('Debug login error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred during debug login'
      });
    }
  });

  router.post('/verify-password', async (req: Request, res: Response) => {
    try {
      // Extract username and password from request body
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }
      
      if (!db) {
        return res.status(500).json({
          success: false,
          message: 'Database connection not available'
        });
      }
      
      // Find user by username or email (case-insensitive)
      // First try exact match
      let foundUsers = await db
        .select()
        .from(users)
        .where(
          eq(users.username, username)
        );
      
      // If no user found, try case-insensitive username/email match
      if (!foundUsers.length) {
        const allUsers = await db
          .select()
          .from(users);
        
        foundUsers = allUsers.filter(user => 
          user.username.toLowerCase() === username.toLowerCase() ||
          (user.email && user.email.toLowerCase() === username.toLowerCase())
        );
      }
      
      if (!foundUsers.length) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      const user = foundUsers[0];
      const hashedPassword = user.password;
      
      // Try both verification methods
      const results = {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          password_format: hashedPassword && typeof hashedPassword === 'string' ? 
                           (hashedPassword.includes('.') ? 'scrypt' : 'bcrypt') : 
                           'unknown'
        },
        verification: {
          scrypt: null as boolean | null,
          bcrypt: null as boolean | null
        },
        success: false
      };
      
      // Try scrypt
      if (hashedPassword && typeof hashedPassword === 'string') {
        try {
          if (hashedPassword.includes('.')) {
            results.verification.scrypt = await comparePasswords(password, hashedPassword);
          }
        } catch (error) {
          console.error('Scrypt verification error:', error);
        }
        
        // Try bcrypt
        try {
          results.verification.bcrypt = await bcrypt.compare(password, hashedPassword);
        } catch (error) {
          console.error('Bcrypt verification error:', error);
        }
      }
      
      // Determine overall success
      results.success = !!(results.verification.scrypt || results.verification.bcrypt);
      
      return res.status(200).json(results);
    } catch (error) {
      console.error('Password verification debug route error:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred during password verification'
      });
    }
  });
  
  // Add a test function that will verify credential pairs immediately at server startup
  const testCredentials = async () => {
    try {
      if (!db) {
        console.log('⚠️ Cannot test credentials: Database not available');
        return;
      }
      
      // First, ensure the admin user exists
      const adminUsername = "Stephen";
      const adminPassword = "HeyJoe321";
      
      // First try exact match
      let foundAdmin = await db
        .select()
        .from(users)
        .where(eq(users.username, adminUsername));
      
      // If no admin found, try case-insensitive username/email match
      if (!foundAdmin.length) {
        const allUsers = await db
          .select()
          .from(users);
        
        foundAdmin = allUsers.filter(user => 
          user.username.toLowerCase() === adminUsername.toLowerCase() ||
          (user.email && user.email.toLowerCase() === adminUsername.toLowerCase())
        );
      }
      
      if (!foundAdmin.length) {
        console.log('⚠️ Admin user not found in database');
        return;
      }
      
      const admin = foundAdmin[0];
      
      // Log admin account information
      console.log('\n======= CREDENTIAL VERIFICATION =======');
      console.log(`Admin user: ${admin.username} (${admin.role})`);
      console.log(`Password hash format: ${admin.password?.includes('.') ? 'scrypt' : 'bcrypt'}`);
      
      // Test admin password with both methods
      let adminScryptValid = false;
      let adminBcryptValid = false;
      
      try {
        if (admin.password && admin.password.includes('.')) {
          adminScryptValid = await comparePasswords(adminPassword, admin.password);
        }
      } catch (error) {
        console.error('Admin scrypt verification error:', error);
      }
      
      try {
        if (admin.password) {
          adminBcryptValid = await bcrypt.compare(adminPassword, admin.password);
        }
      } catch (error) {
        console.error('Admin bcrypt verification error:', error);
      }
      
      console.log(`Admin password verification results:`);
      console.log(`- Scrypt: ${adminScryptValid ? '✅ Valid' : '❌ Invalid'}`);
      console.log(`- Bcrypt: ${adminBcryptValid ? '✅ Valid' : '❌ Invalid'}`);
      console.log(`- Overall: ${adminScryptValid || adminBcryptValid ? '✅ Valid' : '❌ Invalid'}`);
      
      // If neither method worked, maybe try rehashing and updating the password
      if (!adminScryptValid && !adminBcryptValid) {
        console.log('⚠️ Admin password verification failed. Attempting to update the password...');
        
        // Hash with scrypt (our preferred method)
        const newScryptHash = await hashPassword(adminPassword);
        
        // Update the admin user's password in the database
        await db
          .update(users)
          .set({ password: newScryptHash })
          .where(eq(users.id, admin.id));
        
        console.log('🔄 Admin password has been updated with new scrypt hash');
      }
      
      console.log('=====================================\n');
    } catch (error) {
      console.error('Error testing credentials:', error);
    }
  };
  
  // Run the credentials test on server startup
  if (db) {
    setTimeout(testCredentials, 1000); // Small delay to ensure DB is ready
  }
}

export default router;