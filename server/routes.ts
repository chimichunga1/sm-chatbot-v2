import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertCompanySchema, 
  insertQuoteSchema, 
  insertTrainingDataSchema, 
  insertSystemPromptSchema, 
  insertUserOnboardingSchema
} from "@shared/schema";
import { z } from "zod";
import { xeroRouter } from "./routes/xero";
import { aiRouter } from "./routes/ai";
import { XeroClient } from "xero-node";
import { quotesRouter } from "./routes/quotes";
import { adminRouter } from "./routes/admin";
import adminAuthRouter from "./routes/admin-auth";
import settingsRouter from "./routes/settings";
import clientsRouter from "./routes/clients";
import authRouter from "./routes/auth";
import { profileRouter } from "./routes/profile";
import { companyRouter } from "./routes/company";
import cookieParser from "cookie-parser";
import { 
  authenticate, 
  requireAdmin, 
  requireOwner, 
  requireSameCompany, 
  requireCompanyAccess 
} from "./middleware/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Determine if we're running in Replit's environment
  const isReplit = !!process.env.REPL_SLUG || !!process.env.REPL_OWNER;
  
  console.log(`Running in environment: ${isReplit ? 'Replit' : process.env.NODE_ENV || 'development'}`);
  
  // Setup cookie parser for handling refresh tokens
  app.use(cookieParser());

  // All authentication is now handled by the auth router
  // This includes local username/password, Google, Firebase, and other OAuth providers
  app.use('/api/auth', authRouter);

  // User Routes
  app.get("/api/users", authenticate, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.role === "admin") {
        const users = await storage.getAllUsers();
        res.json(users);
      } else {
        const users = await storage.getUsersByCompanyId(user.companyId);
        res.json(users);
      }
    } catch (err) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.get("/api/users/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const requestUser = req.user as any;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only admin or users from same company can view user details
      if (requestUser.role === "admin" || requestUser.companyId === user.companyId) {
        res.json(user);
      } else {
        res.status(403).json({ message: "Forbidden" });
      }
    } catch (err) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });

  app.put("/api/users/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const requestUser = req.user as any;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only admin or the user themselves can update
      if (requestUser.role === "admin" || requestUser.id === id) {
        const updateData = insertUserSchema.partial().parse(req.body);
        const updatedUser = await storage.updateUser(id, updateData);
        res.json(updatedUser);
      } else {
        res.status(403).json({ message: "Forbidden" });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ errors: err.errors });
      }
      res.status(500).json({ message: "Error updating user" });
    }
  });

  // Quotes routes are now handled by quotesRouter in server/routes/quotes.ts

  // Training Data Routes
  app.get("/api/training", authenticate, async (req, res) => {
    try {
      const user = req.user as any;
      let trainingData;
      
      if (user.role === "admin") {
        trainingData = await storage.getTrainingDataByCompanyId(user.companyId);
      } else {
        trainingData = await storage.getTrainingDataByCompanyId(user.companyId);
      }
      
      res.json(trainingData);
    } catch (err) {
      res.status(500).json({ message: "Error fetching training data" });
    }
  });

  app.post("/api/training", authenticate, async (req, res) => {
    try {
      const user = req.user as any;
      const trainingData = insertTrainingDataSchema.parse({
        ...req.body,
        userId: user.id,
        companyId: user.companyId
      });
      
      const data = await storage.createTrainingData(trainingData);
      res.status(201).json(data);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ errors: err.errors });
      }
      res.status(500).json({ message: "Error creating training data" });
    }
  });

  // AI Routes
  // AI Chat endpoint using our custom handler
  app.post("/api/ai/chat", authenticate, async (req, res) => {
    try {
      // Import AI handler
      const { handleAIChat } = await import('./lib/ai-handler');
      
      // Pass request and response to the handler
      return await handleAIChat(req, res);
    } catch (err) {
      console.error('Error in AI chat endpoint:', err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.post("/api/ai/completion", authenticate, async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }
      
      // In a real implementation, this would call an LLM API
      const completion = "This is a placeholder completion response. In a real implementation, this would be generated by an AI model.";
      
      // Stream the response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Send the full completion at once for the mock implementation
      res.write(`data: ${JSON.stringify({ text: completion, done: false })}\n\n`);
      res.write(`data: ${JSON.stringify({ text: '', done: true })}\n\n`);
      res.end();
      
    } catch (err) {
      console.error('Error in AI completion endpoint:', err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.post("/api/ai/generate-quote", authenticate, async (req, res) => {
    try {
      const { description } = req.body;
      
      if (!description) {
        return res.status(400).json({ error: "Project description is required" });
      }
      
      // In a real implementation, this would use an LLM to generate a quote
      // For now, we'll create a placeholder response
      const aiGeneratedQuote = `
Based on your project description: "${description}"

Here's a cost estimate:

1. Planning & Analysis: $1,500
2. Design & Development: $4,800
3. Testing & Quality Assurance: $1,200
4. Deployment & Training: $900
5. Contingency (10%): $840

Total Estimate: $9,240

This is a ballpark figure based on industry averages. Actual costs may vary based on specific requirements and timeline changes.
`;
      
      res.json({ quote: aiGeneratedQuote });
    } catch (err) {
      console.error('Error generating quote with AI:', err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin Routes
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const quotes = await storage.getAllQuotes();
      const companies = await storage.getAllCompanies();
      
      const stats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.isActive).length,
        totalQuotes: quotes.length,
        activeCompanies: companies.filter(c => c.isActive).length,
        aiProcessingUsage: "28 GB"  // Placeholder for now
      };
      
      res.json(stats);
    } catch (err) {
      res.status(500).json({ message: "Error fetching admin stats" });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  // User Onboarding Routes
  app.get("/api/onboarding", authenticate, async (req, res) => {
    try {
      const user = req.user as any;
      const onboarding = await storage.getUserOnboarding(user.id);
      
      if (!onboarding) {
        return res.status(404).json({ message: "Onboarding data not found" });
      }
      
      res.json(onboarding);
    } catch (err) {
      res.status(500).json({ message: "Error fetching onboarding data" });
    }
  });

  app.post("/api/onboarding", authenticate, async (req, res) => {
    try {
      const user = req.user as any;
      const existingOnboarding = await storage.getUserOnboarding(user.id);
      
      if (existingOnboarding) {
        return res.status(400).json({ message: "Onboarding data already exists" });
      }
      
      const onboardingData = insertUserOnboardingSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const onboarding = await storage.createUserOnboarding(onboardingData);
      res.status(201).json(onboarding);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ errors: err.errors });
      }
      res.status(500).json({ message: "Error creating onboarding data" });
    }
  });

  app.put("/api/onboarding", authenticate, async (req, res) => {
    try {
      const user = req.user as any;
      const existingOnboarding = await storage.getUserOnboarding(user.id);
      
      if (!existingOnboarding) {
        return res.status(404).json({ message: "Onboarding data not found" });
      }
      
      const updateData = insertUserOnboardingSchema.partial().parse(req.body);
      const updatedOnboarding = await storage.updateUserOnboarding(user.id, updateData);
      res.json(updatedOnboarding);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ errors: err.errors });
      }
      res.status(500).json({ message: "Error updating onboarding data" });
    }
  });

  // Xero Integration Routes
  app.use("/api/xero", xeroRouter);
  
  // Import AI line items router
  const aiLinesRouter = (await import('./routes/ai-lines')).default;
  
  // Enhanced AI Routes
  app.use("/api/ai", aiRouter);
  app.use("/api/ai", aiLinesRouter);
  
  // Quotes Routes
  app.use("/api/quotes", quotesRouter);
  
  // Admin authentication routes (separate from regular auth)
  app.use("/api/admin-auth", adminAuthRouter);
  
  // Admin routes - apply auth middleware
  app.use("/api/admin", authenticate, requireAdmin, adminRouter);
  
  // Settings routes - no universal authentication required
  // Individual routes handle their own authentication as needed
  app.use("/api/settings", settingsRouter);
  
  // Clients Routes
  app.use("/api/clients", clientsRouter);

  // Profile Routes
  app.use("/api/profile", profileRouter);

  // Company Routes
  app.use("/api/company", companyRouter);
  
  // System Prompt Routes
  app.get("/api/system-prompts", authenticate, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user.companyId) {
        return res.status(400).json({ message: "User does not belong to a company" });
      }
      
      const prompts = await storage.getAllSystemPromptsByCompanyId(user.companyId);
      res.json(prompts);
    } catch (err) {
      res.status(500).json({ message: "Error fetching system prompts" });
    }
  });
  
  app.get("/api/system-prompts/active", authenticate, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user.companyId) {
        return res.status(400).json({ message: "User does not belong to a company" });
      }
      
      const activePrompt = await storage.getActiveSystemPrompt(user.companyId);
      if (!activePrompt) {
        return res.status(404).json({ message: "No active system prompt found" });
      }
      
      res.json(activePrompt);
    } catch (err) {
      res.status(500).json({ message: "Error fetching active system prompt" });
    }
  });
  
  app.get("/api/system-prompts/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const prompt = await storage.getSystemPrompt(id);
      
      if (!prompt) {
        return res.status(404).json({ message: "System prompt not found" });
      }
      
      const user = req.user as any;
      
      // Check if user has access to this prompt
      if (user.role === "admin" || prompt.companyId === user.companyId) {
        res.json(prompt);
      } else {
        res.status(403).json({ message: "Forbidden" });
      }
    } catch (err) {
      res.status(500).json({ message: "Error fetching system prompt" });
    }
  });
  
  app.post("/api/system-prompts", requireAdmin, async (req, res) => {
    try {
      const user = req.user as any;
      const promptData = insertSystemPromptSchema.parse({
        ...req.body,
        createdBy: user.id,
        companyId: user.companyId
      });
      
      const prompt = await storage.createSystemPrompt(promptData);
      res.status(201).json(prompt);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ errors: err.errors });
      }
      res.status(500).json({ message: "Error creating system prompt" });
    }
  });
  
  app.put("/api/system-prompts/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const prompt = await storage.getSystemPrompt(id);
      
      if (!prompt) {
        return res.status(404).json({ message: "System prompt not found" });
      }
      
      const user = req.user as any;
      
      // Check if user has access to update this prompt
      if (user.role === "admin" && prompt.companyId === user.companyId) {
        const updateData = insertSystemPromptSchema.partial().parse(req.body);
        const updatedPrompt = await storage.updateSystemPrompt(id, updateData);
        res.json(updatedPrompt);
      } else {
        res.status(403).json({ message: "Forbidden" });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ errors: err.errors });
      }
      res.status(500).json({ message: "Error updating system prompt" });
    }
  });
  
  app.delete("/api/system-prompts/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const prompt = await storage.getSystemPrompt(id);
      
      if (!prompt) {
        return res.status(404).json({ message: "System prompt not found" });
      }
      
      const user = req.user as any;
      
      // Check if user has access to delete this prompt
      if (user.role === "admin" && prompt.companyId === user.companyId) {
        await storage.deleteSystemPrompt(id);
        res.status(204).end();
      } else {
        res.status(403).json({ message: "Forbidden" });
      }
    } catch (err) {
      res.status(500).json({ message: "Error deleting system prompt" });
    }
  });
  
  // User Onboarding Routes
  app.get("/api/onboarding", authenticate, async (req, res) => {
    try {
      const user = req.user as any;
      
      const onboarding = await storage.getUserOnboarding(user.id);
      if (!onboarding) {
        return res.status(404).json({ message: "Onboarding data not found" });
      }
      
      res.json(onboarding);
    } catch (err) {
      console.error("Error fetching onboarding data:", err);
      res.status(500).json({ message: "Error fetching onboarding data" });
    }
  });
  
  app.post("/api/onboarding", authenticate, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Check if onboarding data already exists
      const existingOnboarding = await storage.getUserOnboarding(user.id);
      if (existingOnboarding) {
        return res.status(409).json({ 
          message: "Onboarding data already exists", 
          data: existingOnboarding 
        });
      }
      
      // Validate the request body
      const validatedData = insertUserOnboardingSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      // Create onboarding data
      const onboarding = await storage.createUserOnboarding(validatedData);
      res.status(201).json(onboarding);
    } catch (err) {
      console.error("Error creating onboarding data:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid onboarding data", 
          errors: err.errors 
        });
      }
      res.status(500).json({ message: "Error creating onboarding data" });
    }
  });
  
  app.put("/api/onboarding", authenticate, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Check if onboarding data exists
      const existingOnboarding = await storage.getUserOnboarding(user.id);
      if (!existingOnboarding) {
        return res.status(404).json({ message: "Onboarding data not found" });
      }
      
      // Update onboarding data
      const updatedOnboarding = await storage.updateUserOnboarding(user.id, req.body);
      res.json(updatedOnboarding);
    } catch (err) {
      console.error("Error updating onboarding data:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid onboarding data", 
          errors: err.errors 
        });
      }
      res.status(500).json({ message: "Error updating onboarding data" });
    }
  });
  
  // Dashboard stats endpoint
  app.get("/api/dashboard/stats", authenticate, async (req, res) => {
    try {
      const user = req.user as any;
      const quotes = await storage.getQuotesByCompanyId(user.companyId || 0);
      
      // Calculate total quotes value
      const totalQuoteValue = quotes.reduce((sum, quote) => sum + (quote.amount || 0), 0);
      
      // Get quotes from last month to calculate change
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const quotesLastMonth = quotes.filter(q => {
        const quoteDate = new Date(q.date);
        return quoteDate >= lastMonth;
      });
      
      // Calculate quote stats from previous month for comparison
      const previousMonth = new Date(lastMonth);
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      
      const quotesPreviousMonth = quotes.filter(q => {
        const quoteDate = new Date(q.date);
        return quoteDate >= previousMonth && quoteDate < lastMonth;
      });
      
      // Calculate percentage changes
      let quotesPercentChange = 0;
      let valuePercentChange = 0;
      
      if (quotesPreviousMonth.length > 0) {
        quotesPercentChange = Math.round((quotesLastMonth.length - quotesPreviousMonth.length) / quotesPreviousMonth.length * 100);
      }
      
      const previousMonthValue = quotesPreviousMonth.reduce((sum, quote) => sum + (quote.amount || 0), 0);
      if (previousMonthValue > 0) {
        const lastMonthValue = quotesLastMonth.reduce((sum, quote) => sum + (quote.amount || 0), 0);
        valuePercentChange = Math.round((lastMonthValue - previousMonthValue) / previousMonthValue * 100);
      }
      
      // Dashboard stats
      const stats = {
        totalQuotes: quotes.length,
        totalQuoteValue,
        quotesPercentChange: quotesPercentChange || 0,
        valuePercentChange: valuePercentChange || 0
      };
      
      res.json(stats);
    } catch (err) {
      console.error('Error getting dashboard stats:', err);
      res.status(500).json({ message: "Error fetching dashboard stats" });
    }
  });
  
  // Profile update endpoint
  // Deprecated route - use /api/profile router instead
  app.put("/api/user/profile", authenticate, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { name, email, avatarUrl } = req.body;
      
      console.log("Profile update request:", { name, email, avatarUrl });
      
      // Create update object with only provided fields
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
      
      const updatedUser = await storage.updateUser(user.id, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive fields before returning
      const safeUser = {
        ...updatedUser,
        password: undefined,
        xeroTokenSet: undefined
      };
      
      return res.status(200).json({ 
        message: "Profile updated successfully",
        user: safeUser,
        success: true
      });
    } catch (error) {
      console.error("Profile update error:", error);
      return res.status(500).json({
        message: error instanceof Error ? error.message : "Server error"
      });
    }
  });
  
  // Company update endpoint
  app.put("/api/company", authenticate, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (!user.companyId) {
        return res.status(400).json({ message: "User does not belong to a company" });
      }
      
      const { companyName, industry, logo } = req.body;
      
      const company = await storage.getCompany(user.companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Only admin or users from same company can update company details
      if (user.role !== "admin" && company.id !== user.companyId) {
        return res.status(403).json({ message: "Not authorized to update this company" });
      }
      
      const updatedCompany = await storage.updateCompany(company.id, {
        name: companyName,
        industry,
        logo
      });
      
      if (!updatedCompany) {
        return res.status(404).json({ message: "Company update failed" });
      }
      
      return res.status(200).json({
        message: "Company updated successfully",
        company: updatedCompany
      });
    } catch (error) {
      console.error("Company update error:", error);
      return res.status(500).json({
        message: error instanceof Error ? error.message : "Server error"
      });
    }
  });
  
  // Company get endpoint
  app.get("/api/companies/:id", authenticate, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const companyId = parseInt(req.params.id);
      if (isNaN(companyId)) {
        return res.status(400).json({ message: "Invalid company ID" });
      }
      
      // Check if user has access to this company
      // Admin can access any company, regular users only their own
      if (user.role !== "admin" && user.companyId !== companyId) {
        return res.status(403).json({ message: "Not authorized to access this company" });
      }
      
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      return res.status(200).json(company);
    } catch (error) {
      console.error("Company fetch error:", error);
      return res.status(500).json({
        message: error instanceof Error ? error.message : "Server error"
      });
    }
  });
  
  const httpServer = createServer(app);

  return httpServer;
}
