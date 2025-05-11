import { Router, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { 
  insertIndustrySchema, 
  insertSystemPromptSchema 
} from "@shared/schema";
import { authenticate, requireAdmin } from "../middleware/auth";

export const adminRouter = Router();

// Apply middleware to all routes in this router
adminRouter.use(authenticate);
adminRouter.use(requireAdmin);

// Get admin dashboard stats
adminRouter.get("/stats", async (req: Request, res: Response) => {
  try {
    // Get total users
    const users = await storage.getAllUsers();
    const totalUsers = users.length;
    
    // Get active companies
    const companies = await storage.getAllCompanies();
    const activeCompanies = companies.filter(c => c.isActive).length;
    
    // Get total quotes
    const quotes = await storage.getAllQuotes();
    const totalQuotes = quotes.length;
    
    // Calculate AI processing usage (this is a placeholder - implement real metrics)
    const aiProcessingUsage = "1.2 GB"; // Example
    
    res.json({
      totalUsers,
      activeUsers: users.filter(u => u.isActive).length,
      totalQuotes,
      activeCompanies,
      aiProcessingUsage
    });
  } catch (err) {
    console.error("Error fetching admin stats:", err);
    res.status(500).json({ error: "Failed to fetch admin stats" });
  }
});

// Industries management
adminRouter.get("/industries", async (req: Request, res: Response) => {
  try {
    const industries = await storage.getAllIndustries();
    res.json(industries);
  } catch (err) {
    console.error("Error fetching industries:", err);
    res.status(500).json({ error: "Failed to fetch industries" });
  }
});

adminRouter.post("/industries", async (req: Request, res: Response) => {
  try {
    const industryData = insertIndustrySchema.parse(req.body);
    const industry = await storage.createIndustry(industryData);
    res.status(201).json(industry);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    console.error("Error creating industry:", err);
    res.status(500).json({ error: "Failed to create industry" });
  }
});

adminRouter.get("/industries/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid industry ID" });
    }
    
    const industry = await storage.getIndustry(id);
    if (!industry) {
      return res.status(404).json({ error: "Industry not found" });
    }
    
    res.json(industry);
  } catch (err) {
    console.error("Error fetching industry:", err);
    res.status(500).json({ error: "Failed to fetch industry" });
  }
});

adminRouter.put("/industries/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid industry ID" });
    }
    
    const industry = await storage.getIndustry(id);
    if (!industry) {
      return res.status(404).json({ error: "Industry not found" });
    }
    
    const updateData = insertIndustrySchema.partial().parse(req.body);
    const updatedIndustry = await storage.updateIndustry(id, updateData);
    
    res.json(updatedIndustry);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    console.error("Error updating industry:", err);
    res.status(500).json({ error: "Failed to update industry" });
  }
});

adminRouter.delete("/industries/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid industry ID" });
    }
    
    const industry = await storage.getIndustry(id);
    if (!industry) {
      return res.status(404).json({ error: "Industry not found" });
    }
    
    // Check if any system prompts are using this industry
    const systemPrompts = await storage.getAllSystemPrompts();
    const hasPrompts = systemPrompts.some(p => p.industryId === id);
    
    if (hasPrompts) {
      return res.status(400).json({ 
        error: "Cannot delete industry that is being used by system prompts" 
      });
    }
    
    const success = await storage.deleteIndustry(id);
    if (success) {
      res.status(204).end();
    } else {
      res.status(500).json({ error: "Failed to delete industry" });
    }
  } catch (err) {
    console.error("Error deleting industry:", err);
    res.status(500).json({ error: "Failed to delete industry" });
  }
});

// System prompts management
adminRouter.get("/system-prompts", async (req: Request, res: Response) => {
  try {
    const systemPrompts = await storage.getAllSystemPrompts();
    res.json(systemPrompts);
  } catch (err) {
    console.error("Error fetching system prompts:", err);
    res.status(500).json({ error: "Failed to fetch system prompts" });
  }
});

