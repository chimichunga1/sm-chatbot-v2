import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, TOKEN_EXPIRY_KEY } from '@/lib/auth-constants';

/**
 * Perform a fetch with authentication headers
 * This utility handles token refresh if needed
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get current access token
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  
  // Setup headers
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');
  
  // Add auth header if token exists
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  
  // Make the initial request
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies for refresh token
  });
  
  // If we get a 401 (Unauthorized), try to refresh the token
  if (response.status === 401 && !url.includes('/api/auth/refresh')) {
    console.log(`Got 401 on ${url}, attempting to refresh token...`);
    const refreshed = await refreshAccessToken();
    
    // If refresh succeeded, retry the request with the new token
    if (refreshed) {
      console.log(`Token refresh successful, retrying request to ${url}`);
      const newHeaders = new Headers(headers);
      newHeaders.set('Authorization', `Bearer ${refreshed}`);
      
      return fetch(url, {
        ...options,
        headers: newHeaders,
        credentials: 'include'
      });
    } else {
      console.log(`Token refresh failed for ${url}, returning 401 response`);
    }
  }
  
  return response;
}

/**
 * Try to refresh the access token
 * @returns New access token if successful, null otherwise
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    console.log('Refreshing access token');
    
    // Get refresh token from localStorage as fallback if cookie fails
    const fallbackRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    
    console.log(`Using fallback refresh token from localStorage: ${fallbackRefreshToken ? 'available' : 'not available'}`);
    
    const requestBody = fallbackRefreshToken ? JSON.stringify({ refreshToken: fallbackRefreshToken }) : undefined;
    console.log(`Request body for token refresh: ${requestBody || 'none'}`);
    
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      // Include token in body as a fallback
      body: requestBody,
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.error('Token refresh failed:', response.status);
      try {
        // Try to read response body for more detailed error
        const errorText = await response.text();
        console.error('Token refresh error details:', errorText);
      } catch (e) {
        console.error('Could not read error details from response');
      }
      return null;
    }
    
    const data = await response.json();
    
    if (data.success && data.accessToken) {
      console.log('Token refresh successful');
      
      // Store the new access token
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      
      // Store the new refresh token if it was included in the response
      if (data.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      }
      
      // Calculate and store expiry time
      const expiresIn = data.expiresIn || 15 * 60 * 1000; // Default to 15 minutes
      const expiryTime = Date.now() + expiresIn;
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      
      return data.accessToken;
    }
    
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

/**
 * Simple GET request with authentication
 */
export async function apiGet<T = any>(url: string): Promise<T> {
  const response = await fetchWithAuth(url);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * POST request with authentication
 */
export async function apiPost<T = any, D = any>(url: string, data?: D): Promise<T> {
  const response = await fetchWithAuth(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: data ? JSON.stringify(data) : undefined
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * PUT request with authentication
 */
export async function apiPut<T = any, D = any>(url: string, data?: D): Promise<T> {
  const response = await fetchWithAuth(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: data ? JSON.stringify(data) : undefined
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * DELETE request with authentication
 */
export async function apiDelete<T = any>(url: string): Promise<T> {
  const response = await fetchWithAuth(url, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}