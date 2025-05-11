import { Router, Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { insertQuoteSchema, type Quote } from '@shared/schema';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';

// Log whenever quotes route is accessed for debugging
const debugLog = (req: Request, res: Response, next: NextFunction) => {
  console.log('Quotes API called:', { 
    path: req.path, 
    method: req.method,
    authenticated: !!req.user,
    user: req.user ? `User #${req.user.id}` : 'No user'
  });
  next();
};

const router = Router();

// Get all quotes - add debugLog middleware to track all API requests
router.get('/', debugLog, async (req: Request, res: Response) => {
  try {
    console.log("GET /api/quotes - User authenticated:", !!req.user);
    console.log("User data:", req.user);
    
    // Extract filter parameters
    const userId = (req.user as any)?.id;
    const companyId = (req.user as any)?.companyId;
    const status = req.query.status as string | undefined;
    
    console.log(`Quote request params - userId: ${userId}, companyId: ${companyId}, status filter: ${status}`);
    
    // Provide sample quotes if user is not authenticated
    if (!userId) {
      console.log('No authentication provided, returning sample quotes');
      
      const sampleQuotes: Quote[] = [
        {
          id: 999,
          quoteNumber: "DEMO-001",
          clientName: "Demo Client",
          date: new Date(),
          amount: 12500,
          status: "Draft",
          description: "This is a sample quote for kitchen renovation. Includes demolition, cabinetry, countertops, and appliance installation.",
          userId: 0,
          companyId: 0,
          clientId: null,
          xeroQuoteId: null,
          xeroQuoteNumber: null,
          xeroQuoteUrl: null
        },
        {
          id: 998,
          quoteNumber: "DEMO-002",
          clientName: "Example Company",
          date: new Date(),
          amount: 7800,
          status: "Sent",
          description: "Sample bathroom remodel quote. Includes fixture replacement, tiling, and vanity installation.",
          userId: 0,
          companyId: 0,
          clientId: null,
          xeroQuoteId: null,
          xeroQuoteNumber: null,
          xeroQuoteUrl: null
        }
      ];
      
      // Apply status filter if provided
      if (status && status !== 'all') {
        return res.json(sampleQuotes.filter(q => q.status.toLowerCase() === status.toLowerCase()));
      }
      
      return res.json(sampleQuotes);
    }
    
    let quotes: Quote[] = [];
    
    try {
      // Get quotes based on filters
      if (companyId) {
        console.log(`Fetching quotes by company ID: ${companyId}`);
        quotes = await storage.getQuotesByCompanyId(companyId);
      } else {
        console.log(`Fetching quotes by user ID: ${userId}`);
        quotes = await storage.getQuotesByUserId(userId);
      }
      console.log(`Retrieved ${quotes?.length || 0} quotes from database`);
    } catch (dbError) {
      console.error('Database error when fetching quotes:', dbError);
      return res.status(500).json({ 
        message: 'Database error when fetching quotes', 
        error: (dbError as Error).message 
      });
    }

    // Apply status filter if provided
    if (status && status !== 'all' && quotes && quotes.length > 0) {
      console.log(`Applying status filter: ${status}`);
      quotes = quotes.filter(quote => quote.status === status);
      console.log(`${quotes.length} quotes remain after filtering`);
    }
    
    // Ensure we always return an array
    if (!quotes) {
      quotes = [];
    }
    
    console.log(`Returning ${quotes.length} quotes in response`);
    res.json(quotes);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ message: 'Failed to fetch quotes', error: (error as Error).message });
  }
});

// Get a specific quote by ID
router.get('/:id', debugLog, async (req: Request, res: Response) => {
  try {
    console.log(`GET /api/quotes/${req.params.id} - User authenticated:`, !!req.user);
    console.log("User data for specific quote:", req.user);
    
    const quoteId = parseInt(req.params.id);
    if (isNaN(quoteId)) {
      console.log("Invalid quote ID:", req.params.id);
      return res.status(400).json({ message: 'Invalid quote ID' });
    }
    
    let quote;
    try {
      quote = await storage.getQuote(quoteId);
      console.log(`Quote lookup result for ID ${quoteId}:`, quote ? "Quote found" : "Quote not found");
    } catch (dbError) {
      console.error('Database error when fetching quote:', dbError);
      return res.status(500).json({ message: 'Database error when fetching quote', error: (dbError as Error).message });
    }
    
    // Handle demo quotes for non-authenticated users
    if (!req.user) {
      console.log('No authentication provided for quote detail, returning demo quote');
      
      // Check if requested ID matches one of our demo quotes
      if (quoteId === 998 || quoteId === 999) {
        // Create a sample quote based on the ID
        const demoQuote: Quote = {
          id: quoteId,
          quoteNumber: quoteId === 999 ? "DEMO-001" : "DEMO-002",

          clientName: quoteId === 999 ? "Demo Client" : "Example Company",
          date: new Date(),
          amount: quoteId === 999 ? 12500 : 7800,
          status: quoteId === 999 ? "Draft" : "Sent",
          description: quoteId === 999 
            ? "This is a sample quote for kitchen renovation. Includes demolition, cabinetry, countertops, and appliance installation."
            : "Sample bathroom remodel quote. Includes fixture replacement, tiling, and vanity installation.",
          userId: 0,
          companyId: 0,
          clientId: null,
          xeroQuoteId: null,
          xeroQuoteNumber: null,
          xeroQuoteUrl: null,

        };
        
        return res.json(demoQuote);
      }
      
      return res.status(404).json({ message: 'Demo quote not found' });
    }
    
    // For authenticated users requesting a real quote
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }
    
    // Check if the user has access to this quote
    const userId = (req.user as any).id;
    const userCompanyId = (req.user as any).companyId;
    
    if (quote.userId !== userId && quote.companyId !== userCompanyId && (req.user as any).role !== 'admin') {
      return res.status(403).json({ message: 'You do not have permission to view this quote' });
    }
    
    res.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ message: 'Failed to fetch quote', error: (error as Error).message });
  }
});

