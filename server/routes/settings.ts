import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { authenticate } from '../middleware/auth';
import { storage } from '../storage';
import { InsertUserPreferences } from '../../shared/schema';

const router = Router();

// Debug middleware for settings routes
const debugSettings = (req: Request, res: Response, next: Function) => {
  console.log(`[Settings Route] ${req.method} ${req.path} - Auth: ${!!req.user}`);
  next();
};

// Apply debugging to all routes
router.use(debugSettings);

// Theme settings endpoint - no authentication required for demo
router.post('/theme', async (req, res) => {
  try {
    console.log('POST /theme - Processing theme update request', req.body);
    const { mode, variant, primary, radius } = req.body;
    
    // Validate theme data
    if (!mode || !variant || !primary || radius === undefined) {
      console.log('Invalid theme data received', req.body);
      return res.status(400).json({ error: 'Invalid theme data' });
    }
    
    // Create the theme object
    const themeData = {
      appearance: mode,
      variant,
      primary,
      radius,
    };
    
    console.log('Writing theme data to theme.json:', themeData);
    
    // Write to theme.json
    const themePath = path.join(process.cwd(), 'theme.json');
    try {
      fs.writeFileSync(themePath, JSON.stringify(themeData, null, 2));
      console.log('Theme data successfully written to file');
    } catch (writeError) {
      console.error('Error writing theme file:', writeError);
      return res.status(500).json({ 
        error: 'Failed to write theme data to file', 
        details: writeError instanceof Error ? writeError.message : 'Unknown error' 
      });
    }
    
    return res.json({ success: true, theme: themeData });
  } catch (error) {
    console.error('Error updating theme:', error);
    return res.status(500).json({ 
      error: 'Failed to update theme', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get current theme settings - available without authentication for initial app load
router.get('/theme', async (req, res) => {
  try {
    console.log('GET /theme - Retrieving theme settings');
    const themePath = path.join(process.cwd(), 'theme.json');
    
    if (!fs.existsSync(themePath)) {
      console.log('Theme file not found, providing default theme');
      // Return default theme if file doesn't exist
      return res.json({
        mode: 'light',
        variant: 'vibrant',
        primary: '#0f766e',
        radius: 0.5
      });
    }
    
    // Read the theme file
    const themeContent = fs.readFileSync(themePath, 'utf8');
    console.log('Theme file content:', themeContent);
    
    try {
      const themeData = JSON.parse(themeContent);
      
      // Convert to client-side format with fallbacks
      const clientTheme = {
        mode: themeData.appearance || 'light',
        variant: themeData.variant || 'vibrant', 
        primary: themeData.primary || '#0f766e',
        radius: themeData.radius !== undefined ? themeData.radius : 0.5,
      };
      
      console.log('Returning theme settings:', clientTheme);
      return res.json(clientTheme);
    } catch (parseError) {
      console.error('Error parsing theme.json:', parseError);
      // Return default theme if parsing fails
      return res.json({
        mode: 'light',
        variant: 'vibrant',
        primary: '#0f766e',
        radius: 0.5
      });
    }
  } catch (error) {
    console.error('Error reading theme:', error);
    return res.status(500).json({ 
      error: 'Failed to read theme',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// User preferences routes - require authentication
router.get('/preferences', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated'
      });
    }

    const userPreferences = await storage.getUserPreferences(userId);
    
    if (!userPreferences) {
      return res.status(404).json({
        success: false,
        message: 'User preferences not found'
      });
    }
    
    return res.json({
      success: true,
      preferences: userPreferences
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

router.post('/preferences', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated'
      });
    }
    
    const { theme, notifications, displayPreferences } = req.body;
    
    // Check if user preferences already exist
    const existingPrefs = await storage.getUserPreferences(userId);
    
    let userPreferences;
    if (existingPrefs) {
      // Update existing preferences
      userPreferences = await storage.updateUserPreferences(userId, {
        theme,
        notifications,
        displayPreferences
      });
    } else {
      // Create new preferences
      userPreferences = await storage.createUserPreferences({
        userId,
        theme: theme || null,
        notifications: notifications || null,
        displayPreferences: displayPreferences || null
      });
    }
    
    return res.json({
      success: true,
      preferences: userPreferences
    });
  } catch (error) {
    console.error('Error creating/updating user preferences:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

router.put('/preferences', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated'
      });
    }
    
    const { theme, notifications, displayPreferences } = req.body;
    
    // Check if user preferences exist
    const existingPrefs = await storage.getUserPreferences(userId);
    
    if (!existingPrefs) {
      return res.status(404).json({
        success: false,
        message: 'User preferences not found'
      });
    }
    
    // Update preferences
    const userPreferences = await storage.updateUserPreferences(userId, {
      theme,
      notifications,
      displayPreferences
    });
    
    return res.json({
      success: true,
      preferences: userPreferences
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

export default router;