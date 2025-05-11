import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { comparePasswords } from "../lib/auth-helpers";

// Define schemas for admin login
const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Create router
const adminAuthRouter = Router();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "admin-secret-key-change-in-production";
const JWT_EXPIRY = "24h"; // Token expires after 24 hours

// Admin authentication middleware
export const verifyAdminToken = (req: Request, res: Response, next: NextFunction) => {
  // Get the token from the authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string };
    
    if (decoded.role !== "admin" && decoded.role !== "owner") {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    
    // Add admin user to request
    (req as any).adminUser = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Admin login endpoint
adminAuthRouter.post("/login", async (req: Request, res: Response) => {
  try {
    // Validate login data
    const loginData = adminLoginSchema.parse(req.body);
    
    // Get all users to find a case-insensitive match
    const users = await storage.getAllUsers();
    const user = users.find(u => 
      u.username.toLowerCase() === loginData.username.toLowerCase() && 
      (u.role === "admin" || u.role === "owner")
    );
    
    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }
    
    // Verify password
    const isValid = await comparePasswords(loginData.password, user.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }
    
    // Create token with admin information
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        name: user.name, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
    
    // Return token and admin user info
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name || "", // Ensure name is not null
        role: user.role
      }
    });
  } catch (error) {
    console.error("Admin login error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// Check admin authentication status
adminAuthRouter.get("/status", verifyAdminToken, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser;
  
  if (adminUser) {
    res.json({ 
      authenticated: true, 
      user: adminUser 
    });
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

// Admin logout - client should discard the token and also logout from regular session
adminAuthRouter.post("/logout", (req: Request, res: Response) => {
  // Logout from regular session if authenticated
  if (req.isAuthenticated()) {
    req.logout((err) => {
      if (err) {
        console.error("Error during session logout:", err);
        // Continue with response even if there's an error with the session logout
      }
      
      res.status(200).json({ 
        success: true, 
        message: "Logout successful" 
      });
    });
  } else {
    res.status(200).json({ 
      success: true, 
      message: "Logout successful" 
    });
  }
});

export default adminAuthRouter;