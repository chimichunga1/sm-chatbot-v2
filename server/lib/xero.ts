import { TokenSet } from 'openid-client';
import { XeroClient } from 'xero-node';
import { Request, Response } from 'express';
import { storage } from '../storage';
import { log } from '../vite';

// Type definition for Xero token data
export interface XeroTokenData {
  id?: number;
  userId: number;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  tenantId: string;
  tenantName?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Get the appropriate redirect URI based on environment
export const getRedirectUri = () => {
  // Always return the production URL since that's what is registered in Xero
  return 'https://app.pricebetter.ai/api/xero/callback';
};

// Initialize Xero client
const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID!,
  clientSecret: process.env.XERO_CLIENT_SECRET!,
  redirectUris: [getRedirectUri()],
  scopes: [
    'offline_access',
    'accounting.transactions',
    'accounting.contacts',
    'accounting.settings',
    'openid',
    'profile',
    'email',
  ],
  state: 'xero-auth-state',
});

// Array of API sets available in Xero
const apiSets = ['accounting'];

// Generate authorization URL to start OAuth flow
export async function getAuthorizationUrl(): Promise<string> {
  const consentUrl = await xero.buildConsentUrl();
  return consentUrl;
}

// Handle OAuth callback and save tokens
export async function handleCallback(req: Request, res: Response): Promise<XeroTokenData | null> {
  try {
    // First, construct the callback URL properly to handle URL parsing
    // Ensure we use the absolute URI registered with Xero
    const fullUrl = getRedirectUri() + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '');
    log(`Processing Xero callback with URL: ${fullUrl}`, 'xero');
    
    // Call Xero API with the full callback URL
    const tokenSet: TokenSet = await xero.apiCallback(fullUrl);
    log('Received token set from Xero', 'xero');
    
    await xero.updateTenants();
    const activeTenant = xero.tenants[0];
    
    if (!activeTenant || !activeTenant.tenantId) {
      log('Error: No active tenant found after Xero authorization', 'xero');
      return null;
    }
    
    if (!req.user || !req.user.id) {
      log('Error: No user found in session', 'xero');
      return null;
    }
    
    // Save token data
    const tokenData: XeroTokenData = {
      userId: req.user.id,
      accessToken: tokenSet.access_token!,
      refreshToken: tokenSet.refresh_token!,
      expiresAt: new Date(tokenSet.expires_at! * 1000),
      tenantId: activeTenant.tenantId,
      tenantName: activeTenant.tenantName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Store the token in the database
    const savedToken = await storage.saveXeroToken(tokenData);
    
    log(`Xero authorization successful for user ${req.user.id}`, 'xero');
    return savedToken;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error during Xero callback: ${errorMessage}`, 'xero');
    return null;
  }
}

// Initialize Xero client with stored tokens
export async function initializeWithTokens(userId: number): Promise<XeroClient | null> {
  try {
    // Get saved tokens for this user
    const tokenData = await storage.getXeroTokenByUserId(userId);
    if (!tokenData) {
      log(`No Xero tokens found for user ${userId}`, 'xero');
      return null;
    }
    
    // Check if token is expired and needs refreshing
    const now = new Date();
    if (now > tokenData.expiresAt) {
      log(`Refreshing expired Xero token for user ${userId}`, 'xero');
      
      // Refresh the token
      const newTokenSet = await xero.refreshToken();
      
      // Update the stored token
      const updatedTokenData: XeroTokenData = {
        ...tokenData,
        accessToken: newTokenSet.access_token!,
        refreshToken: newTokenSet.refresh_token!,
        expiresAt: new Date(newTokenSet.expires_at! * 1000),
        updatedAt: new Date(),
      };
      
      await storage.updateXeroToken(tokenData.id!, updatedTokenData);
    }
    
    // Set the token in the Xero client
    xero.setTokenSet({
      access_token: tokenData.accessToken,
      refresh_token: tokenData.refreshToken,
      expires_at: Math.floor(tokenData.expiresAt.getTime() / 1000),
      id_token: '',
      scope: '',
    });
    
    // Set the active tenant
    await xero.updateTenants();
    if (xero.tenants.length === 0) {
      log(`No tenants found for user ${userId}`, 'xero');
      return null;
    }
    
    const activeTenant = xero.tenants.find(t => t.tenantId === tokenData.tenantId) || xero.tenants[0];
    xero.tenants.forEach(tenant => {
      if (tenant.tenantId === activeTenant.tenantId) {
        tenant.active = true;
      } else {
        tenant.active = false;
      }
    });
    
    log(`Xero client initialized for user ${userId}`, 'xero');
    return xero;
  } catch (error) {
    log(`Error initializing Xero client: ${error}`, 'xero');
    return null;
  }
}

// Get Xero connection status
export async function getConnectionStatus(userId: number): Promise<{
  connected: boolean;
  organization?: string;
  expiresAt?: Date;
}> {
  const tokenData = await storage.getXeroTokenByUserId(userId);
  
  if (!tokenData) {
    return { connected: false };
  }
  
  return {
    connected: true,
    organization: tokenData.tenantName,
    expiresAt: tokenData.expiresAt,
  };
}

// Disconnect from Xero (revoke tokens)
export async function disconnect(userId: number): Promise<boolean> {
  try {
    const tokenData = await storage.getXeroTokenByUserId(userId);
    
    if (!tokenData) {
      return false;
    }
    
    // Revoke the connection
    // Note: As of May 2023, Xero doesn't have a direct API to revoke tokens
    // The best approach is to delete the token from our database
    
    await storage.deleteXeroToken(tokenData.id!);
    log(`Xero connection deleted for user ${userId}`, 'xero');
    
    return true;
  } catch (error) {
    log(`Error disconnecting from Xero: ${error}`, 'xero');
    return false;
  }
}

// Export an invoice to Xero
export async function exportQuoteAsInvoice(
  userId: number,
  quoteId: number
): Promise<{ 
  success: boolean; 
  invoiceId?: string; 
  invoiceNumber?: string;
  invoiceUrl?: string;
  error?: string 
}> {
  try {
    // Initialize Xero client with the user's tokens
    const xeroClient = await initializeWithTokens(userId);
    
    if (!xeroClient) {
      return { 
        success: false, 
        error: 'Not connected to Xero. Please connect your Xero account first.' 
      };
    }
    
    // Get the quote details from our database
    const quote = await storage.getQuote(quoteId);
    
    if (!quote) {
      return { 
        success: false, 
        error: 'Quote not found' 
      };
    }
    
    // Format the data for Xero
    const invoiceData = {
      Type: 'ACCREC',
      Contact: {
        Name: quote.clientName,
        FirstName: quote.clientName.split(' ')[0],
        LastName: quote.clientName.split(' ').slice(1).join(' '),
        EmailAddress: quote.clientEmail || '',
      },
      Date: new Date().toISOString().split('T')[0],
      DueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      Status: 'DRAFT',
      LineAmountTypes: 'Exclusive',
      LineItems: quote.items.map((item: any) => ({
        Description: item.description,
        Quantity: item.quantity,
        UnitAmount: item.unitPrice,
        AccountCode: '200', // Default sales account code - change as needed
        TaxType: 'OUTPUT', // Default tax type - change as needed
      })),
      Reference: `Quote #${quote.quoteNumber}`,
    };
    
    // Create the invoice in Xero
    const response = await xeroClient.accountingApi.createInvoices(
      xeroClient.tenants[0].tenantId, 
      { invoices: [invoiceData] }
    );
    
    if (response.body && response.body.invoices && response.body.invoices.length > 0) {
      const invoice = response.body.invoices[0];
      const invoiceId = invoice.invoiceID;
      const invoiceNumber = invoice.invoiceNumber || invoiceId;
      log(`Quote #${quoteId} exported to Xero as invoice ${invoiceId}`, 'xero');
      
      // Build the Xero URL for the invoice
      const region = 'go'; // 'go' is the default for global
      const invoiceUrl = `https://${region}.xero.com/accountant/invoices/${invoiceId}`;
      
      // Update the quote in our database with Xero details
      await storage.updateQuote(quoteId, {
        xeroQuoteId: invoiceId,
        xeroQuoteNumber: invoiceNumber,
        xeroQuoteUrl: invoiceUrl,
      });
      
      return { 
        success: true, 
        invoiceId,
        invoiceNumber,
        invoiceUrl
      };
    } else {
      log(`Failed to export quote #${quoteId} to Xero: No invoice returned`, 'xero');
      return { 
        success: false, 
        error: 'Failed to create invoice in Xero' 
      };
    }
  } catch (error) {
    log(`Error exporting quote to Xero: ${error}`, 'xero');
    return { 
      success: false, 
      error: `Error: ${error.message || 'Unknown error'}` 
    };
  }
}