// Create a new quote
router.post('/', authenticate, debugLog, async (req: Request, res: Response) => {
  try {
    console.log('Creating new quote. Request body:', req.body);
    
    // Prepare the data with date conversion
    const requestData = { ...req.body };
    
    // Ensure the date is properly handled - convert string date to Date object
    if (typeof requestData.date === 'string') {
      requestData.date = new Date(requestData.date);
    }
    
    // Always ensure amount is at least 0
    if (requestData.amount === null || requestData.amount === undefined) {
      console.log('Setting default amount to 0');
      requestData.amount = 0;
    }
    
    console.log('Prepared data for validation:', requestData);
    
    // Validate the request body with the converted date
    const quoteData = insertQuoteSchema.parse(requestData);
    
    console.log('Validation passed, parsed data:', quoteData);
    
    // Set the userId and companyId if not provided
    if (!quoteData.userId) {
      quoteData.userId = (req.user as any).id;
      console.log('Set userId from current user:', quoteData.userId);
    }
    
    if (!quoteData.companyId) {
      quoteData.companyId = (req.user as any).companyId;
      console.log('Set companyId from current user:', quoteData.companyId);
    }
    
    console.log('About to create quote with data:', quoteData);
    
    // Create the quote
    let newQuote;
    try {
      newQuote = await storage.createQuote(quoteData);
      console.log('Quote created successfully:', newQuote);
    } catch (dbError) {
      console.error('Database error when creating quote:', dbError);
      return res.status(500).json({ message: 'Database error when creating quote', error: (dbError as Error).message });
    }
    
    if (!newQuote) {
      return res.status(500).json({ message: 'Failed to create quote' });
    }
    
    res.status(201).json(newQuote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', error.errors);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    console.error('Error creating quote:', error);
    res.status(500).json({ message: 'Failed to create quote', error: (error as Error).message });
  }
});

// Update a quote
router.put('/:id', authenticate, debugLog, async (req: Request, res: Response) => {
  try {
    const quoteId = parseInt(req.params.id);
    if (isNaN(quoteId)) {
      return res.status(400).json({ message: 'Invalid quote ID' });
    }
    
    // Fetch the existing quote
    let existingQuote: Quote | undefined;
    try {
      existingQuote = await storage.getQuote(quoteId);
    } catch (dbError) {
      console.error('Database error when fetching quote for update:', dbError);
      return res.status(500).json({ message: 'Database error when fetching quote', error: (dbError as Error).message });
    }
    
    if (!existingQuote) {
      return res.status(404).json({ message: 'Quote not found' });
    }
    
    // Check if the user has permission to update the quote
    const userId = (req.user as any).id;
    const userCompanyId = (req.user as any).companyId;
    
    if (existingQuote.userId !== userId && existingQuote.companyId !== userCompanyId && (req.user as any).role !== 'admin') {
      return res.status(403).json({ message: 'You do not have permission to update this quote' });
    }
    
    // Prepare the data with date conversion
    const requestData = { ...req.body };
    
    // Ensure the date is properly handled - convert string date to Date object
    if (typeof requestData.date === 'string') {
      requestData.date = new Date(requestData.date);
    }
    
    // Validate the request body
    const quoteData = insertQuoteSchema.partial().parse(requestData);
    
    // Update the quote
    let updatedQuote;
    try {
      updatedQuote = await storage.updateQuote(quoteId, quoteData);
    } catch (dbError) {
      console.error('Database error when updating quote:', dbError);
      return res.status(500).json({ message: 'Database error when updating quote', error: (dbError as Error).message });
    }
    
    if (!updatedQuote) {
      return res.status(500).json({ message: 'Failed to update quote' });
    }
    
    res.json(updatedQuote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    console.error('Error updating quote:', error);
    res.status(500).json({ message: 'Failed to update quote', error: (error as Error).message });
  }
});

// Delete a quote
router.delete('/:id', authenticate, debugLog, async (req: Request, res: Response) => {
  try {
    const quoteId = parseInt(req.params.id);
    if (isNaN(quoteId)) {
      return res.status(400).json({ message: 'Invalid quote ID' });
    }
    
    // Fetch the existing quote
    let existingQuote: Quote | undefined;
    try {
      existingQuote = await storage.getQuote(quoteId);
    } catch (dbError) {
      console.error('Database error when fetching quote for deletion:', dbError);
      return res.status(500).json({ message: 'Database error when fetching quote', error: (dbError as Error).message });
    }
    
    if (!existingQuote) {
      return res.status(404).json({ message: 'Quote not found' });
    }
    
    // Check if the user has permission to delete the quote
    const userId = (req.user as any).id;
    const userCompanyId = (req.user as any).companyId;
    
    if (existingQuote.userId !== userId && existingQuote.companyId !== userCompanyId && (req.user as any).role !== 'admin') {
      return res.status(403).json({ message: 'You do not have permission to delete this quote' });
    }
    
    // Delete the quote
    let success = false;
    try {
      success = await storage.deleteQuote(quoteId);
    } catch (dbError) {
      console.error('Database error when deleting quote:', dbError);
      return res.status(500).json({ message: 'Database error when deleting quote', error: (dbError as Error).message });
    }
    
    if (success) {
      res.status(204).send();
    } else {
      res.status(500).json({ message: 'Failed to delete quote' });
    }
  } catch (error) {
    console.error('Error deleting quote:', error);
    res.status(500).json({ message: 'Failed to delete quote', error: (error as Error).message });
  }
});

export const quotesRouter = router;