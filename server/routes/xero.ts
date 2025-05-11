import { Router, Request, Response, NextFunction } from 'express';
import { 
  getAuthorizationUrl, 
  handleCallback, 
  disconnect, 
  getConnectionStatus, 
  exportQuoteAsInvoice, 
  getOrganizationInfo,
  syncQuoteWithXero,
  getXeroQuoteDetails,
  getRedirectUri
} from '../lib/xero';
import { log } from '../vite';

// Define our own isAuthenticated middleware to avoid circular imports
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

export const xeroRouter = Router();

// Get Xero authorization URL
xeroRouter.get('/auth-url', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const authUrl = await getAuthorizationUrl();
    res.json({ url: authUrl });
  } catch (error) {
    console.error('Error generating Xero auth URL:', error);
    res.status(500).json({ error: 'Failed to generate Xero authorization URL' });
  }
});

// Xero OAuth callback
xeroRouter.get('/callback', async (req: Request, res: Response) => {
  try {
    // Log information for debugging
    log(`Xero callback received, URL: ${req.url}`, 'xero');
    
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      log('User not authenticated in Xero callback, attempting to process anyway', 'xero');
      // Continue processing for now, we'll redirect to login if needed after the token fetch
    }
    
    const tokenData = await handleCallback(req, res);
    
    if (!tokenData) {
      log('No token data returned from Xero callback', 'xero');
      return res.redirect('/settings?xero=error');
    }
    
    // Redirect to settings page with success message
    log('Xero connection successful, redirecting to settings', 'xero');
    res.redirect('/settings?xero=connected');
  } catch (error) {
    console.error('Error in Xero callback:', error);
    log(`Error in Xero callback: ${error}`, 'xero');
    res.redirect('/settings?xero=error');
  }
});

// Check if user is connected to Xero
xeroRouter.get('/status', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const status = await getConnectionStatus(user.id);
    res.json(status);
  } catch (error) {
    console.error('Error checking Xero connection status:', error);
    res.status(500).json({ error: 'Failed to check Xero connection status' });
  }
});

// Disconnect from Xero
xeroRouter.post('/disconnect', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const success = await disconnect(user.id);
    res.json({ success });
  } catch (error) {
    console.error('Error disconnecting from Xero:', error);
    res.status(500).json({ error: 'Failed to disconnect from Xero' });
  }
});

// Get organization info from Xero
xeroRouter.get('/organization', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const orgInfo = await getOrganizationInfo(user.id);
    
    if (!orgInfo) {
      return res.status(404).json({ error: 'Organization information not found' });
    }
    
    res.json({ organization: orgInfo });
  } catch (error) {
    console.error('Error fetching Xero organization info:', error);
    res.status(500).json({ error: 'Failed to fetch Xero organization info' });
  }
});

// Export quote to invoice in Xero
xeroRouter.post('/export-quote/:quoteId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const quoteId = parseInt(req.params.quoteId, 10);
    
    if (isNaN(quoteId)) {
      return res.status(400).json({ error: 'Invalid quote ID' });
    }
    
    const result = await exportQuoteAsInvoice(user.id, quoteId);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({ 
      success: true, 
      invoiceId: result.invoiceId,
      invoiceNumber: result.invoiceNumber,
      invoiceUrl: result.invoiceUrl
    });
  } catch (error) {
    console.error('Error exporting quote to Xero:', error);
    res.status(500).json({ error: 'Failed to export quote to Xero' });
  }
});

// Sync quote details with Xero
xeroRouter.post('/sync-quote/:quoteId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const quoteId = parseInt(req.params.quoteId, 10);
    
    if (isNaN(quoteId)) {
      return res.status(400).json({ error: 'Invalid quote ID' });
    }
    
    const result = await syncQuoteWithXero(user.id, quoteId);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({ 
      success: true, 
      quote: result.quote
    });
  } catch (error) {
    console.error('Error syncing quote with Xero:', error);
    res.status(500).json({ error: 'Failed to sync quote with Xero' });
  }
});

// Get quote details from Xero by Xero Invoice ID
xeroRouter.get('/quote-details/:xeroInvoiceId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const xeroInvoiceId = req.params.xeroInvoiceId;
    
    if (!xeroInvoiceId) {
      return res.status(400).json({ error: 'Xero invoice ID is required' });
    }
    
    const result = await getXeroQuoteDetails(user.id, xeroInvoiceId);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({ 
      success: true, 
      invoiceNumber: result.invoiceNumber,
      invoiceUrl: result.invoiceUrl
    });
  } catch (error) {
    console.error('Error getting Xero quote details:', error);
    res.status(500).json({ error: 'Failed to get Xero quote details' });
  }
});

// Get current redirect URI - used to help users configure their Xero developer app
xeroRouter.get('/redirect-uri', async (req: Request, res: Response) => {
  try {
    const redirectUri = getRedirectUri();
    log(`Providing Xero redirect URI: ${redirectUri}`, 'xero');
    
    // Return the current redirect URI that should be registered in Xero Developer Center
    res.json({ 
      redirectUri,
      note: "Register this exact URL in your Xero Developer Application's redirect URIs"
    });
  } catch (error) {
    console.error('Error getting Xero redirect URI:', error);
    res.status(500).json({ error: 'Failed to get Xero redirect URI configuration' });
  }
});