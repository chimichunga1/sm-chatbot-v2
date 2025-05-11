import { QueryClient } from '@tanstack/react-query';

// Create a client with defaults that help with error handling
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 401/403 auth errors
        if (error.status === 401 || error.status === 403) {
          return false;
        }
        // Otherwise retry up to 2 times
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// API request function for making authenticated requests
export const apiRequest = async (
  method: string, 
  url: string, 
  body?: any,
  customOptions?: RequestInit
): Promise<Response> => {
  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    },
    credentials: 'include', // Include cookies for auth
  };

  if (body && method !== 'GET') {
    requestOptions.body = JSON.stringify(body);
  }

  // Automatically include admin token for admin routes if it exists
  // This ensures API requests from admin pages include the admin token
  if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      (requestOptions.headers as Record<string, string>)['Authorization'] = `Bearer ${adminToken}`;
    }
  }

  // Merge any custom options if provided
  if (customOptions) {
    // Handle merging headers properly
    if (customOptions.headers) {
      requestOptions.headers = {
        ...requestOptions.headers,
        ...customOptions.headers
      };

      // Remove headers from customOptions to avoid overwriting the merged headers
      const { headers, ...restOptions } = customOptions;
      Object.assign(requestOptions, restOptions);
    } else {
      Object.assign(requestOptions, customOptions);
    }
  }

  try {
    console.log(`Making ${method} request to ${url}`);
    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      console.error(`API request failed: ${method} ${url}`, {
        status: response.status,
        statusText: response.statusText
      });
      
      // For debugging purposes, try to get more error details
      try {
        // Clone the response before reading text to avoid the "body stream already read" error
        const errorClone = response.clone();
        const errorText = await errorClone.text();
        console.error('Response error text:', errorText);
        
        // Try to parse as JSON for more detailed logging
        try {
          const errorJson = JSON.parse(errorText);
          console.error('Parsed error response:', errorJson);
        } catch (jsonError) {
          // Not JSON, that's fine
        }
      } catch (textError) {
        console.error('Could not read error text', textError);
      }
    }
    return response;
  } catch (error) {
    console.error(`Network error during API request: ${method} ${url}`, error);
    throw error;
  }
};