// Get information about an organization from Xero
export async function getOrganizationInfo(userId: number): Promise<any> {
  try {
    const xeroClient = await initializeWithTokens(userId);
    
    if (!xeroClient) {
      return null;
    }
    
    const response = await xeroClient.accountingApi.getOrganisations(
      xeroClient.tenants[0].tenantId
    );
    
    if (response.body && response.body.organisations && response.body.organisations.length > 0) {
      return response.body.organisations[0];
    }
    
    return null;
  } catch (error) {
    log(`Error getting organization info from Xero: ${error}`, 'xero');
    return null;
  }
}

// Get quote details from Xero
export async function getXeroQuoteDetails(
  userId: number, 
  xeroInvoiceId: string
): Promise<{
  success: boolean;
  invoiceNumber?: string;
  invoiceUrl?: string;
  error?: string;
}> {
  try {
    const xeroClient = await initializeWithTokens(userId);
    
    if (!xeroClient) {
      return {
        success: false,
        error: 'Not connected to Xero. Please connect your Xero account first.'
      };
    }
    
    // Get the invoice details from Xero
    const response = await xeroClient.accountingApi.getInvoice(
      xeroClient.tenants[0].tenantId,
      xeroInvoiceId
    );
    
    if (!response.body || !response.body.invoices || response.body.invoices.length === 0) {
      return {
        success: false,
        error: 'Invoice not found in Xero'
      };
    }
    
    const invoice = response.body.invoices[0];
    
    // Build the Xero URL for the invoice
    // The format is: https://{region}.xero.com/api/xero/accounting/invoices/{invoiceId}
    const region = 'go'; // 'go' is the default for global
    const invoiceUrl = `https://${region}.xero.com/accountant/invoices/${xeroInvoiceId}`;
    
    return {
      success: true,
      invoiceNumber: invoice.invoiceNumber || invoice.invoiceID,
      invoiceUrl
    };
  } catch (error) {
    log(`Error getting invoice details from Xero: ${error}`, 'xero');
    return {
      success: false,
      error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Sync quote details with Xero (pull back Xero data and update our database)
export async function syncQuoteWithXero(
  userId: number,
  quoteId: number
): Promise<{
  success: boolean;
  quote?: any;
  error?: string;
}> {
  try {
    // Get the quote from our database
    const quote = await storage.getQuote(quoteId);
    
    if (!quote) {
      return {
        success: false,
        error: 'Quote not found in our database'
      };
    }
    
    // Check if the quote has been exported to Xero
    if (!quote.xeroQuoteId) {
      return {
        success: false,
        error: 'This quote has not been exported to Xero yet'
      };
    }
    
    // Get the quote details from Xero
    const xeroDetails = await getXeroQuoteDetails(userId, quote.xeroQuoteId);
    
    if (!xeroDetails.success) {
      return {
        success: false,
        error: xeroDetails.error
      };
    }
    
    // Update our quote record with the latest information from Xero
    const updatedQuote = await storage.updateQuote(quoteId, {
      xeroQuoteNumber: xeroDetails.invoiceNumber,
      xeroQuoteUrl: xeroDetails.invoiceUrl
    });
    
    if (!updatedQuote) {
      return {
        success: false,
        error: 'Failed to update quote with Xero details'
      };
    }
    
    log(`Successfully synced quote #${quoteId} with Xero`, 'xero');
    return {
      success: true,
      quote: updatedQuote
    };
  } catch (error) {
    log(`Error syncing quote with Xero: ${error}`, 'xero');
    return {
      success: false,
      error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export default {
  getAuthorizationUrl,
  handleCallback,
  initializeWithTokens,
  getConnectionStatus,
  disconnect,
  exportQuoteAsInvoice,
  getOrganizationInfo,
  getXeroQuoteDetails,
  syncQuoteWithXero
};