import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { hashPassword } from "../lib/auth-helpers";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user is admin
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user && (req.user as any).role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
};

const router = Router();

// Helper middleware to log API requests
const debugLog = (req: Request, res: Response, next: Function) => {
  console.log(`Users API called: { path: '${req.path}', method: '${req.method}', authenticated: ${req.isAuthenticated()}, user: '${req.user ? `User #${(req.user as any).id}` : 'Not authenticated'}' }`);
  next();
};

// Get all users (admin only)
router.get('/', isAuthenticated, debugLog, async (req: Request, res: Response) => {
  try {
    // Allow admin to get all users or users from their company
    const isUserAdmin = (req.user as any).role === 'admin';
    const userCompanyId = (req.user as any).companyId;
    
    let users;
    if (isUserAdmin) {
      if (userCompanyId) {
        // Admin can see all users in their company
        users = await storage.getUsersByCompanyId(userCompanyId);
      } else {
        // Super admin can see all users
        users = await storage.getAllUsers();
      }
    } else {
      // Regular users can only see users in their company
      if (!userCompanyId) {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      users = await storage.getUsersByCompanyId(userCompanyId);
    }
    
    // Hide sensitive info like passwords
    const safeUsers = users.map(user => ({
      ...user,
      password: undefined,
      xeroTokenSet: undefined
    }));
    
    res.json(safeUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: (error as Error).message });
  }
});

// Get a single user by ID
router.get('/:id', isAuthenticated, debugLog, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Check if the requesting user is admin or the same user
    const isUserAdmin = (req.user as any).role === 'admin';
    const isOwnProfile = (req.user as any).id === userId;
    const userCompanyId = (req.user as any).companyId;
    
    if (!isUserAdmin && !isOwnProfile) {
      return res.status(403).json({ message: "You don't have permission to view this user" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // For non-admin, ensure user is from same company
    if (!isUserAdmin && user.companyId !== userCompanyId) {
      return res.status(403).json({ message: "You don't have permission to view this user" });
    }
    
    // Remove sensitive info
    const safeUser = {
      ...user,
      password: undefined,
      xeroTokenSet: undefined
    };
    
    res.json(safeUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user', error: (error as Error).message });
  }
});

// Create a new user (admin only)
router.post('/', isAuthenticated, isAdmin, debugLog, async (req: Request, res: Response) => {
  try {
    console.log('Creating new user:', req.body);
    
    // Validate the request data
    const userData = insertUserSchema.parse(req.body);
    
    // Check if username or email already exists
    const existingUserByUsername = await storage.getUserByUsername(userData.username);
    if (existingUserByUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    const existingUserByEmail = await storage.getUserByEmail(userData.email);
    if (existingUserByEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // Hash the password if provided
    if (userData.password) {
      userData.password = await hashPassword(userData.password);
    }
    
    // Ensure companyId is set to the admin's company if not provided
    if (!userData.companyId) {
      userData.companyId = (req.user as any).companyId;
    }
    
    // Create the user
    const newUser = await storage.createUser(userData);
    
    // Remove sensitive data
    const safeUser = {
      ...newUser,
      password: undefined
    };
    
    res.status(201).json(safeUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user', error: (error as Error).message });
  }
});

// Update a user
router.patch('/:id', isAuthenticated, debugLog, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Check if user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check permissions - must be admin or own profile
    const isUserAdmin = (req.user as any).role === 'admin';
    const isOwnProfile = (req.user as any).id === userId;
    
    if (!isUserAdmin && !isOwnProfile) {
      return res.status(403).json({ message: "You don't have permission to update this user" });
    }
    
    // For non-admin users, restrict what can be updated
    let userData = { ...req.body };
    
    // Non-admins can't update role or isActive status
    if (!isUserAdmin) {
      delete userData.role;
      delete userData.isActive;
      delete userData.companyId;
    }
    
    // If password is being updated, hash it
    if (userData.password) {
      userData.password = await hashPassword(userData.password);
    }
    
    // Update the user
    const updatedUser = await storage.updateUser(userId, userData);
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove sensitive info
    const safeUser = {
      ...updatedUser,
      password: undefined,
      xeroTokenSet: undefined
    };
    
    res.json(safeUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user', error: (error as Error).message });
  }
});

// Delete a user (admin only)
router.delete('/:id', isAuthenticated, isAdmin, debugLog, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Get the user to check permissions
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent self-deletion
    if ((req.user as any).id === userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    // For safety, just deactivate the user instead of full deletion
    const updatedUser = await storage.updateUser(userId, { isActive: false });
    if (!updatedUser) {
      return res.status(500).json({ message: 'Failed to deactivate user' });
    }
    
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ message: 'Failed to deactivate user', error: (error as Error).message });
  }
});

export const usersRouter = router;