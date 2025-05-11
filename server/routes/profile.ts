import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { storage } from '../storage';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = Router();

// Debug middleware
const debugLog = (req: Request, res: Response, next: Function) => {
  console.log(`Profile API: ${req.method} ${req.path} - Auth: ${!!req.user}`);
  next();
};

// Apply debugging to all routes
router.use(debugLog);

// Setup uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage_config,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(null, false);
    }
    cb(null, true);
  }
});

// Get user profile
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove sensitive info
    const safeUser = {
      ...user,
      password: undefined,
      xeroTokenSet: undefined
    };

    return res.json({
      success: true,
      profile: safeUser
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

// Update user profile (text data)
router.put('/', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { name, email, avatarUrl } = req.body;
    
    // Validate fields
    if (!name && !email && !avatarUrl) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    // Create update object with only provided fields
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (avatarUrl) updateData.avatarUrl = avatarUrl;

    // Update the user
    const updatedUser = await storage.updateUser(userId, updateData);
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove sensitive info
    const safeUser = {
      ...updatedUser,
      password: undefined,
      xeroTokenSet: undefined
    };

    return res.json({
      success: true,
      profile: safeUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

// Create this as a separate endpoint to handle file uploads
router.post('/upload-avatar', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Get file path - ensure it's properly formed for browser access
    const filePath = `/uploads/${req.file.filename}`;
    
    // Get the host and protocol to construct a full URL
    const host = req.get('host');
    const protocol = req.protocol;
    
    // Create a proper URL that will work in the browser
    const fullAvatarUrl = `${protocol}://${host}${filePath}`;
    
    console.log(`Avatar uploaded, saving path: ${fullAvatarUrl}`);
    
    // Update user with new avatar URL
    const updatedUser = await storage.updateUser(userId, {
      avatarUrl: fullAvatarUrl
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      avatarUrl: fullAvatarUrl
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

export const profileRouter = router;