import { Request, Response, NextFunction } from "express";

/**
 * Middleware to check if user is authenticated
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized - Please login to access this resource" });
}

/**
 * Middleware to check if user is admin
 */
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ error: "Forbidden - Admin access required" });
}

/**
 * Middleware to check if user is company owner
 */
export function isOwner(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user && 
     (req.user.role === "owner" || req.user.role === "admin")) {
    return next();
  }
  return res.status(403).json({ error: "Forbidden - Owner access required" });
}

/**
 * Middleware to check if user belongs to the specified company
 */
export function isSameCompany(req: Request, res: Response, next: NextFunction) {
  const companyId = parseInt(req.params.companyId);
  
  if (req.isAuthenticated() && req.user) {
    // Admins can access any company
    if (req.user.role === "admin") {
      return next();
    }
    
    // Company owners and members can only access their own company
    if (req.user.companyId === companyId) {
      return next();
    }
  }
  
  return res.status(403).json({ error: "Forbidden - You don't have access to this company's data" });
}