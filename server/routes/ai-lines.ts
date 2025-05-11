import { Router, Request, Response } from "express";
import { z } from "zod";

const aiLinesRouter = Router();

// Schema for line items extraction request
const extractLinesSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string()
    })
  )
});

// Middleware to check authentication
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Extract line items from conversation
aiLinesRouter.post("/extract-line-items", isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { messages } = extractLinesSchema.parse(req.body);
    
    // Import AI handler
    const { generateLineItems } = await import('../lib/ai-handler');
    
    // Generate line items from conversation
    const lineItems = await generateLineItems(messages);
    
    res.json({ lineItems });
  } catch (error) {
    console.error("Error extracting line items:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Invalid request format", 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ message: "Failed to extract line items" });
  }
});

export default aiLinesRouter;