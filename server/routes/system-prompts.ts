import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertSystemPromptSchema } from "@shared/schema";
import multer from "multer";
import { promises as fs } from "fs";
import path from "path";
import pdfParse from "pdf-parse";

// Define our own isAuthenticated and isAdmin middleware to avoid circular imports
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && (req.user as any).role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Forbidden: Admin access required' });
};

// Set up multer for file upload
const upload = multer({
  dest: path.join(process.cwd(), "uploads"),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only PDF files are allowed'));
    }
  }
});

export const systemPromptRouter = Router();

// Create a new system prompt
systemPromptRouter.post("/", isAdmin, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const promptData = insertSystemPromptSchema.parse({
      ...req.body,
      createdBy: userId,
      companyId: user.companyId,
    });
    
    const prompt = await storage.createSystemPrompt(promptData);
    res.status(201).json(prompt);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    console.error("Error creating system prompt:", err);
    res.status(500).json({ error: "Failed to create system prompt" });
  }
});

// Get all system prompts for the company
systemPromptRouter.get("/", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (!user.companyId) {
      return res.status(400).json({ error: "User is not associated with a company" });
    }
    
    const prompts = await storage.getAllSystemPromptsByCompanyId(user.companyId);
    res.json(prompts);
  } catch (err) {
    console.error("Error fetching system prompts:", err);
    res.status(500).json({ error: "Failed to fetch system prompts" });
  }
});

// Get a specific system prompt
systemPromptRouter.get("/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const promptId = parseInt(req.params.id);
    if (isNaN(promptId)) {
      return res.status(400).json({ error: "Invalid prompt ID" });
    }
    
    const prompt = await storage.getSystemPrompt(promptId);
    if (!prompt) {
      return res.status(404).json({ error: "System prompt not found" });
    }
    
    res.json(prompt);
  } catch (err) {
    console.error("Error fetching system prompt:", err);
    res.status(500).json({ error: "Failed to fetch system prompt" });
  }
});

// Update a system prompt
systemPromptRouter.patch("/:id", isAdmin, async (req: Request, res: Response) => {
  try {
    const promptId = parseInt(req.params.id);
    if (isNaN(promptId)) {
      return res.status(400).json({ error: "Invalid prompt ID" });
    }
    
    const prompt = await storage.getSystemPrompt(promptId);
    if (!prompt) {
      return res.status(404).json({ error: "System prompt not found" });
    }
    
    const updateData = req.body;
    const updatedPrompt = await storage.updateSystemPrompt(promptId, updateData);
    
    res.json(updatedPrompt);
  } catch (err) {
    console.error("Error updating system prompt:", err);
    res.status(500).json({ error: "Failed to update system prompt" });
  }
});

// Delete a system prompt
systemPromptRouter.delete("/:id", isAdmin, async (req: Request, res: Response) => {
  try {
    const promptId = parseInt(req.params.id);
    if (isNaN(promptId)) {
      return res.status(400).json({ error: "Invalid prompt ID" });
    }
    
    const deleted = await storage.deleteSystemPrompt(promptId);
    if (!deleted) {
      return res.status(404).json({ error: "System prompt not found" });
    }
    
    res.status(204).end();
  } catch (err) {
    console.error("Error deleting system prompt:", err);
    res.status(500).json({ error: "Failed to delete system prompt" });
  }
});

// Set a system prompt as active
systemPromptRouter.post("/:id/activate", isAdmin, async (req: Request, res: Response) => {
  try {
    const promptId = parseInt(req.params.id);
    if (isNaN(promptId)) {
      return res.status(400).json({ error: "Invalid prompt ID" });
    }
    
    const prompt = await storage.getSystemPrompt(promptId);
    if (!prompt) {
      return res.status(404).json({ error: "System prompt not found" });
    }
    
    const updatedPrompt = await storage.updateSystemPrompt(promptId, { isActive: true });
    
    res.json(updatedPrompt);
  } catch (err) {
    console.error("Error activating system prompt:", err);
    res.status(500).json({ error: "Failed to activate system prompt" });
  }
});

// Upload a PDF and extract system prompt from it
systemPromptRouter.post("/upload", isAdmin, upload.single('promptFile'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded or invalid file type" });
    }
    
    const userId = (req.user as any).id;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (!user.companyId) {
      return res.status(400).json({ error: "User is not associated with a company" });
    }
    
    const { name, description, promptType } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "Prompt name is required" });
    }
    
    // Extract text from PDF using pdf-parse
    const pdfPath = req.file.path;
    let extractedText = '';
    
    try {
      // Read the PDF file
      const dataBuffer = await fs.readFile(pdfPath);
      
      // Parse the PDF content
      const pdfData = await pdfParse(dataBuffer);
      
      // Extract the text content
      extractedText = pdfData.text;
      
      console.log(`Successfully extracted ${extractedText.length} characters from PDF`);
      
      if (extractedText.length === 0) {
        console.error("Warning: Extracted text is empty");
        extractedText = "No text content extracted from PDF. This may be due to a scanned document or image-based PDF.";
      }
    } catch (pdfError) {
      console.error("Error parsing PDF:", pdfError);
      extractedText = "Error extracting text from PDF. Using prompt name as content.";
    }
    
    // Create a system prompt with the extracted content
    const promptData = {
      name,
      content: extractedText,
      isActive: false, // New prompts are not active by default
      createdBy: userId,
      companyId: user.companyId,
    };
    
    const prompt = await storage.createSystemPrompt(promptData);
    
    // Clean up the temporary file
    await fs.unlink(pdfPath);
    
    res.status(201).json(prompt);
  } catch (err) {
    console.error("Error processing uploaded prompt file:", err);
    
    // Clean up the temporary file if it exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkErr) {
        console.error("Error deleting temporary file:", unlinkErr);
      }
    }
    
    res.status(500).json({ error: "Failed to process uploaded prompt file" });
  }
});