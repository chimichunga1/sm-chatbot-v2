import { Router, Request, Response } from 'express';
import { authenticate, requireOwner } from '../middleware/auth';
import { storage } from '../storage';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { insertCompanySchema } from '../../shared/schema';
import { z } from 'zod';

const router = Router();

// Debug middleware
const debugLog = (req: Request, res: Response, next: Function) => {
  console.log(`Company API: ${req.method} ${req.path} - Auth: ${!!req.user}`);
  next();
};

// Apply debugging to all routes
router.use(debugLog);

// Setup uploads directory for company logos
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
    cb(null, 'company-logo-' + uniqueSuffix + ext);
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

// Get company information
router.get('/', authenticate, async (req, res) => {
  try {
    const userCompanyId = req.user?.companyId;
    
    if (!userCompanyId) {
      return res.status(404).json({
        success: false,
        message: 'No company associated with this user'
      });
    }

    const company = await storage.getCompany(userCompanyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    return res.json({
      success: true,
      company: company
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

// Update company information
router.put('/', authenticate, async (req, res) => {
  try {
    const userCompanyId = req.user?.companyId;
    const userRole = req.user?.role;
    
    if (!userCompanyId) {
      return res.status(404).json({
        success: false,
        message: 'No company associated with this user'
      });
    }

    // Only admin or owner can update company info
    if (userRole !== 'admin' && userRole !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only admins or company owners can update company information'
      });
    }

    // Validate input data
    const updateData = insertCompanySchema.partial().safeParse(req.body);
    
    if (!updateData.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company data',
        errors: updateData.error.format()
      });
    }

    // Update the company
    const updatedCompany = await storage.updateCompany(userCompanyId, updateData.data);
    
    if (!updatedCompany) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    return res.json({
      success: true,
      company: updatedCompany
    });
  } catch (error) {
    console.error('Error updating company:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

// Upload company logo
router.post('/upload-logo', authenticate, upload.single('logo'), async (req, res) => {
  try {
    const userCompanyId = req.user?.companyId;
    const userRole = req.user?.role;
    
    if (!userCompanyId) {
      return res.status(404).json({
        success: false,
        message: 'No company associated with this user'
      });
    }

    // Only admin or owner can update company logo
    if (userRole !== 'admin' && userRole !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only admins or company owners can update company logo'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Get file path
    const filePath = `/uploads/${req.file.filename}`;
    
    // Update company with new logo URL
    const updatedCompany = await storage.updateCompany(userCompanyId, {
      logo: filePath
    });

    if (!updatedCompany) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    return res.json({
      success: true,
      logo: filePath
    });
  } catch (error) {
    console.error('Error uploading company logo:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

// Create a new company (admin only)
router.post('/', requireOwner, async (req, res) => {
  try {
    // Validate the request data
    const companyData = insertCompanySchema.parse(req.body);
    
    // Create the company
    const newCompany = await storage.createCompany(companyData);
    
    return res.status(201).json({
      success: true,
      company: newCompany
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    
    console.error('Error creating company:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

export const companyRouter = router;