// Create a new system prompt
adminRouter.post("/system-prompts", async (req: Request, res: Response) => {
  try {
    const promptData = insertSystemPromptSchema.parse(req.body);
    
    // If this is a core prompt, check if one already exists
    if (promptData.promptType === "core") {
      const existingCorePrompt = await storage.getCoreSystemPrompt();
      if (existingCorePrompt) {
        return res.status(400).json({ 
          error: "A core system prompt already exists. Please update the existing prompt instead of creating a new one." 
        });
      }
    }
    
    const systemPrompt = await storage.createSystemPrompt(promptData);
    res.status(201).json(systemPrompt);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    console.error("Error creating system prompt:", err);
    res.status(500).json({ error: "Failed to create system prompt" });
  }
});

// Update a system prompt by ID
adminRouter.put("/system-prompts/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid system prompt ID" });
    }
    
    const systemPrompt = await storage.getSystemPrompt(id);
    if (!systemPrompt) {
      return res.status(404).json({ error: "System prompt not found" });
    }
    
    const updateData = insertSystemPromptSchema.partial().parse(req.body);
    const updatedPrompt = await storage.updateSystemPrompt(id, updateData);
    
    res.json(updatedPrompt);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    console.error("Error updating system prompt:", err);
    res.status(500).json({ error: "Failed to update system prompt" });
  }
});

adminRouter.get("/system-prompts/core", async (req: Request, res: Response) => {
  try {
    const systemPrompt = await storage.getCoreSystemPrompt();
    if (!systemPrompt) {
      return res.status(404).json({ error: "Core system prompt not found" });
    }
    res.json(systemPrompt);
  } catch (err) {
    console.error("Error fetching core system prompt:", err);
    res.status(500).json({ error: "Failed to fetch core system prompt" });
  }
});

adminRouter.get("/system-prompts/industry/:industryId", async (req: Request, res: Response) => {
  try {
    const industryId = parseInt(req.params.industryId);
    if (isNaN(industryId)) {
      return res.status(400).json({ error: "Invalid industry ID" });
    }
    
    const systemPrompt = await storage.getIndustrySystemPrompt(industryId);
    if (!systemPrompt) {
      return res.status(404).json({ error: "Industry system prompt not found" });
    }
    
    res.json(systemPrompt);
  } catch (err) {
    console.error("Error fetching industry system prompt:", err);
    res.status(500).json({ error: "Failed to fetch industry system prompt" });
  }
});

adminRouter.get("/system-prompts/client/:companyId", async (req: Request, res: Response) => {
  try {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) {
      return res.status(400).json({ error: "Invalid company ID" });
    }
    
    const systemPrompt = await storage.getClientSystemPrompt(companyId);
    if (!systemPrompt) {
      return res.status(404).json({ error: "Client system prompt not found" });
    }
    
    res.json(systemPrompt);
  } catch (err) {
    console.error("Error fetching client system prompt:", err);
    res.status(500).json({ error: "Failed to fetch client system prompt" });
  }
});

// Get all system prompts by type (core, industry, client)
adminRouter.get("/system-prompts/type/:type", async (req: Request, res: Response) => {
  try {
    const type = req.params.type;
    if (!['core', 'industry', 'client'].includes(type)) {
      return res.status(400).json({ error: "Invalid prompt type" });
    }
    
    const systemPrompts = await storage.getSystemPromptsByType(type);
    res.json(systemPrompts);
  } catch (err) {
    console.error(`Error fetching ${req.params.type} system prompts:`, err);
    res.status(500).json({ error: `Failed to fetch ${req.params.type} system prompts` });
  }
});

// Users management endpoints
adminRouter.get("/users", async (req: Request, res: Response) => {
  try {
    const users = await storage.getAllUsers();
    
    // Remove sensitive information before sending response
    const safeUsers = users.map(user => ({
      ...user,
      password: undefined,
      xeroTokenSet: undefined
    }));
    
    res.json(safeUsers);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

adminRouter.get("/users/:id", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Remove sensitive information
    const safeUser = {
      ...user,
      password: undefined,
      xeroTokenSet: undefined
    };
    
    res.json(safeUser);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default adminRouter;