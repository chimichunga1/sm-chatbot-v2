/**
 * Authentication middleware for JWT token verification and role-based access control
 */
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../lib/jwt';

// Extend Express Request to include user information
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Authenticate user using JWT access token from Authorization header
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - No token provided'
      });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const payload = verifyAccessToken(token);
    
    if (!payload) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Invalid or expired token'
      });
    }
    
    // Attach user info to request
    req.user = payload;
    
    // Continue to next middleware/route handler
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Check if user has Admin role
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  
  next();
};

/**
 * Check if user has Owner role
 */
export const requireOwner = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Owner access required'
    });
  }
  
  next();
};

/**
 * Check if user belongs to the same company (used for team access)
 */
export const requireSameCompany = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  // Get company ID from route parameter
  const companyId = parseInt(req.params.companyId);
  
  if (isNaN(companyId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid company ID'
    });
  }
  
  // Admin can access any company
  if (req.user.role === 'admin') {
    return next();
  }
  
  // Check if user belongs to the requested company
  if (req.user.companyId !== companyId) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to access this company'
    });
  }
  
  next();
};

/**
 * Combined middleware for checking admin, owner, or same company access
 * This allows admin users, company owners, or team members of the same company
 */
export const requireCompanyAccess = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  // Admin can access any company
  if (req.user.role === 'admin') {
    return next();
  }
  
  // Owner can access their own company
  if (req.user.role === 'owner' && req.user.companyId) {
    return next();
  }
  
  // Get company ID from route parameter
  const companyId = parseInt(req.params.companyId);
  
  if (isNaN(companyId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid company ID'
    });
  }
  
  // Check if team member belongs to the requested company
  if (req.user.companyId !== companyId) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to access this company'
    });
  }
  
  next();
};