import { Router, Request, Response, NextFunction } from 'express';
import { streamingChatHandler, extractLineItems } from '../lib/vercel-ai';
import { Message } from 'ai';
import { handleAIChat } from '../lib/ai-handler';
import { authenticate } from '../middleware/auth';

// Use JWT authentication middleware OR allow unauthenticated access in development
const aiAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // In development, allow unauthenticated access to AI endpoints for testing
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode: AI endpoint authentication bypassed');
    return next();
  }
  
  // In production, require authentication
  return authenticate(req, res, next);
};

export const aiRouter = Router();

// AI Chat endpoint using our streaming handler
aiRouter.post('/chat', aiAuthMiddleware, async (req: Request, res: Response) => {
  try {
    console.log('AI Chat endpoint called');
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages format in AI chat request');
      return res.status(400).json({ error: 'Invalid messages format' });
    }
    
    // Log the received messages for debugging
    console.log('AI Chat request received with messages:', JSON.stringify(messages.map(m => ({
      role: m.role,
      contentPreview: m.content.substring(0, 50) + (m.content.length > 50 ? '...' : '')
    }))));
    
    // Get the last message from the user
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      console.error('Last message must be from user');
      return res.status(400).json({ error: 'Last message must be from user' });
    }
    
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      console.error('No AI provider API keys configured');
      return res.status(500).json({ 
        error: 'No AI provider configured. Please set up OpenAI or Anthropic API keys.'
      });
    }
    
    // Call our streaming handler with messages and response object
    console.log('Calling streaming handler...');
    return await streamingChatHandler(messages, res);
  } catch (err) {
    console.error('Error in AI chat endpoint:', err);
    
    // Provide more specific error message if possible
    let errorMessage = 'Internal server error';
    if (err instanceof Error) {
      console.error('Detailed error:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      
      if (err.message.includes('API key')) {
        errorMessage = 'There was an issue with the AI provider API key. Please check your configuration.';
      }
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

// Extract line items from conversation
aiRouter.post('/extract-line-items', aiAuthMiddleware, async (req: Request, res: Response) => {
  try {
    console.log('Extract line items endpoint called');
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages format in extract line items request');
      return res.status(400).json({ error: 'Invalid messages format' });
    }
    
    // Log the received messages for debugging
    console.log('Extract line items request received with messages:', JSON.stringify(messages.map(m => ({
      role: m.role,
      contentPreview: m.content.substring(0, 50) + (m.content.length > 50 ? '...' : '')
    }))));
    
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      console.error('No AI provider API keys configured for line item extraction');
      return res.status(500).json({ 
        error: 'No AI provider configured. Please set up OpenAI or Anthropic API keys.'
      });
    }
    
    console.log('Calling extractLineItems function...');
    const lineItems = await extractLineItems(messages as Message[]);
    console.log('Line items extracted:', lineItems);
    
    return res.status(200).json({ items: lineItems });
  } catch (err) {
    console.error('Error extracting line items:', err);
    
    // Provide more specific error message if possible
    let errorMessage = 'Failed to extract line items';
    if (err instanceof Error) {
      console.error('Detailed extraction error:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      
      if (err.message.includes('API key')) {
        errorMessage = 'There was an issue with the AI provider API key for line item extraction.';
      }
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

// Generate quote from description (placeholder for now)
aiRouter.post('/generate-quote', aiAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { description } = req.body;
    
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }
    
    // In a real implementation, this would call an LLM with a structured prompt
    const mockQuote = {
      title: "Generated Quote",
      description: `Project based on: ${description}`,
      amount: 5000,
      lineItems: [
        { description: "Initial consultation", quantity: 1, unitPrice: 500 },
        { description: "Project implementation", quantity: 1, unitPrice: 4500 }
      ]
    };
    
    return res.status(200).json({ quote: mockQuote });
  } catch (err) {
    console.error('Error generating quote:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});