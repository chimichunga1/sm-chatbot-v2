import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  type ReactNode,
  useCallback,
  useMemo
} from "@/lib/react-compat";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, TOKEN_EXPIRY_KEY, TOKEN_REFRESH_THRESHOLD } from '@/lib/auth-constants';
import { handleAuthRedirect } from '@/lib/auth-helpers';

// Simplified version of the User interface
interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  companyId: number | null;
}

// Interface for token response
interface TokenResponse {
  accessToken: string;
  refreshToken?: string; // Added for fallback storage
  user: User;
  success: boolean;
  expiresIn?: number; // Time in milliseconds until token expires
  message?: string;
}

// Interface for auth status response
interface AuthStatusResponse {
  authenticated: boolean;
  user: User | null;
  success: boolean;
  message?: string;
}

// Note: The 'username' field can actually be either username or email (case-insensitive)
type LoginCredentials = {
  username: string; // Can be either username or email
  password: string;
};

type RegisterData = {
  username: string;
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void; // Add updateUser method
};

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Function to refresh the access token
  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      console.log('Attempting to refresh access token');
      
      // Get refresh token from localStorage as fallback if cookie fails
      const fallbackRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      console.log(`Using fallback refresh token from auth context: ${fallbackRefreshToken ? 'available' : 'not available'}`);
      
      const requestBody = fallbackRefreshToken ? JSON.stringify({ refreshToken: fallbackRefreshToken }) : undefined;
      
      // Make the refresh request, including the refresh token as both cookie and in request body as fallback
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        body: requestBody,
        credentials: 'include' // Important to include cookies
      });

      if (!response.ok) {
        console.error('Token refresh failed:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      
      if (data.success && data.accessToken) {
        console.log('Token refresh successful');
        
        // Calculate and store token expiry time (default to 15 minutes if not specified)
        const expiresIn = data.expiresIn || 15 * 60 * 1000; // 15 minutes in milliseconds
        const expiryTime = Date.now() + expiresIn;
        
        // Store the new access token and its expiry time
        localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
        
        // Store the new refresh token if it was included in the response as fallback
        if (data.refreshToken) {
          console.log('Storing new refresh token from refresh response');
          localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        }
        
        // If user data was included in the response, update it
        if (data.user) {
          setUser(data.user);
        }
        
        return data.accessToken;
      } else {
        console.error('Token refresh response missing token:', data);
        return null;
      }
    } catch (err) {
      console.error('Error refreshing token:', err);
      return null;
    }
  }, []);

  // Function to check if the token needs refreshing
  const checkTokenExpiry = useCallback(async (): Promise<string | null> => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const expiryTimeStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (!accessToken || !expiryTimeStr) {
      return await refreshToken();
    }
    
    const expiryTime = parseInt(expiryTimeStr);
    const currentTime = Date.now();
    
    // If the token is expired or will expire soon, refresh it
    if (currentTime + TOKEN_REFRESH_THRESHOLD >= expiryTime) {
      console.log('Token expiring soon, refreshing');
      return await refreshToken();
    }
    
    // Token is still valid
    return accessToken;
  }, [refreshToken]);

  // Function to get auth headers with the current access token
  // Utility function to handle redirects after login with support for URL parameters  
  const handleAuthRedirect = useCallback((defaultPath = '/quotes') => {
    // Check for a redirect URL in query string
    const urlParams = new URLSearchParams(window.location.search);
    const redirectParam = urlParams.get('redirect');
    
    // Store redirect URL from query param if present
    if (redirectParam) {
      console.log(`Saving redirect target from URL: ${redirectParam}`);
      localStorage.setItem('auth_redirect_url', redirectParam);
    }
    
    // Get the saved redirect URL
    const redirectUrl = localStorage.getItem('auth_redirect_url');
    
    // Navigate after a longer delay to ensure session is fully established
    setTimeout(() => {
      if (redirectUrl) {
        console.log(`Redirecting to saved URL after login: ${redirectUrl}`);
        // Clear the redirect URL from localStorage
        localStorage.removeItem('auth_redirect_url');
        // For more reliable navigation, use full page reload
        window.location.href = redirectUrl;
      } else {
        // Default redirect to provided path
        console.log(`No redirect URL found, going to default path: ${defaultPath}`);
        window.location.href = defaultPath;
      }
    }, 800); // Increased delay to ensure session is established
  }, []);

  const getAuthHeaders = useCallback(async (): Promise<HeadersInit> => {
    const token = await checkTokenExpiry();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }, [checkTokenExpiry]);

  // Check auth status on mount
  useEffect(() => {
    // Function to get the current user
    const checkAuthStatus = async () => {
      try {
        console.log('Checking authentication status...');
        
        // Don't make redundant auth calls if we already have a user loaded
        // But force a check if we're on an admin page to prevent empty admin screens
        const isAdminPage = window.location.pathname.startsWith('/admin');
        if (user && !isLoading && !isAdminPage) {
          console.log('Already authenticated, skipping check');
          return;
        }
        
        // Check if we have access/refresh tokens in localStorage to use
        const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        const accessTokenExists = !!accessToken;
        const refreshTokenExists = !!storedRefreshToken;
        
        console.log('Auth check - Access token exists:', accessTokenExists);
        console.log('Auth check - Refresh token exists:', refreshTokenExists);
        
        // Get the last login time to prevent loops
        const lastLoginTime = localStorage.getItem('lastLoginSuccess');
        const currentTime = Date.now();
        const recentLogin = lastLoginTime && (currentTime - parseInt(lastLoginTime) < 2000);

        // If we just logged in successfully, assume auth is good to prevent unnecessary calls
        if (recentLogin && user) {
          console.log('Recent login detected, skipping auth check');
          setIsLoading(false);
          return;
        }

        // Handle missing tokens case directly for admin pages
        if (isAdminPage && !accessTokenExists && !refreshTokenExists) {
          console.log('No tokens available for admin page, redirecting to login');
          setUser(null);
          setIsLoading(false);
          window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname);
          return;
        }

        // Special case: If we have tokens but no user, try to directly use the tokens
        // This handles cases where page was refreshed but tokens are still valid
        if ((accessTokenExists || refreshTokenExists) && !user) {
          console.log('Tokens exist but user not loaded, attempting direct token usage');
          
          // Try to refresh the token first if needed
          let currentToken = accessToken;
          if (!currentToken || isTokenExpired()) {
            console.log('Access token missing or expired, attempting refresh');
            
            try {
              // Make direct refresh request
              const refreshResponse = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: storedRefreshToken ? JSON.stringify({ refreshToken: storedRefreshToken }) : undefined,
                credentials: 'include' // Include cookies
              });
              
              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                if (refreshData.accessToken) {
                  // Update currentToken for the next step
                  currentToken = refreshData.accessToken;
                  // Store tokens
                  localStorage.setItem(ACCESS_TOKEN_KEY, refreshData.accessToken);
                  if (refreshData.refreshToken) {
                    localStorage.setItem(REFRESH_TOKEN_KEY, refreshData.refreshToken);
                  }
                  console.log('Token refreshed successfully');
                }
              } else {
                console.log('Token refresh failed with status:', refreshResponse.status);
                currentToken = null;
              }
            } catch (error) {
              console.error('Token refresh error:', error);
              currentToken = null;
            }
            
            if (!currentToken) {
              console.log('Token refresh failed, clearing auth state');
              setUser(null);
              setIsLoading(false);
              // Only redirect if on a protected page
              const publicPaths = ['/auth', '/login', '/'];
              if (!publicPaths.includes(window.location.pathname)) {
                window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname);
              }
              return;
            }
          }
          
          // Now try to get user data with the token
          const headers = await getAuthHeaders();
          const response = await fetch('/api/auth/status', {
            credentials: 'include',
            headers
          });
          
          if (response.ok) {
            const authData = await response.json();
            if (authData.authenticated && authData.user) {
              console.log('Successfully retrieved user from token:', authData.user.username);
              setUser(authData.user);
              setIsLoading(false);
              return;
            }
          }
        }
        
        // Normal retry-based auth check for other cases
        // Reduce retries if we don't have any tokens to avoid excessive 401 errors
        let retries = 0;
        const maxRetries = (accessTokenExists || refreshTokenExists) ? 3 : 1;
        let authData: AuthStatusResponse | null = null;
        
        while (retries < maxRetries && !authData) {
          try {
            console.log(`Auth check attempt ${retries + 1}/${maxRetries}`);
            
            // Get the headers with a valid token
            const headers = await getAuthHeaders();
            
            const response = await fetch('/api/auth/status', {
              credentials: 'include', // Include cookies for refresh token
              headers
            });

            if (response.ok) {
              authData = await response.json();
              console.log('Auth status response:', authData);
            } else {
              // Only log detailed error the first time
              if (retries === 0) {
                try {
                  const errorText = await response.text();
                  // Log with lower severity since this is expected for unauthenticated users
                  if (response.status === 401) {
                    console.log('Auth status check: not authenticated');
                  } else {
                    console.error('Auth status check failed:', response.status, response.statusText, errorText);
                  }
                } catch (parseError) {
                  console.error('Auth status check failed:', response.status, response.statusText);
                }
              }
              
              retries++;
              if (retries < maxRetries) {
                await new Promise(r => setTimeout(r, 500)); // Wait 500ms before retry
              }
            }
          } catch (error) {
            console.error('Error in auth check:', error);
            retries++;
            if (retries < maxRetries) {
              await new Promise(r => setTimeout(r, 500)); // Wait 500ms before retry
            }
          }
        }
        
        // Process the auth data if we got it
        if (authData && authData.authenticated && authData.user) {
          setUser(authData.user);
          console.log('User authenticated:', authData.user.username);

          // Only redirect if on the auth page and we're not already loading another page
          const onAuthPage = window.location.pathname === '/auth' || window.location.pathname === '/login';
          if (onAuthPage && !isLoading) {
            console.log('Redirecting authenticated user to quotes page');
            navigate('/quotes');
          }
        } else {
          console.log('Not authenticated, clearing user state');
          setUser(null);

          // Only redirect if on a protected page and we're not already loading another page
          const publicPaths = ['/auth', '/login', '/'];
          if (!publicPaths.includes(window.location.pathname) && !isLoading) {
            console.log('Redirecting unauthenticated user to auth page');
            // For admin pages, use window.location for a clean redirect with no state
            if (window.location.pathname.startsWith('/admin')) {
              window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname);
            } else {
              navigate('/auth');
            }
          }
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        setUser(null);
        
        // Only redirect if on a protected page
        const publicPaths = ['/auth', '/login', '/'];
        if (!publicPaths.includes(window.location.pathname)) {
          // For admin pages, use window.location for a clean redirect
          if (window.location.pathname.startsWith('/admin')) {
            window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname);
          } else {
            navigate('/auth');
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [navigate, isLoading, user, getAuthHeaders]);
  
  // Helper function to check if token is expired
  const isTokenExpired = (): boolean => {
    const expiryTimeStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryTimeStr) return true; // No expiry time means we treat it as expired
    
    const expiryTime = parseInt(expiryTimeStr);
    const currentTime = Date.now();
    
    return currentTime + TOKEN_REFRESH_THRESHOLD >= expiryTime;
  };

  // Real login function that connects to the server
  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Attempting login with:', credentials.username);
      // Store a reference to the login attempt to prevent redirect loops
      const loginAttemptTime = Date.now();

      // Log request details for debugging
      console.log('Sending login request to:', '/api/auth/login');
      
      // First, make sure any old sessions are cleared
      try {
        await fetch('/api/auth/logout', { 
          method: 'POST',
          credentials: 'include' 
        });
        
        // Clear any existing tokens
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
      } catch (logoutError) {
        console.warn('Pre-login logout failed (continuing):', logoutError);
      }
      
      // Perform the actual login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify(credentials),
        credentials: 'include' // Important for refresh token cookie
      });

      console.log('Login response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error('Login error details:', errorData);
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
          // Try to get text response
          try {
            const errorText = await response.text();
            console.error('Error response text:', errorText);
          } catch (textError) {
            console.error('Could not get error text either:', textError);
          }
        }
        throw new Error(errorMessage);
      }

      const data: TokenResponse = await response.json();
      console.log('Login response data:', data);

      if (data.success && data.user && data.accessToken) {
        // Set user state
        setUser(data.user);

        // Store the access token in localStorage for subsequent API calls
        localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
        
        // Store the refresh token as a fallback mechanism (cookies should be primary)
        if (data.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        }
        
        // Calculate and store token expiry time (default to 15 minutes if not specified)
        const expiresIn = data.expiresIn || 15 * 60 * 1000; // 15 minutes in milliseconds
        const expiryTime = Date.now() + expiresIn;
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
        
        // Add a timestamp to localStorage to prevent loops
        localStorage.setItem('lastLoginSuccess', loginAttemptTime.toString());

        // Use React navigation instead of window.location
        console.log('Login successful, navigating with react router');

        // Show toast before redirect
        toast({
          title: "Login successful",
          description: "Welcome back!",
          duration: 3000,
        });
        
        // Verify the session was established by making a test request
        try {
          const headers = await getAuthHeaders();
          const verifyResponse = await fetch('/api/auth/status', {
            credentials: 'include',
            headers
          });
          
          const verifyData = await verifyResponse.json();
          console.log('Session verification:', verifyData);
          
          if (!verifyData.authenticated) {
            console.warn('Session verified but not authenticated - retrying...');
            
            // Wait a moment and try again once more
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const retryHeaders = await getAuthHeaders();
            const retryResponse = await fetch('/api/auth/status', {
              credentials: 'include',
              headers: retryHeaders
            });
            
            const retryData = await retryResponse.json();
            console.log('Session re-verification:', retryData);
          }
        } catch (verifyError) {
          console.warn('Session verification failed (but continuing):', verifyError);
        }
        
        // Navigate after a longer delay to ensure session is fully established
        setTimeout(() => {
          // For more reliable navigation, use full page reload instead of React Router
          window.location.href = '/quotes';
        }, 800); // Increased delay to ensure session is established
      } else {
        throw new Error('Login response missing user data');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      toast({
        title: "Login failed",
        description: err instanceof Error ? err.message : 'Login failed',
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [navigate, toast, getAuthHeaders]);

  // Register function that connects to the server
  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Attempting registration with:', data.username);
      const loginAttemptTime = Date.now();

      // First, make sure any old sessions are cleared
      try {
        await fetch('/api/auth/logout', { 
          method: 'POST',
          credentials: 'include' 
        });
        
        // Clear any existing tokens
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
      } catch (logoutError) {
        console.warn('Pre-registration logout failed (continuing):', logoutError);
      }
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify(data),
        credentials: 'include' // Important for refresh token cookie
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const responseData: TokenResponse = await response.json();
      console.log('Registration response:', responseData);

      if (responseData.success && responseData.user && responseData.accessToken) {
        setUser(responseData.user);
        
        // Store the access token
        localStorage.setItem(ACCESS_TOKEN_KEY, responseData.accessToken);
        
        // Store the refresh token as fallback
        if (responseData.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, responseData.refreshToken);
        }
        
        // Calculate and store token expiry time
        const expiresIn = responseData.expiresIn || 15 * 60 * 1000; // 15 minutes in milliseconds
        const expiryTime = Date.now() + expiresIn;
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
        
        // Add a timestamp to localStorage to prevent loops
        localStorage.setItem('lastLoginSuccess', loginAttemptTime.toString());
        
        // Show toast before redirect
        toast({
          title: "Registration successful",
          description: "Your account has been created!",
          duration: 3000,
        });
        
        // Verify the session was established
        try {
          const headers = await getAuthHeaders();
          const verifyResponse = await fetch('/api/auth/status', {
            credentials: 'include',
            headers
          });
          
          const verifyData = await verifyResponse.json();
          console.log('Session verification after registration:', verifyData);
        } catch (verifyError) {
          console.warn('Session verification failed (but continuing):', verifyError);
        }
        
        // Navigate after a longer delay to ensure session is fully established
        setTimeout(() => {
          // For more reliable navigation, use full page reload instead of React Router
          window.location.href = '/quotes';
        }, 800); // Increased delay to ensure session is established
      } else {
        throw new Error('Registration response missing user data');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
      toast({
        title: "Registration failed",
        description: err instanceof Error ? err.message : 'Registration failed',
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [navigate, toast, getAuthHeaders]);

  // Real logout function that connects to the server
  const logout = async () => {
    setIsLoading(true);

    try {
      console.log('Logging out user from auth context...');
      
      // Show toast before any operations
      toast({
        title: "Logging out...",
        description: "Please wait while we sign you out",
        duration: 2000,
      });
      
      // Clear the user state immediately for responsive UI
      setUser(null);
      
      // Clear tokens from localStorage
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
      localStorage.removeItem('lastLoginSuccess');
      
      // Call the server logout endpoint to invalidate the refresh token
      // Get refresh token from localStorage as fallback
      const fallbackRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache', 
          'Expires': '0'
        },
        body: fallbackRefreshToken ? JSON.stringify({ refreshToken: fallbackRefreshToken }) : undefined
      });
      
      // Use window.location for more reliable redirect instead of React navigation
      console.log('Force redirecting to auth page');
      window.location.href = '/auth';
    } catch (err) {
      console.error('Logout error in auth context:', err);
      
      // Even on error, ensure the user is set to null
      setUser(null);
      
      // Clear tokens anyway on error
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
      localStorage.removeItem('lastLoginSuccess');
      
      // Show a toast and try to navigate to auth page as fallback
      toast({
        title: "Logout error",
        description: "There was an issue signing you out, but we'll redirect you anyway",
        variant: "destructive",
        duration: 3000,
      });
      
      // Last resort fallback to ensure logout
      setTimeout(() => {
        window.location.href = '/auth?force-logout=true&error=true&t=' + new Date().getTime();
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  // Reload user function to refresh user data from the server
  const reloadUser = async () => {
    try {
      // Get auth headers with potentially refreshed token
      const headers = await getAuthHeaders();
      
      const response = await fetch('/api/auth/status', {
        credentials: 'include',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          return;
        }
      }

      // If we get here, either the response was not ok or the user is not authenticated
      // This can happen if the session expired and token refresh failed
      setUser(null);
    } catch (err) {
      console.error('Error reloading user:', err);
      // On error, keep the current user state
    }
  };

  // Method to update user data locally
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({
        ...user,
        ...userData
      });
    }
  };

  // Create the context value with useMemo to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    reloadUser,
    updateUser
  }), [user, isLoading, error, login, register]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}